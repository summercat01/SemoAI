import { notFound } from 'next/navigation';
import pool from '@/lib/db';
import { auth } from '@/auth';
import ServiceLogo from '@/components/ServiceLogo';
import RecentlyViewedTracker from '@/components/service/RecentlyViewedTracker';
import BookmarkButton from '@/components/service/BookmarkButton';
import CompareButton from '@/components/compare/CompareButton';
import RelatedServices from '@/components/service/RelatedServices';
import { getDomain, PRICING_BADGE } from '@/lib/constants';

export const revalidate = 3600; // 1시간마다 재검증

interface ServiceDetail {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  pricing_type: string;
  website_url: string;
  skill_level: string;
  platforms: string[];
  target_user: string;
  key_features: string;
  limitations: string;
  is_featured: boolean;
  category_name: string;
  category_slug: string;
  tags: string[];
}

const SKILL_LABEL: Record<string, string> = {
  beginner:     '입문자',
  intermediate: '중급자',
  advanced:     '고급자',
  any:          '누구나',
};

interface RelatedService {
  id: number;
  name: string;
  slug: string;
  tagline: string;
  pricing_type: string;
  website_url: string;
  category_name: string;
}

async function getRelated(categorySlug: string, excludeId: number): Promise<RelatedService[]> {
  try {
    const { rows } = await pool.query(`
      SELECT s.id, s.name, s.slug, s.tagline, s.pricing_type, s.website_url, c.name as category_name
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      WHERE c.slug = $1 AND s.id != $2 AND s.is_active = true
      ORDER BY s.is_featured DESC, RANDOM()
      LIMIT 4
    `, [categorySlug, excludeId]);
    return rows;
  } catch {
    return [];
  }
}

async function getService(slug: string): Promise<ServiceDetail | null> {
  try {
    const { rows } = await pool.query(`
      SELECT
        s.id, s.name, s.slug, s.tagline, s.description,
        s.pricing_type, s.website_url, s.skill_level,
        s.platforms, s.target_user, s.key_features, s.limitations,
        s.is_featured, s.created_at,
        c.name as category_name, c.slug as category_slug,
        COALESCE(
          JSON_AGG(t.name ORDER BY t.name) FILTER (WHERE t.id IS NOT NULL),
          '[]'
        ) as tags
      FROM ai_services s
      LEFT JOIN categories c ON s.category_id = c.id
      LEFT JOIN ai_service_tags ast ON ast.ai_service_id = s.id
      LEFT JOIN tags t ON ast.tag_id = t.id
      WHERE s.slug = $1 AND s.is_active = true
      GROUP BY s.id, c.name, c.slug
    `, [slug]);
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

function InfoCard({ title, content, icon }: { title: string; content: string; icon: string }) {
  return (
    <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{icon}</span>{title}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(240,240,255,0.75)', margin: 0 }}>{content}</p>
    </div>
  );
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [service, session] = await Promise.all([getService(slug), auth()]);
  if (!service) notFound();

  const [related] = await Promise.all([
    getRelated(service.category_slug, service.id),
  ]);

  let isBookmarked = false;
  if (session?.user?.id) {

    try {
      const { rows } = await pool.query(
        `SELECT 1 FROM bookmarks WHERE user_id = $1 AND service_id = $2`,
        [session.user.id, service.id]
      );
      isBookmarked = rows.length > 0;
    } catch {}
  }

  const badge = PRICING_BADGE[service.pricing_type] ?? { label: service.pricing_type, color: '#888' };
  const domain = getDomain(service.website_url);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: service.name,
    description: service.tagline || service.description,
    url: service.website_url,
    applicationCategory: 'AIApplication',
    operatingSystem: service.platforms?.join(', ') || 'Web',
    offers: {
      '@type': 'Offer',
      price: service.pricing_type === 'free' ? '0' : undefined,
      priceCurrency: 'USD',
      availability: 'https://schema.org/OnlineOnly',
    },
    ...(service.category_name ? { applicationSubCategory: service.category_name } : {}),
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RecentlyViewedTracker slug={service.slug} name={service.name} category={service.category_name} />

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(8,7,26,0.85)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div className="svc-header-inner" style={{ maxWidth: 900, margin: '0 auto', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
            <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
              <defs>
                <linearGradient id="lgSvc" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#4fc3f7" />
                </linearGradient>
              </defs>
              <polygon points="14,3 26,24 2,24" stroke="url(#lgSvc)" strokeWidth="2" strokeLinejoin="round" fill="none" />
            </svg>
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '1.5px', background: 'linear-gradient(135deg, #e0d7ff, #a78bfa 50%, #4fc3f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>SEMO AI</span>
          </a>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            <a href="/search" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>탐색</a>
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14 }}>{service.name}</span>
        </div>
      </header>

      <div className="svc-content" style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>

        {/* Hero */}
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', marginBottom: 40, flexWrap: 'wrap' }}>
          <ServiceLogo url={service.website_url} name={service.name} size={96} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>{service.name}</h1>
              {service.is_featured && (
                <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.4)', color: '#c4b5fd', fontWeight: 600 }}>추천</span>
              )}
            </div>
            <p style={{ fontSize: 17, color: 'rgba(240,240,255,0.7)', lineHeight: 1.6, margin: '0 0 16px' }}>{service.tagline}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20, border: `1px solid ${badge.color}55`, color: badge.color, background: `${badge.color}18` }}>{badge.label}</span>
              {service.category_name && (
                <a href={`/search?category=${service.category_slug}`} style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.15)', color: 'var(--text-muted)', textDecoration: 'none', background: 'rgba(255,255,255,0.05)' }}>
                  {service.category_name}
                </a>
              )}
              {service.skill_level && SKILL_LABEL[service.skill_level] && (
                <span style={{ fontSize: 13, padding: '4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)' }}>
                  {SKILL_LABEL[service.skill_level]}
                </span>
              )}
            </div>
          </div>
          {/* CTA + Bookmark */}
          <div className="svc-hero-cta" style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
            <a href={service.website_url} target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 22px', borderRadius: 12,
              background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
              color: '#fff', textDecoration: 'none', fontWeight: 700, fontSize: 15,
            }}>
              {domain} 바로가기
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
            </a>
            <BookmarkButton serviceId={service.id} initialBookmarked={isBookmarked} />
            <CompareButton size="md" service={{
              id: service.id,
              slug: service.slug,
              name: service.name,
              website_url: service.website_url,
              category_name: service.category_name,
              pricing_type: service.pricing_type,
              tagline: service.tagline,
              key_features: service.key_features,
              target_user: service.target_user,
              limitations: service.limitations,
              platforms: service.platforms,
            }} />
          </div>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {service.target_user && <InfoCard title="대상 사용자" content={service.target_user} icon="👤" />}
          {service.key_features && <InfoCard title="주요 기능" content={service.key_features} icon="✨" />}
          {service.limitations && <InfoCard title="제한 사항" content={service.limitations} icon="⚠️" />}
          {service.platforms && service.platforms.length > 0 && (
            <InfoCard title="플랫폼" content={service.platforms.join(', ')} icon="🖥️" />
          )}
        </div>

        {/* Description */}
        {service.description && service.description !== service.tagline && (
          <div style={{ marginBottom: 32, padding: '20px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--text-muted)' }}>서비스 소개</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, color: 'rgba(240,240,255,0.65)', margin: 0 }}>{service.description}</p>
          </div>
        )}

        {/* Tags */}
        {service.tags && service.tags.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10 }}>태그</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {service.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20,
                  border: '1px solid rgba(124,106,247,0.25)',
                  color: '#c4b5fd', background: 'rgba(124,106,247,0.08)',
                }}>{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Related services */}
        <RelatedServices services={related} />

        {/* Back links */}
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="/search" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← 탐색으로 돌아가기
          </a>
          <span style={{ color: 'var(--text-muted)' }}>·</span>
          <a href="/recommend" style={{ fontSize: 14, color: 'var(--text-muted)', textDecoration: 'none' }}>
            AI 추천받기 →
          </a>
        </div>
      </div>
    </div>
  );
}
