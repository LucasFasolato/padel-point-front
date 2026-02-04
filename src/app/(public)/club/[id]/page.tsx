'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

import { PlayerService } from '@/services/player-service';
import { MediaService } from '@/lib/media-service';
import type {
  Club,
  Court,
  AvailabilitySlot,
  PublicMedia,
  PublicClubOverview,
} from '@/types';

import { useBookingStore } from '@/store/booking-store';

import { ClubHero } from '@/app/components/public/club-hero';
import { DateNavigator } from '@/app/components/public/date-navigator';
import { CourtCard } from '@/app/components/public/court-card';
import { BookingDrawer } from '@/app/components/public/booking-drawer';

export default function ClubPage() {
  const params = useParams();
  const id = params.id as string;

  // Store (Global State for Booking)
  const {
    selectedDate,
    setDate,
    setSelectedSlot,
    setCourt,
    setClub: setStoreClub,
    setAvailabilityForCourt,
    openDrawer,
  } = useBookingStore();

  // Local Data State
  const [club, setClub] = useState<Club | null>(null);
  const [assets, setAssets] = useState<{ cover?: PublicMedia | null; logo?: PublicMedia | null }>({});
  const [courts, setCourts] = useState<Court[]>([]);

  // Availability State
  const [availability, setAvailability] = useState<Record<string, AvailabilitySlot[]>>({});
  const [loadingByCourt, setLoadingByCourt] = useState<Record<string, boolean>>({});
  const [errorByCourt, setErrorByCourt] = useState<Record<string, string | null>>({});
  const [initLoading, setInitLoading] = useState(true);
  const [prefillHint, setPrefillHint] = useState<string | null>(null);

  const toPublicMedia = (asset: { secureUrl?: string | null; url?: string | null } | null): PublicMedia | undefined => {
    if (!asset) return undefined;
    const secureUrl = asset.secureUrl || asset.url || undefined;
    const url = asset.url || asset.secureUrl || undefined;
    if (!secureUrl && !url) return undefined;
    return {
      secureUrl: secureUrl ?? '',
      url: url ?? '',
    };
  };

  // 1) Initial Load (Overview: club + media + courts)
  useEffect(() => {
    if (!id) return;

    const initData = async () => {
      try {
        const overview: PublicClubOverview = await PlayerService.getClubOverview(id);

        const clubData: Club = {
          id: overview.club.id,
          nombre: overview.club.nombre,
          direccion: overview.club.direccion,
          telefono: overview.club.telefono,
          email: overview.club.email,
          activo: overview.club.activo,
          latitud: overview.club.latitud,
          longitud: overview.club.longitud,

          // Estos dos no vienen en overview, pero tu type Club los tiene.
          // Los seteamos como empty para evitar undefined en UI.
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setClub(clubData);
        setStoreClub(clubData);

        setAssets({
          logo: overview.media.logo,
          cover: overview.media.cover,
        });

        // Adaptamos courts (overview) a tu Court type actual
        const mappedCourts: Court[] = overview.courts.map((c) => ({
          id: c.id,
          nombre: c.nombre,
          superficie: c.superficie,
          precioPorHora: Number(c.precioPorHora),
          activa: c.activa,
          clubId: overview.club.id,
          primaryImage: c.primaryPhoto ?? undefined, 
        }));

        setCourts(mappedCourts);

        // Fetch public media assets (logo/cover + court primary images)
        try {
          const [logoAsset, coverAsset, primaryAssets] = await Promise.all([
            MediaService.getClubLogo(overview.club.id),
            MediaService.getClubCover(overview.club.id),
            Promise.all(
              mappedCourts.map((court) => MediaService.getCourtPrimary(court.id))
            ),
          ]);

          setAssets({
            logo: toPublicMedia(logoAsset),
            cover: toPublicMedia(coverAsset),
          });

          setCourts((prev) =>
            prev.map((court, idx) => ({
              ...court,
              primaryImage: toPublicMedia(primaryAssets[idx]),
            }))
          );
        } catch {
          // Ignore media errors; keep overview data
        }
      } catch (e) {
        console.error('Failed to load club overview', e);
      } finally {
        setInitLoading(false);
      }
    };

    initData();
  }, [id, setStoreClub]);

  // 2) Fetch Availability (When Date or Courts change)
  useEffect(() => {
    const fetchAvailability = async () => {
      if (courts.length === 0) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');

      // mark all courts loading
      setLoadingByCourt(() => {
        const obj: Record<string, boolean> = {};
        for (const c of courts) obj[c.id] = true;
        return obj;
      });

      setErrorByCourt(() => {
        const obj: Record<string, string | null> = {};
        for (const c of courts) obj[c.id] = null;
        return obj;
      });

      await Promise.all(
        courts.map(async (court) => {
          try {
            const slots = await PlayerService.getAvailability(court.id, dateStr);
            setAvailability((prev) => ({ ...prev, [court.id]: slots }));
            setAvailabilityForCourt(court.id, slots);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } catch (e: any) {
            const msg = e?.response?.data?.message || 'No pudimos cargar los horarios.';
            setAvailability((prev) => ({ ...prev, [court.id]: [] }));
            setAvailabilityForCourt(court.id, []);
            setErrorByCourt((prev) => ({ ...prev, [court.id]: msg }));
          } finally {
            setLoadingByCourt((prev) => ({ ...prev, [court.id]: false }));
          }
        })
      );
    };

    fetchAvailability();
  }, [selectedDate, courts]);

  // 2.5) Prefill from "Reservar de nuevo"
  useEffect(() => {
    if (initLoading || !club || courts.length === 0) return;

    let payload: { clubId?: string; courtId?: string | null; startAt?: string } | null = null;
    try {
      const raw = sessionStorage.getItem('padel-prefill-reservation');
      if (!raw) return;
      payload = JSON.parse(raw);
    } catch {
      return;
    }

    if (!payload?.clubId || payload.clubId !== club.id || !payload.startAt) {
      return;
    }

    const targetCourt = payload.courtId
      ? courts.find((court) => court.id === payload.courtId) || null
      : null;

    setDate(new Date(payload.startAt));
    if (targetCourt) {
      setCourt(targetCourt);
    }

    setPrefillHint('Preseleccionamos tu última reserva. Podés ajustar fecha y horario.');

    try {
      sessionStorage.removeItem('padel-prefill-reservation');
    } catch {}
  }, [initLoading, club, courts, setDate, setCourt]);

  // 3) Interaction Handler
  const handleSlotSelect = useCallback(
    (slot: AvailabilitySlot, court: Court) => {
      setSelectedSlot(slot);
      setCourt(court);
      openDrawer();
    },
    [setSelectedSlot, setCourt, openDrawer]
  );

  // --- RENDER STATES ---

  if (initLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="animate-pulse">
          <div className="h-44 w-full bg-slate-200" />
          <div className="mx-auto max-w-md space-y-4 px-4 pt-6 sm:max-w-3xl">
            <div className="h-10 w-2/3 rounded-full bg-slate-200" />
            <div className="h-6 w-1/3 rounded-full bg-slate-200" />
            <div className="h-12 w-full rounded-2xl bg-slate-200" />
            <div className="space-y-4 pt-6">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-100"
                >
                  <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-5 py-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 rounded-full bg-slate-200" />
                      <div className="h-3 w-24 rounded-full bg-slate-200" />
                    </div>
                    <div className="h-6 w-20 rounded-full bg-slate-200" />
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                      {Array.from({ length: 10 }).map((__, idx) => (
                        <div
                          key={idx}
                          className="h-20 rounded-xl border border-slate-200 bg-slate-100"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="mb-2 h-10 w-10 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-700">Club no encontrado</h2>
        <p className="text-slate-500">Es posible que el enlace sea incorrecto o el club no exista.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-blue-600"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* 1) Hero */}
      <ClubHero club={club} cover={assets.cover} logo={assets.logo} />

      {/* 2) Date Navigator (Sticky) */}
      <div className="sticky top-0 z-30 -mt-6">
        <DateNavigator selectedDate={selectedDate} onSelect={setDate} />
      </div>

      {/* 3) Courts List */}
      <div className="mx-auto max-w-md space-y-6 px-4 pt-8 sm:max-w-3xl">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-900">Canchas Disponibles</h2>
          <span className="text-xs font-medium text-slate-500">
            {courts.length} {courts.length === 1 ? 'Pista' : 'Pistas'}
          </span>
        </div>
        {prefillHint && (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            {prefillHint}
          </div>
        )}

        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            slots={availability[court.id] || []}
            loading={!!loadingByCourt[court.id]}
            error={errorByCourt[court.id] || null}
            onSlotSelect={(slot) => handleSlotSelect(slot, court)}
          />
        ))}

        {courts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="font-medium text-slate-900">No hay canchas configuradas</p>
            <p className="text-sm text-slate-500">Este club aún no tiene pistas activas.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Ver otros clubes
            </Link>
          </div>
        )}
      </div>

      {/* 4) Booking Drawer */}
      <BookingDrawer />
    </div>
  );
}
