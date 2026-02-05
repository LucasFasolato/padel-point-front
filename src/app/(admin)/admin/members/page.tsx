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
      console.error("Error fetching members", error);
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
        role: inviteRole
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

  if (!activeClub) return (
    <div className="flex h-96 flex-col items-center justify-center text-slate-400">
        <User size={48} className="mb-4 opacity-50"/>
        <p>Selecciona un club primero.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipo del Club</h1>
          <p className="text-slate-500">Gestiona quién tiene acceso a {activeClub.nombre}</p>
        </div>
        <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-600 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} /> Agregar Miembro
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-6 py-4 font-bold">Usuario</th>
              <th className="px-6 py-4 font-bold">Rol</th>
              <th className="px-6 py-4 font-bold">Estado</th>
              <th className="px-6 py-4 font-bold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
             {loading ? (
                 <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
             ) : members.length === 0 ? (
                 <tr><td colSpan={4} className="py-8 text-center text-slate-500">No hay miembros adicionales.</td></tr>
             ) : (
                 members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                    {member.user.email[0].toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-900">{member.user.email}</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${member.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                {member.role === 'ADMIN' && <Shield size={12}/>}
                                {member.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${member.active ? 'text-green-600' : 'text-slate-400'}`}>
                                {member.active ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <button 
                                onClick={() => handleRemove(member.user.id)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
            <div className="bg-blue-50 p-4 rounded-xl flex gap-3 text-blue-700 text-sm mb-4">
                <AlertCircle className="shrink-0" size={20}/>
                <p>El usuario debe estar registrado en la plataforma previamente con este email.</p>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-700">Email del Usuario</label>
                <div className="relative mt-1">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                    <input 
                        type="email" 
                        required 
                        className="w-full rounded-xl border border-slate-300 p-2.5 pl-10 outline-none focus:ring-2 focus:ring-blue-500" 
                        placeholder="usuario@email.com"
                        value={inviteEmail}
                        onChange={e => setInviteEmail(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <label className="text-sm font-medium text-slate-700">Rol</label>
                <select 
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                >
                    <option value="STAFF">Staff (Puede ver y gestionar reservas)</option>
                    <option value="ADMIN">Admin (Acceso total al club)</option>
                </select>
            </div>

            <button 
                disabled={inviting} 
                type="submit" 
                className="w-full rounded-xl bg-slate-900 py-3 font-bold text-white hover:bg-blue-600 transition-colors disabled:opacity-70 mt-4 flex justify-center"
            >
                {inviting ? <Loader2 className="animate-spin"/> : 'Dar Acceso'}
            </button>
        </form>
      </Modal>
    </div>
  );
}