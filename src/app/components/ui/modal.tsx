'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  const [show, setShow] = useState(isOpen);

  useEffect(() => {
    setShow(isOpen);
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop con blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className="relative w-full max-w-lg scale-100 transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all">
        <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}