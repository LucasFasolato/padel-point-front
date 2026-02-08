'use client';

import { useState } from 'react';
import { Plus, X, Mail, Send } from 'lucide-react';
import Modal from '@/app/components/ui/modal';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';

interface InviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (emails: string[]) => void;
  isPending?: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteModal({ isOpen, onClose, onSubmit, isPending }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [error, setError] = useState('');

  const addEmail = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    if (!EMAIL_RE.test(trimmed)) {
      setError('Ingresá un email válido');
      return;
    }
    if (emails.includes(trimmed)) {
      setError('Este email ya fue agregado');
      return;
    }

    setEmails((prev) => [...prev, trimmed]);
    setEmail('');
    setError('');
  };

  const removeEmail = (target: string) => {
    setEmails((prev) => prev.filter((e) => e !== target));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleSubmit = () => {
    if (emails.length === 0) {
      setError('Agregá al menos un email');
      return;
    }
    onSubmit(emails);
  };

  const handleClose = () => {
    setEmail('');
    setEmails([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Invitar jugadores">
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="email"
              placeholder="email@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyDown}
              error={error}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={addEmail}
            className="shrink-0"
            aria-label="Agregar email"
          >
            <Plus size={16} />
          </Button>
        </div>

        {emails.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">
              {emails.length} {emails.length === 1 ? 'invitación' : 'invitaciones'}
            </p>
            <div className="flex flex-wrap gap-2">
              {emails.map((e) => (
                <span
                  key={e}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-700"
                >
                  <Mail size={12} className="text-slate-400" />
                  {e}
                  <button
                    type="button"
                    onClick={() => removeEmail(e)}
                    className="ml-0.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          fullWidth
          size="lg"
          onClick={handleSubmit}
          loading={isPending}
          disabled={emails.length === 0}
        >
          <Send size={16} />
          Enviar invitaciones
        </Button>
      </div>
    </Modal>
  );
}
