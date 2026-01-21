'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { Club, Court } from '@/types';
import { MapPin, Phone, Calendar, Info, ArrowLeft, ImageOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface ClubOverview {
  club: Club;
  media: { 
    logo: { secureUrl: string } | null; 
    cover: { secureUrl: string } | null; 
  };
  courts: Court[];
}

export default function ClubLandingPage() {
  const params = useParams();
  const clubId = params.id as string;

  const [data, setData] = useState<ClubOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!clubId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 1. Parallel Fetching: Get Club Info AND Courts List separately
        const [clubRes, courtsRes] = await Promise.all([
            api.get(`/public/clubs/${clubId}`),          // Endpoint 1: Club Info
            api.get(`/public/courts/club/${clubId}`)     // Endpoint 2: Courts List
        ]);

        // 2. Normalize the Club Data
        // (Handles if your club endpoint returns { club: {...} } or just {...})
        const clubData = clubRes.data.club ? clubRes.data.club : clubRes.data;
        const mediaData = clubRes.data.media || { logo: null, cover: null };

        // 3. Set the combined state
        setData({
            club: clubData,
            media: mediaData,
            courts: courtsRes.data || [] // Uses the data from your new Courts Endpoint
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

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading...</p>
        </div>
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
        {data.media.cover?.secureUrl && (
          <img 
            src={data.media.cover.secureUrl} 
            className="h-full w-full object-cover opacity-80" 
            alt="Club Cover" 
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <Link href="/" className="absolute top-6 left-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-all">
            <ArrowLeft size={24} />
        </Link>

        <div className="absolute bottom-0 left-0 w-full p-6 md:p-8">
            <div className="mx-auto max-w-7xl flex items-end gap-6">
                <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-2xl md:h-32 md:w-32 -mb-10 md:-mb-12 relative z-10 flex items-center justify-center bg-slate-100">
                    {data.media.logo?.secureUrl ? (
                        <img src={data.media.logo.secureUrl} className="h-full w-full object-contain" alt="Logo" />
                    ) : (
                        <span className="text-slate-400 font-bold text-3xl">
                            {data.club.nombre ? data.club.nombre.substring(0, 1).toUpperCase() : 'C'}
                        </span>
                    )}
                </div>
                <div className="mb-2 text-white flex-1">
                    <h1 className="text-3xl font-bold md:text-5xl tracking-tight">{data.club.nombre}</h1>
                    <p className="flex items-center gap-2 text-sm md:text-base text-slate-200 mt-2">
                        <MapPin size={16} className="text-blue-400" /> {data.club.direccion}
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
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Phone</p>
              <p className="font-semibold text-slate-900">{data.club.telefono}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <div className="rounded-xl bg-green-50 p-3 text-green-600"><Calendar size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Status</p>
              <p className="font-semibold text-green-700">Open for Bookings</p>
            </div>
          </div>
        </div>

        {/* Court List */}
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Our Courts</h2>
        
        {data.courts.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-300">
                <p className="text-slate-500">No courts available yet.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {data.courts.map((court) => (
                <div key={court.id} className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 hover:shadow-xl transition-all">
                
                {/* Image Section: Handles if photo exists or not */}
                <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    {/* Check if primaryPhoto exists and has a URL */}
                    {court.primaryPhoto?.secureUrl ? (
                        <>
                            <img 
                                src={court.primaryPhoto.secureUrl} 
                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                                alt={court.nombre} 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                        </>
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-slate-200">
                            <ImageOff className="text-slate-400" size={40} />
                        </div>
                    )}

                    <div className="absolute top-4 right-4 rounded-full bg-white px-4 py-1.5 text-sm font-bold text-slate-900 shadow-lg">
                        {formatCurrency(court.precioPorHora)}
                    </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{court.nombre}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
                         <Info size={16} className="text-blue-500" />
                         <span>{court.superficie}</span>
                    </div>
                    
                    <button 
                        onClick={() => window.location.href = `/club/${data.club.id}/booking/${court.id}`}
                        className="mt-auto w-full rounded-xl bg-slate-900 py-3.5 font-bold text-white hover:bg-blue-600 transition-colors"
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