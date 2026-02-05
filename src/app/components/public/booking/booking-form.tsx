import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, User } from 'lucide-react';
import { Input } from '@/app/components/ui/input';

interface BookingFormProps {
  nombre: string;
  setNombre: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  telefono: string;
  setTelefono: (value: string) => void;
  isCreatingHold: boolean;
  nombreOk: boolean;
  emailOk: boolean;
  profileLoading: boolean;
  profilePrefilled: boolean;
  authToken: string | null;
  onLoginClick: () => void;
}

export function BookingForm({
  nombre,
  setNombre,
  email,
  setEmail,
  telefono,
  setTelefono,
  isCreatingHold,
  nombreOk,
  emailOk,
  profileLoading,
  profilePrefilled,
  authToken,
  onLoginClick,
}: BookingFormProps) {
  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {profileLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Cargando tus datos...
          </motion.div>
        )}
        {profilePrefilled && !profileLoading && (
          <motion.div
            key="prefilled"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-xs text-emerald-700 ring-1 ring-emerald-100"
          >
            <User size={14} />
            Completamos tus datos. Podés editarlos si querés.
          </motion.div>
        )}
      </AnimatePresence>

      {/* Name */}
      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej: Lucas"
        disabled={isCreatingHold}
        error={!nombreOk && nombre.trim() ? 'Mínimo 2 caracteres.' : undefined}
        required
      />

      {/* Email */}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="tu@email.com"
        disabled={isCreatingHold}
        error={email.trim() && !emailOk ? 'Ingresá un email válido.' : undefined}
        hint={!email.trim() ? 'Te enviaremos la confirmación.' : undefined}
        required
      />

      {/* Phone */}
      <Input
        label="Teléfono (opcional)"
        value={telefono}
        onChange={(e) => setTelefono(e.target.value)}
        placeholder="+54 9 341..."
        disabled={isCreatingHold}
      />

      {/* Login hint */}
      {!authToken && (
        <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
          <p className="text-xs text-slate-500">
            <button
              type="button"
              onClick={onLoginClick}
              className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Iniciá sesión
            </button>{' '}
            para completar tus datos automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}
