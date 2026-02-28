'use client';

import { Globe, Lock, LogOut, Mail, ShieldCheck, Smartphone, User } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useLogout } from '@/hooks/use-logout';
import { useAuthIdentities } from '@/hooks/use-auth-identities';
import { PublicTopBar } from '@/app/components/public/public-topbar';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';
import { ListItem } from '@/app/components/ui/list-item';
import type { IdentityProvider } from '@/services/auth-identities-service';

// ─── helpers ────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

function ProviderIcon({ provider }: { provider: IdentityProvider }) {
  if (provider === 'google') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500">
        <Globe size={16} className="text-white" />
      </div>
    );
  }
  if (provider === 'apple') {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900">
        <Smartphone size={16} className="text-white" />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E7C66]">
      <Mail size={16} className="text-white" />
    </div>
  );
}

function GhostProviderRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <ListItem
      leading={
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
          {icon}
        </div>
      }
      title={label}
      trailing={<span className="text-xs text-slate-400">Próximamente</span>}
      static
    />
  );
}

const PROVIDER_LABEL: Record<IdentityProvider, string> = {
  google: 'Google',
  apple: 'Apple',
  password: 'Correo y contraseña',
};

const CONNECTED_BADGE = (
  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#0E7C66]">
    Conectado
  </span>
);

// ─── page ───────────────────────────────────────────────────────────────────

export default function SecurityPage() {
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: identities, isLoading, isError } = useAuthIdentities();

  const isStaging =
    typeof window !== 'undefined' && window.location.hostname.includes('staging');

  const hasPassword = identities?.some((id) => id.provider === 'password') ?? false;
  const hasGoogle = identities?.some((id) => id.provider === 'google') ?? false;
  const hasApple = identities?.some((id) => id.provider === 'apple') ?? false;

  // When the endpoint doesn't exist we fall back to showing email + ghost CTAs.
  const endpointUnavailable = isError;

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicTopBar title="Seguridad" backHref="/me" />

      <div className="space-y-4 px-4 py-4 pb-24">
        {/* ── 1. Sesión actual ────────────────────────────────────────────── */}
        <Card padding="md" as="section">
          <SectionLabel>Sesión actual</SectionLabel>

          <div className="-mx-4 divide-y divide-slate-50">
            <ListItem
              leading={
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50">
                  <User size={16} className="text-[#0E7C66]" />
                </div>
              }
              title={user?.email ?? '—'}
              subtitle="Sesión activa"
              static
            />

            {isStaging && (
              <ListItem
                title="Entorno"
                trailing={
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Staging
                  </span>
                }
                static
              />
            )}
          </div>

          <div className="mt-4">
            <Button variant="danger" fullWidth onClick={() => void logout()}>
              <LogOut size={16} />
              Cerrar sesión
            </Button>
          </div>
        </Card>

        {/* ── 2. Métodos de acceso ─────────────────────────────────────────── */}
        <Card padding="md" as="section">
          <SectionLabel>Métodos de acceso</SectionLabel>

          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full rounded-xl" />
              <Skeleton className="h-14 w-full rounded-xl" />
            </div>
          ) : endpointUnavailable ? (
            /* Fallback: show email row + disabled CTAs */
            <div className="-mx-4 divide-y divide-slate-50">
              <ListItem
                leading={
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0E7C66]">
                    <Mail size={16} className="text-white" />
                  </div>
                }
                title={user?.email ?? '—'}
                subtitle="Correo electrónico"
                trailing={CONNECTED_BADGE}
                static
              />
              <GhostProviderRow
                icon={<Globe size={16} className="text-slate-400" />}
                label="Conectar Google"
              />
              <GhostProviderRow
                icon={<Smartphone size={16} className="text-slate-400" />}
                label="Conectar Apple"
              />
            </div>
          ) : (
            <div className="-mx-4 divide-y divide-slate-50">
              {/* Connected providers */}
              {identities!.map((identity) => (
                <ListItem
                  key={identity.provider}
                  leading={<ProviderIcon provider={identity.provider} />}
                  title={PROVIDER_LABEL[identity.provider] ?? identity.provider}
                  subtitle={identity.email}
                  trailing={CONNECTED_BADGE}
                  static
                />
              ))}

              {/* Ghost CTAs for unconnected providers */}
              {!hasGoogle && (
                <GhostProviderRow
                  icon={<Globe size={16} className="text-slate-400" />}
                  label="Conectar Google"
                />
              )}
              {!hasApple && (
                <GhostProviderRow
                  icon={<Smartphone size={16} className="text-slate-400" />}
                  label="Conectar Apple"
                />
              )}
            </div>
          )}
        </Card>

        {/* ── 3. Recuperación ──────────────────────────────────────────────── */}
        {!isLoading && (
          <Card padding="md" as="section">
            <SectionLabel>Recuperación</SectionLabel>

            {!endpointUnavailable && hasPassword ? (
              <ListItem
                leading={
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                    <Lock size={16} className="text-slate-600" />
                  </div>
                }
                title="Cambiar contraseña"
                subtitle="Actualiza tu contraseña de acceso"
                trailing={<span className="text-xs text-slate-400">Próximamente</span>}
                static
              />
            ) : (
              <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
                <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#0E7C66]" />
                <p className="text-sm text-slate-600">
                  Tu cuenta usa{' '}
                  <span className="font-semibold text-slate-800">Google</span> para
                  iniciar sesión. No necesitás una contraseña.
                </p>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
