'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { PlayerService } from '@/services/player-service';
import { Club, Court, MediaAsset, AvailabilitySlot } from '@/types';
import { useBookingStore } from '@/store/booking-store';

// Components
import { ClubHero } from '@/app/components/public/club-hero';
import { DateNavigator } from '@/app/components/public/date-navigator';
import { CourtCard } from '@/app/components/public/court-card';
import { Loader2 } from 'lucide-react';
// import { BookingDrawer } from '@/components/public/booking-drawer'; // Next Step

export default function ClubPage() {
  const params = useParams();
  const id = params.id as string;
  
  // Local State for Data
  const [club, setClub] = useState<Club | null>(null);
  const [assets, setAssets] = useState<{
    cover?: MediaAsset | null;
    logo?: MediaAsset | null;
  }>({});
  const [courts, setCourts] = useState<Court[]>([]);
  
  // Availability State
  // Map: CourtId -> List of Slots
  const [availability, setAvailability] = useState<Record<string, AvailabilitySlot[]>>({});
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Store
  const { selectedDate, setDate } = useBookingStore();

  // 1. Initial Load (Club Info)
  useEffect(() => {
    const loadClub = async () => {
      try {
        const [clubData, courtsData, assetsData] = await Promise.all([
          PlayerService.getClub(id),
          PlayerService.getCourts(id),
          PlayerService.getClubAssets(id)
        ]);
        setClub(clubData);
        setCourts(courtsData);
        setAssets(assetsData);
      } catch (e) {
        console.error("Failed to load club", e);
      }
    };
    if (id) loadClub();
  }, [id]);

  // 2. Dynamic Load (Availability when Date Changes)
  useEffect(() => {
    const loadAvailability = async () => {
      if (courts.length === 0) return;
      
      setLoadingSlots(true);
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const newAvail: Record<string, AvailabilitySlot[]> = {};

      // Fetch for all courts in parallel
      await Promise.all(courts.map(async (court) => {
        try {
          const slots = await PlayerService.getAvailability(court.id, dateStr);
          newAvail[court.id] = slots;
        } catch (e) {
          console.error(`Err avail ${court.id}`, e);
        }
      }));

      setAvailability(newAvail);
      setLoadingSlots(false);
    };

    loadAvailability();
  }, [selectedDate, courts]);

  if (!club) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-blue-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      
      {/* 3. Hero Section */}
      <ClubHero 
        club={club} 
        cover={assets.cover} 
        logo={assets.logo} 
      />

      {/* 4. Sticky Date Navigator */}
      <div className="relative -mt-6">
         <DateNavigator 
           selectedDate={selectedDate} 
           onSelect={setDate} 
         />
      </div>

      {/* 5. Courts Grid */}
      <div className="mx-auto max-w-md space-y-4 px-4 pt-6 sm:max-w-3xl">
        <h2 className="px-1 text-lg font-bold text-slate-900">Canchas Disponibles</h2>
        
        {courts.map(court => (
          <CourtCard 
            key={court.id}
            court={court}
            slots={availability[court.id] || []}
            loading={loadingSlots}
          />
        ))}

        {courts.length === 0 && (
          <div className="py-10 text-center text-slate-500">
            No se encontraron canchas en este club.
          </div>
        )}
      </div>

      {/* 6. Booking Drawer (Placeholder for Step 6) */}
      {/* <BookingDrawer /> */}

    </div>
  );
}