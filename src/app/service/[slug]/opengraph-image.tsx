import { ImageResponse } from 'next/og';
import pool from '@/lib/db';
import { PRICING_BADGE } from '@/lib/constants';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function ServiceOGImage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let name = '세모 AI';
  let tagline = '세상의 모든 AI를 한곳에';
  let pricingType = '';
  let categoryName = '';

  try {
    const { rows } = await pool.query(
      `SELECT s.name, s.tagline, s.pricing_type, c.name as category_name
       FROM ai_services s
       LEFT JOIN categories c ON s.category_id = c.id
       WHERE s.slug = $1 AND s.is_active = true LIMIT 1`,
      [slug]
    );
    if (rows[0]) {
      name = rows[0].name;
      tagline = rows[0].tagline || tagline;
      pricingType = rows[0].pricing_type || '';
      categoryName = rows[0].category_name || '';
    }
  } catch {
    // fallback to defaults
  }

  const pricingBadge = PRICING_BADGE[pricingType] ?? { label: pricingType, color: '#888' };
  const pricingLabel = pricingBadge.label;
  const pricingColor = pricingBadge.color;

  return new ImageResponse(
    (
      <div style={{
        width: 1200,
        height: 630,
        background: '#07070f',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 80px',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,247,0.18) 0%, transparent 70%)',
          top: -100,
          right: -50,
          display: 'flex',
        }} />

        {/* Top: SEMO AI logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            color: '#fff',
            fontWeight: 800,
          }}>△</div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#f0f0ff' }}>SEMO AI</span>
        </div>

        {/* Center: service info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 10 }}>
            {categoryName && (
              <div style={{
                fontSize: 16,
                padding: '6px 18px',
                borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'rgba(240,240,255,0.6)',
                background: 'rgba(255,255,255,0.05)',
                display: 'flex',
              }}>{categoryName}</div>
            )}
            {pricingLabel && (
              <div style={{
                fontSize: 16,
                padding: '6px 18px',
                borderRadius: 20,
                border: `1px solid ${pricingColor}55`,
                color: pricingColor,
                background: `${pricingColor}18`,
                display: 'flex',
              }}>{pricingLabel}</div>
            )}
          </div>

          {/* Service name */}
          <div style={{
            fontSize: 72,
            fontWeight: 900,
            color: '#f0f0ff',
            lineHeight: 1.1,
            letterSpacing: '-2px',
            display: 'flex',
          }}>{name}</div>

          {/* Tagline */}
          <div style={{
            fontSize: 24,
            color: 'rgba(240,240,255,0.55)',
            fontWeight: 400,
            display: 'flex',
            maxWidth: 900,
          }}>{tagline}</div>
        </div>

        {/* Bottom: URL hint */}
        <div style={{
          fontSize: 16,
          color: 'rgba(240,240,255,0.3)',
          display: 'flex',
        }}>
          ai.semo3.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
