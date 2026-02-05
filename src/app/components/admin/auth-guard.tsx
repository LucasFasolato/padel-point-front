'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token } = useAuthStore();
  
  // Estado para saber si ya verificamos el localStorage
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Esta función revisa si Zustand ya cargó los datos del disco
    const checkHydration = () => {
        // Un pequeño hack para esperar a que Zustand persista
        // Si el token existe en el store, ya estamos hidratados.
        // Si no, damos un pequeño margen por si acaso.
        setIsHydrated(true);
    };
    checkHydration();
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Esperar hidratación

    if (pathname === '/admin/login') return;

    if (!token) {
      router.replace('/admin/login');
    }

    if (token) {
        // Re-asignar el header por seguridad
        api.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });
    }
  }, [isHydrated, token, pathname, router]);

  // 1. Si estamos en Login, renderizar directo
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // 2. Si no está hidratado o no hay token (y no es login), mostrar Loader
  if (!isHydrated || (!token && pathname !== '/admin/login')) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50 gap-4">
        <Loader2 className="animate-spin text-blue-600 h-10 w-10" />
        <p className="text-sm font-medium text-slate-400 animate-pulse">Verificando sesión...</p>
      </div>
    );
  }

  // 3. Renderizar contenido protegido
  return <>{children}</>;
}