'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';

import { PlayerService } from '@/services/player-service';
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
    openDrawer,
  } = useBookingStore();

  // Local Data State
  const [club, setClub] = useState<Club | null>(null);
  const [assets, setAssets] = useState<{ cover?: PublicMedia | null; logo?: PublicMedia | null }>({});
  const [courts, setCourts] = useState<Court[]>([]);

  // Availability State
  const [availability, setAvailability] = useState<Record<string, AvailabilitySlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [initLoading, setInitLoading] = useState(true);

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

      setLoadingSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const nextAvailability: Record<string, AvailabilitySlot[]> = {};

      try {
        await Promise.all(
          courts.map(async (court) => {
            try {
              const slots = await PlayerService.getAvailability(court.id, dateStr);
              nextAvailability[court.id] = slots;
            } catch (err) {
              console.error(`Error fetching slots for court ${court.id}`, err);
              nextAvailability[court.id] = [];
            }
          })
        );

        setAvailability(nextAvailability);
      } catch (error) {
        console.error('Error fetching availability', error);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, courts]);

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
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-slate-400">Cargando club...</p>
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

        {courts.map((court) => (
          <CourtCard
            key={court.id}
            court={court}
            slots={availability[court.id] || []}
            loading={loadingSlots}
            onSlotSelect={(slot) => handleSlotSelect(slot, court)}
          />
        ))}

        {courts.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-12 text-center">
            <p className="font-medium text-slate-900">No hay canchas configuradas</p>
            <p className="text-sm text-slate-500">Este club aún no tiene pistas activas.</p>
          </div>
        )}
      </div>

      {/* 4) Booking Drawer */}
      <BookingDrawer />
    </div>
  );
}
