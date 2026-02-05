'use client';

import React, { useEffect, useState } from 'react';
import { useClubStore } from '@/store/club-store';
import { User, Shield, Trash2, Mail, Plus, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import Modal from '@/app/components/ui/modal';

// Tipo local para la lista
interface ClubMember {
  id: string; // ID de la membresía
  role: 'ADMIN' | 'STAFF';
  active: boolean;
  user: {
    id: string;
    email: string;
    // Agrega nombre si lo tienes en tu DB
  };
}

export default function MembersPage() {
  const { activeClub } = useClubStore();
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(false);

  // Estado para Modal de invitación
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('STAFF');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    if (activeClub) fetchMembers();
  }, [activeClub]);

  const fetchMembers = async () => {
    if (!activeClub) return;
    setLoading(true);
    try {
      // Endpoint basado en tu ClubMembersController: GET /clubs/:clubId/members
      const res = await api.get(`/clubs/${activeClub.id}/members`);
      setMembers(res.data);
    } catch (error) {
      console.error('Error fetching members', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeClub) return;
    setInviting(true);
    try {
      // Endpoint: POST /clubs/:clubId/members
      await api.post(`/clubs/${activeClub.id}/members`, {
        email: inviteEmail,
        role: inviteRole,
      });
      await fetchMembers(); // Recargar lista
      setIsModalOpen(false);
      setInviteEmail('');
      alert('Miembro agregado correctamente');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(error);
      // Manejo básico de errores (ej: usuario no existe)
      if (error.response?.status === 404) {
        alert('El usuario con ese email no está registrado en PadelPoint.');
      } else {
        alert('Error al agregar miembro.');
      }
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!confirm('¿Quitar acceso a este usuario?')) return;
    // Aquí necesitarías un endpoint DELETE en tu backend si quieres permitir esto
    // Por ahora lo dejamos como placeholder visual o Patch a active:false
    alert('Funcionalidad de eliminar pendiente de implementación en backend');
  };

  if (!activeClub)
    return (
      <div className="flex h-96 flex-col items-center justify-center text-textMuted">
        <User size={48} className="mb-4 opacity-50" />
        <p>Selecciona un club primero.</p>
      </div>
    );

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text">Equipo del Club</h1>
          <p className="text-textMuted">Gestiona quién tiene acceso a {activeClub.nombre}</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95"
        >
          <Plus size={18} /> Agregar Miembro
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface2 text-textMuted">
            <tr>
              <th className="px-6 py-4 font-bold">Usuario</th>
              <th className="px-6 py-4 font-bold">Rol</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 text-right font-bold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-8 text-center">
                  <Loader2 className="mx-auto animate-spin text-primary" />
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-textMuted">
                  No hay miembros adicionales.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.id} className="hover:bg-surface2/60">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 font-bold">
                        {member.user.email[0].toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-text">{member.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                        member.role === 'ADMIN'
                          ? 'bg-surface2 text-text border border-border'
                          : 'bg-brand-100 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {member.role === 'ADMIN' && <Shield size={12} />}
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-xs font-bold ${
                        member.active ? 'text-success' : 'text-textMuted'
                      }`}
                    >
                      {member.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRemove(member.user.id)}
                      className="rounded-lg p-2 text-textMuted transition-colors hover:bg-danger/10 hover:text-danger"
                      title="Revocar acceso"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DE INVITACIÓN */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Agregar Miembro">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="mb-4 flex gap-3 rounded-xl border border-border bg-surface2 p-4 text-sm text-text">
            <AlertCircle className="shrink-0 text-primary" size={20} />
            <p className="text-textMuted">
              El usuario debe estar registrado en la plataforma previamente con este email.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-text">Email del Usuario</label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-textMuted" size={18} />
              <input
                type="email"
                required
                className="w-full rounded-xl border border-border bg-surface p-2.5 pl-10 outline-none focus:ring-2 focus:ring-ring"
                placeholder="usuario@email.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text">Rol</label>
            <select
              className="mt-1 w-full rounded-xl border border-border bg-surface p-2.5 outline-none focus:ring-2 focus:ring-ring"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
            >
              <option value="STAFF">Staff (Puede ver y gestionar reservas)</option>
              <option value="ADMIN">Admin (Acceso total al club)</option>
            </select>
          </div>

          <button
            disabled={inviting}
            type="submit"
            className="mt-4 flex w-full justify-center rounded-xl bg-slate-900 py-3 font-bold text-white transition-colors hover:bg-blue-600 disabled:opacity-70"
          >
            {inviting ? <Loader2 className="animate-spin" /> : 'Dar Acceso'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
