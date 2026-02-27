'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Download, Share2, X } from 'lucide-react';
import type { Category } from '@/types/competitive';
import type { RankingScope } from '@/types/rankings';
import { CATEGORY_LABELS } from '@/lib/competitive-utils';

// ── Card dimensions (CSS pixels; canvas rendered at 2× for HiDPI) ─────────────

const CARD_W = 360;
const CARD_H = 204;
const SCALE = 2;

// ── Helpers ───────────────────────────────────────────────────────────────────

function getScopeLabel(
  scope: RankingScope,
  city?: string | null,
  province?: string | null,
): string {
  if (scope === 'city') return city ?? 'tu ciudad';
  if (scope === 'province') return province ?? 'tu provincia';
  return 'Argentina';
}

/**
 * Rounded-rectangle path — polyfills ctx.roundRect for older Safari (<15.4).
 */
function rrPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = ctx as any;
  if (typeof c.roundRect === 'function') {
    c.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

// ── Canvas drawing ────────────────────────────────────────────────────────────

const FONT = 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

interface CardData {
  position: number;
  delta: number | null;
  elo: number;
  scopeLabel: string;
  categoryLabel: string;
}

function drawRankingCard(ctx: CanvasRenderingContext2D, d: CardData) {
  const W = CARD_W;
  const H = CARD_H;

  // ── Background gradient ──────────────────────────────────────────────────
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#edfaf4');
  bg.addColorStop(0.45, '#ffffff');
  bg.addColorStop(1, '#f8fafc');
  rrPath(ctx, 0, 0, W, H, 16);
  ctx.fillStyle = bg;
  ctx.fill();

  // ── Accent stripe ────────────────────────────────────────────────────────
  const stripe = ctx.createLinearGradient(0, 0, W, 0);
  stripe.addColorStop(0, '#0E7C66');
  stripe.addColorStop(1, '#34d399');
  ctx.fillStyle = stripe;
  ctx.fillRect(0, 0, W, 5);

  // ── Border ───────────────────────────────────────────────────────────────
  rrPath(ctx, 0.5, 0.5, W - 1, H - 1, 16);
  ctx.strokeStyle = 'rgba(14,124,102,0.18)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── "TU POSICIÓN EN …" kicker ────────────────────────────────────────────
  ctx.fillStyle = '#0E7C66';
  ctx.font = `bold 9px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`TU POSICIÓN EN ${d.scopeLabel.toUpperCase()}`, 22, 34);

  // ── Position hero ────────────────────────────────────────────────────────
  ctx.fillStyle = '#0f172a';
  ctx.font = `bold 70px ${FONT}`;
  ctx.fillText(`#${d.position}`, 16, 114);

  // ── Delta badge (below hero) ─────────────────────────────────────────────
  const hasDelta = d.delta !== null && d.delta !== 0;
  if (hasDelta && d.delta !== null) {
    const isUp = d.delta > 0;
    const txt = `${isUp ? '▲' : '▼'} ${Math.abs(d.delta)}`;
    ctx.font = `bold 12px ${FONT}`;
    const tw = ctx.measureText(txt).width;

    // Badge pill
    rrPath(ctx, 18, 122, tw + 16, 22, 7);
    ctx.fillStyle = isUp ? 'rgba(5,150,105,0.12)' : 'rgba(244,63,94,0.10)';
    ctx.fill();
    ctx.fillStyle = isUp ? '#059669' : '#f43f5e';
    ctx.fillText(txt, 26, 137);
  }

  // ── Category subtitle ────────────────────────────────────────────────────
  const subY = hasDelta ? 166 : 140;
  ctx.fillStyle = '#64748b';
  ctx.font = `13px ${FONT}`;
  ctx.fillText(`Categoría ${d.categoryLabel}`, 18, subY);

  // ── ELO (top-right) ──────────────────────────────────────────────────────
  ctx.textAlign = 'right';
  ctx.fillStyle = '#0E7C66';
  ctx.font = `bold 32px ${FONT}`;
  ctx.fillText(String(d.elo), W - 20, 92);

  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold 8px ${FONT}`;
  ctx.fillText('ELO', W - 20, 105);

  // ── PadelPoint watermark ─────────────────────────────────────────────────
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = `bold 9px ${FONT}`;
  ctx.fillText('PadelPoint', 20, H - 12);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#cbd5e1';
  ctx.font = `9px ${FONT}`;
  ctx.fillText('padelpoint.app', W - 20, H - 12);

  // Reset
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface RankingShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  position: number;
  delta?: number | null;
  elo: number;
  scope: RankingScope;
  category: Category;
  cityName?: string | null;
  provinceName?: string | null;
}

export function RankingShareModal({
  isOpen,
  onClose,
  position,
  delta = null,
  elo,
  scope,
  category,
  cityName,
  provinceName,
}: RankingShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const scopeLabel = getScopeLabel(scope, cityName, provinceName);
  const categoryLabel = CATEGORY_LABELS[category];

  // Re-draw whenever the modal opens or data changes
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CARD_W * SCALE;
    canvas.height = CARD_H * SCALE;
    ctx.scale(SCALE, SCALE);
    ctx.clearRect(0, 0, CARD_W, CARD_H);
    drawRankingCard(ctx, { position, delta, elo, scopeLabel, categoryLabel });
  }, [isOpen, position, delta, elo, scopeLabel, categoryLabel]);

  // Get canvas blob (PNG)
  const getBlob = useCallback(
    () =>
      new Promise<Blob>((resolve, reject) => {
        const canvas = canvasRef.current;
        if (!canvas) return reject(new Error('No canvas'));
        canvas.toBlob((blob) => {
          blob ? resolve(blob) : reject(new Error('toBlob returned null'));
        }, 'image/png');
      }),
    [],
  );

  // Primary action: Web Share API (mobile) → download fallback
  const handleShare = useCallback(async () => {
    try {
      const blob = await getBlob();
      const file = new File([blob], 'ranking-padelpoint.png', { type: 'image/png' });
      const shareData = {
        files: [file],
        title: 'Mi posición en PadelPoint',
        text: `Estoy #${position} en el ranking de ${scopeLabel}${delta ? ` — subí ${Math.abs(delta)} puestos` : ''} 🎾`,
      };

      if (typeof navigator.canShare === 'function' && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    } catch (err) {
      // AbortError = user cancelled; anything else → fall through to download
      if ((err as Error)?.name === 'AbortError') return;
    }
    // Fallback: trigger download
    handleDownload();
  }, [getBlob, position, delta, scopeLabel]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await getBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ranking-padelpoint.png';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Last resort: dataURL
      const canvas = canvasRef.current;
      if (!canvas) return;
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'ranking-padelpoint.png';
      a.click();
    }
  }, [getBlob]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">Compartir ranking</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Card preview */}
        <div className="px-5 pb-2">
          <div className="overflow-hidden rounded-2xl border border-slate-100 shadow-sm">
            <canvas
              ref={canvasRef}
              style={{
                width: CARD_W,
                height: CARD_H,
                maxWidth: '100%',
                display: 'block',
              }}
              aria-label={`Tu posición #${position} en el ranking`}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 px-5 pb-7 pt-4">
          <button
            type="button"
            onClick={handleShare}
            className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl bg-[#0E7C66] px-4 py-3 text-sm font-semibold text-white transition-opacity active:opacity-80"
          >
            <Share2 className="h-4 w-4" />
            Compartir
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex min-h-[48px] items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100"
          >
            <Download className="h-4 w-4" />
            Descargar imagen
          </button>
        </div>
      </div>
    </div>
  );
}
