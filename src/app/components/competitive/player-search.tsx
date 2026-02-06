'use client';

import { useState, useEffect } from 'react';
import { Search, User, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Input } from '../ui/input';

interface Player {
  userId: string;
  email: string;
  displayName: string;
  elo?: number | null;
  category?: number | null;
}

interface PlayerSearchProps {
  onSelect: (player: Player) => void;
  selectedPlayerId?: string;
  placeholder?: string;
  exclude?: string[];
}

export function PlayerSearch({
  onSelect,
  selectedPlayerId,
  placeholder = 'Buscar por email o nombre...',
  exclude = [],
}: PlayerSearchProps) {
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const { data: players, isLoading } = useQuery<Player[]>({
    queryKey: ['players', 'search', search],
    queryFn: async () => {
      if (search.length < 2) return [];
      const { data } = await api.get<Player[]>(
        `/users/search?q=${encodeURIComponent(search)}`
      );
      return data.filter((p) => !exclude.includes(p.userId));
    },
    enabled: search.length >= 2,
  });

  const selectedPlayer = players?.find((p) => p.userId === selectedPlayerId);

  useEffect(() => {
    if (selectedPlayer) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearch('');
      setIsOpen(false);
    }
  }, [selectedPlayer]);

  return (
    <div className="relative">
      {/* Input de búsqueda o jugador seleccionado */}
      {selectedPlayer ? (
        <div className="flex items-center justify-between rounded-lg border-2 border-emerald-500 bg-emerald-50 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
              <User size={20} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">
                {selectedPlayer.displayName}
              </div>
              <div className="text-sm text-slate-600">{selectedPlayer.email}</div>
            </div>
          </div>
          <button
            onClick={() => {
              onSelect({ userId: '', email: '', displayName: '' });
              setSearch('');
            }}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="pl-10"
          />
        </div>
      )}

      {/* Dropdown de resultados */}
      {isOpen && search.length >= 2 && !selectedPlayer && (
        <div className="absolute z-10 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : players && players.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {players.map((player) => (
                <button
                  key={player.userId}
                  onClick={() => {
                    onSelect(player);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center gap-3 border-b border-slate-100 p-3 text-left transition-colors hover:bg-slate-50 last:border-b-0"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                    <User size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900">
                      {player.displayName}
                    </div>
                    <div className="text-sm text-slate-600">{player.email}</div>
                  </div>
                  {player.elo && (
                    <div className="text-right">
                      <div className="text-sm font-semibold text-slate-900">
                        {player.elo}
                      </div>
                      <div className="text-xs text-slate-500">ELO</div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-slate-600">
              No se encontraron jugadores
            </div>
          )}
        </div>
      )}

      {/* Helper text */}
      {!selectedPlayer && search.length > 0 && search.length < 2 && (
        <p className="mt-1 text-xs text-slate-500">
          Escribe al menos 2 caracteres para buscar
        </p>
      )}
    </div>
  );
}