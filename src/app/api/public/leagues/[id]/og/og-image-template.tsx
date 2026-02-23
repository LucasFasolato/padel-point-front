import type { StandingEntry } from '@/types/leagues';

interface LeagueShareOgImageProps {
  leagueName: string;
  topFive: StandingEntry[];
  computedAt: string;
}

export function LeagueShareOgImage({
  leagueName,
  topFive,
  computedAt,
}: LeagueShareOgImageProps) {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        position: 'relative',
        background: 'linear-gradient(135deg, #f8fafc 0%, #ecfdf5 45%, #e2e8f0 100%)',
        color: '#0f172a',
        padding: '44px',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: 32,
          top: 24,
          color: '#cbd5e1',
          fontSize: 20,
          letterSpacing: 6,
          fontWeight: 800,
        }}
      >
        PADELPOINT
      </div>

      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 28,
          border: '1px solid #cbd5e1',
          background: 'rgba(255,255,255,0.88)',
          display: 'flex',
          flexDirection: 'column',
          padding: 28,
          boxShadow: '0 12px 30px rgba(15, 23, 42, 0.08)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: '#047857', fontSize: 20, fontWeight: 700, letterSpacing: 1 }}>
              Tabla de posiciones
            </div>
            <div style={{ marginTop: 10, fontSize: 42, lineHeight: 1.15, fontWeight: 800, maxWidth: 820 }}>
              {leagueName || 'Liga'}
            </div>
          </div>
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 999,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontSize: 16,
              fontWeight: 700,
            }}
          >
            {computedAt}
          </div>
        </div>

        <div
          style={{
            marginTop: 24,
            display: 'flex',
            flex: 1,
            borderRadius: 20,
            border: '1px solid #e2e8f0',
            background: '#fff',
            overflow: 'hidden',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              display: 'flex',
              padding: '14px 18px',
              background: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              fontSize: 17,
              fontWeight: 700,
              color: '#475569',
            }}
          >
            <div style={{ width: 56 }}>#</div>
            <div style={{ flex: 1 }}>Jugador</div>
            <div style={{ width: 110, textAlign: 'right' }}>Puntos</div>
          </div>

          {topFive.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                fontSize: 26,
                fontWeight: 600,
              }}
            >
              Sin resultados confirmados aún
            </div>
          ) : (
            topFive.map((row, index) => (
              <div
                key={row.userId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '16px 18px',
                  borderBottom: index === topFive.length - 1 ? 'none' : '1px solid #f1f5f9',
                  fontSize: 22,
                }}
              >
                <div style={{ width: 56, color: '#64748b', fontWeight: 700 }}>{row.position}</div>
                <div
                  style={{
                    flex: 1,
                    color: '#0f172a',
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {row.displayName || 'Jugador'}
                </div>
                <div style={{ width: 110, textAlign: 'right', color: '#0f172a', fontWeight: 800 }}>
                  {row.points}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function LeagueShareOgImageFallback() {
  return (
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#334155',
        fontSize: 28,
        fontWeight: 700,
      }}
    >
      PadelPoint · Tabla no disponible
    </div>
  );
}
