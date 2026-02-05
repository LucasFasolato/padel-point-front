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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-surface p-6 shadow-2xl ring-1 ring-border transition-all">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
          <h3 className="text-lg font-semibold text-text">
            {title}
          </h3>

          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-full p-2 text-textMuted transition-colors hover:bg-surface2 hover:text-danger focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-bg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="text-text">
          {children}
        </div>
      </div>
    </div>
  );
}
