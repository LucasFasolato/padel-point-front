'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Club, Court } from '@/types';
import { MapPin, Phone, Calendar, Info, ArrowLeft, ImageOff, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

// Helper type to handle potentially missing media from backend
interface ClubOverview {
  club: Club;
  courts: Court[];
}

export default function ClubLandingPage() {
  const params = useParams();
  const router = useRouter();
  const clubId = params.id as string;

  const [data, setData] = useState<ClubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clubId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch Club Info and Courts (Corrected Endpoints)
        // We use the endpoints we actually built in the previous steps
        const [clubRes, courtsRes] = await Promise.all([ api.get(`/public/clubs/${clubId}`), api.get(`/public/courts/club/${clubId}`) ]);

        setData({
           club: clubRes.data,
           courts: courtsRes.data || []
        });

      } catch (err) {
        console.error("Error loading club data", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clubId]);

  const handleBookClick = (courtId: string) => {
    // Navigate to the booking page for this specific court
    // We will build this page next!
    router.push(`/club/${clubId}/booking/${courtId}`);
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
    </div>
  );

  if (error || !data) return (
    <div className="flex h-screen flex-col items-center justify-center bg-slate-50 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Club Not Found</h2>
        <Link href="/" className="mt-4 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold">
            Back to Home
        </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      
      {/* Hero Section */}
      <div className="relative h-64 w-full overflow-hidden md:h-80 bg-slate-900">
        {/* Placeholder Cover (Since we haven't built Image Upload yet) */}
        <div className="absolute inset-0 bg-slate-800" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <Link href="/" className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all z-20">
            <ArrowLeft size={24} />
        </Link>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 z-10">
            <div className="mx-auto max-w-7xl flex items-end gap-6">
                {/* Logo Placeholder */}
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl md:h-32 md:w-32 -mb-10 md:-mb-12 relative z-10 flex items-center justify-center bg-slate-100 text-slate-400">
                     <span className="text-4xl font-bold">
                        {data.club.nombre ? data.club.nombre.substring(0, 1).toUpperCase() : 'C'}
                     </span>
                </div>
                
                <div className="mb-2 text-white flex-1">
                    <h1 className="text-3xl font-bold md:text-5xl tracking-tight text-white">{data.club.nombre}</h1>
                    <p className="flex items-center gap-2 text-sm md:text-base text-slate-300 mt-2 font-medium">
                        <MapPin size={18} className="text-blue-400" /> {data.club.direccion}
                    </p>
                </div>
            </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-16 md:px-8">
        
        {/* Contact Info */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Phone size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Phone</p>
              <p className="font-semibold text-slate-900">{data.club.telefono || 'No registered'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="rounded-xl bg-green-50 p-3 text-green-600"><Calendar size={24} /></div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</p>
              <p className="font-semibold text-green-700">Open for Bookings</p>
            </div>
          </div>
        </div>

        {/* Court List */}
        <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold text-slate-900">Our Courts</h2>
             <span className="text-sm font-medium text-slate-500">{data.courts.length} courts available</span>
        </div>
        
        {data.courts.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <div className="inline-flex p-4 rounded-full bg-slate-50 mb-4 text-slate-300">
                    <ImageOff size={32} />
                </div>
                <p className="text-slate-500 font-medium">No courts available yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.courts.map((court) => (
                <div key={court.id} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                
                {/* Court Image Placeholder */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                    {/* Since we don't have images yet, we use a nice placeholder */}
                    <div className="text-slate-300 font-bold text-6xl opacity-20 select-none">
                        PADEL
                    </div>
                    
                    <div className="absolute top-4 right-4 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-900 shadow-lg">
                        {formatCurrency(Number(court.precioPorHora))}
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{court.nombre}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                         <Info size={16} className="text-blue-500" />
                         <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{court.superficie}</span>
                    </div>
                    
                    <button 
                        onClick={() => handleBookClick(court.id)}
                        className="mt-auto w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white hover:bg-blue-600 active:scale-95 transition-all shadow-lg shadow-slate-200"
                    >
                        Book Now
                    </button>
                </div>
                </div>
            ))}
            </div>
        )}
      </main>
    </div>
  );
}