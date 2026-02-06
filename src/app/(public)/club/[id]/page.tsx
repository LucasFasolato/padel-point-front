'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { AlertCircle, ChevronLeft, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { PlayerService } from '@/services/player-service';
import { MediaService } from '@/services/media-service';
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
import { BookingDrawer } from '@/app/components/public/booking';

export default function ClubPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const {
    selectedDate,
    setDate,
    setSelectedSlot,
    setCourt,
    setClub: setStoreClub,
    setAvailabilityForCourt,
    openDrawer,
  } = useBookingStore();

  const [club, setClub] = useState<Club | null>(null);
  const [assets, setAssets] = useState<{ cover?: PublicMedia | null; logo?: PublicMedia | null }>({});
  const [courts, setCourts] = useState<Court[]>([]);

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
    return { secureUrl: secureUrl ?? '', url: url ?? '' };
  };

  // Initial Load
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setClub(clubData);
        setStoreClub(clubData);

        setAssets({
          logo: overview.media.logo,
          cover: overview.media.cover,
        });

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

        try {
          const [logoAsset, coverAsset, primaryAssets] = await Promise.all([
            MediaService.getClubLogo(overview.club.id),
            MediaService.getClubCover(overview.club.id),
            Promise.all(mappedCourts.map((court) => MediaService.getCourtPrimary(court.id))),
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
          // Ignore media errors
        }
      } catch (e) {
        console.error('Failed to load club overview', e);
      } finally {
        setInitLoading(false);
      }
    };

    initData();
  }, [id, setStoreClub]);

  // Fetch Availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (courts.length === 0) return;

      const dateStr = format(selectedDate, 'yyyy-MM-dd');

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
          } catch (e: unknown) {
            const err = e as { response?: { data?: { message?: string } } };
            const msg = err?.response?.data?.message || 'No pudimos cargar los horarios.';
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
  }, [selectedDate, courts, setAvailabilityForCourt]);

  // Prefill from "Reservar de nuevo"
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

  const handleSlotSelect = useCallback(
    (slot: AvailabilitySlot, court: Court) => {
      setSelectedSlot(slot);
      setCourt(court);
      openDrawer();
    },
    [setSelectedSlot, setCourt, openDrawer]
  );

  // --- LOADING STATE ---
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

  // --- NOT FOUND STATE ---
  if (!club) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <AlertCircle className="mb-2 h-10 w-10 text-slate-300" />
        <h2 className="text-lg font-bold text-slate-700">Club no encontrado</h2>
        <p className="text-slate-500">Es posible que el enlace sea incorrecto o el club no exista.</p>
        <Link
          href="/"
          className="mt-5 inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-600"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* ============================================
          HEADER FIJO - Volver a Home
          ============================================ */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          {/* Botón Volver */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/')}
            className="group flex items-center gap-2 rounded-full bg-slate-100 py-2 pl-2.5 pr-4 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-200 hover:text-slate-900"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:-translate-x-0.5">
              <ChevronLeft size={14} className="text-slate-600" />
            </span>
            <span className="hidden sm:inline">Volver</span>
          </motion.button>

          {/* Club name (center) */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <p className="max-w-[180px] truncate text-sm font-bold text-slate-900 sm:max-w-none">
              {club.nombre}
            </p>
          </div>

          {/* Home icon (right) */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push('/')}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Ir al inicio"
          >
            <Home size={18} />
          </motion.button>
        </div>
      </header>

      {/* ============================================
          HERO
          ============================================ */}
      <ClubHero club={club} cover={assets.cover} logo={assets.logo} />

      {/* ============================================
          DATE NAVIGATOR (Sticky below header)
          ============================================ */}
      <div className="sticky top-14 z-30 -mt-6">
        <DateNavigator selectedDate={selectedDate} onSelect={setDate} />
      </div>

      {/* ============================================
          COURTS LIST
          ============================================ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="mx-auto max-w-md space-y-6 px-4 pt-8 sm:max-w-3xl"
      >
        {/* Section Header */}
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-900">Canchas Disponibles</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {courts.length} {courts.length === 1 ? 'Pista' : 'Pistas'}
          </span>
        </div>

        {/* Prefill Hint */}
        <AnimatePresence>
          {prefillHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {prefillHint}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Court Cards */}
        {courts.map((court, idx) => (
          <motion.div
            key={court.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.1 }}
          >
            <CourtCard
              court={court}
              slots={availability[court.id] || []}
              loading={!!loadingByCourt[court.id]}
              error={errorByCourt[court.id] || null}
              onSlotSelect={(slot) => handleSlotSelect(slot, court)}
            />
          </motion.div>
        ))}

        {/* Empty State */}
        {courts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center"
          >
            <p className="font-medium text-slate-900">No hay canchas configuradas</p>
            <p className="text-sm text-slate-500">Este club aún no tiene pistas activas.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Ver otros clubes
            </Link>
          </motion.div>
        )}
      </motion.div>

      {/* ============================================
          BOOKING DRAWER
          ============================================ */}
      <BookingDrawer />
    </div>
  );
}
