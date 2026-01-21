'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Loader2, Lock, Mail } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/auth/login', form);
      
      // --- DEBUG ---
      console.log("Respuesta del Backend:", res.data); 
      // -------------

      // 1. Detectar el token (a veces se llama access_token, a veces token)
      const token = res.data.accessToken ||res.data.access_token || res.data.token;
      
      if (!token) {
        throw new Error('El servidor no devolvió un token válido.');
      }

      // 2. Detectar el usuario (si el backend no lo manda, usamos el email del form temporalmente)
      // Si tu backend devuelve "user": { ... }, úsalo. Si no, creamos uno falso para que no falle.
      const user = res.data.user || { userId: 'temp-id', email: form.email, role: 'ADMIN' };

      // 3. Guardar en Store
      setAuth(token, user);

      // 4. Redirigir
      // Usamos replace para que no pueda volver atrás con el botón del navegador
      router.replace('/admin/dashboard');

    } catch (err: unknown) {
      console.error(err);
      setError('Credenciales inválidas o error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Lock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Access</h1>
          <p className="text-slate-500 mt-2">Gestioná tu club desde aquí</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                <input
                  type="email"
                  required
                  className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  placeholder="admin@club.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                required
                className="w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-slate-900 py-3 font-bold text-white transition-all hover:bg-blue-600 disabled:opacity-70"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}