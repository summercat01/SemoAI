'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/Pagination';
import { ADMIN_PAGE_SIZE } from '@/lib/constants';

interface Category { id: number; name: string; slug: string; }

interface Service {
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
  is_active: boolean;
  category_id: number | null;
  category_name: string;
  tags: string[];
}

interface TrashedService {
  id: number; name: string; slug: string; pricing_type: string;
  deleted_at: string; category_name: string;
}

interface ServiceForm {
  name: string; slug: string; tagline: string; description: string;
  category_id: string; website_url: string; pricing_type: string;
  skill_level: string; platforms: string; target_user: string;
  key_features: string; limitations: string; tags: string;
  is_featured: boolean; is_active: boolean;
}

const EMPTY_FORM: ServiceForm = {
  name: '', slug: '', tagline: '', description: '',
  category_id: '', website_url: '', pricing_type: 'free',
  skill_level: '', platforms: '', target_user: '',
  key_features: '', limitations: '', tags: '',
  is_featured: false, is_active: true,
};

const FIELDS: { key: keyof Service; label: string }[] = [
  { key: 'tagline', label: '한줄 설명' },
  { key: 'description', label: '상세 설명' },
  { key: 'target_user', label: '대상 사용자' },
  { key: 'key_features', label: '주요 기능' },
  { key: 'limitations', label: '제한 사항' },
  { key: 'skill_level', label: '난이도' },
  { key: 'platforms', label: '플랫폼' },
];

function completeness(s: Service) {
  const filled = FIELDS.filter(f => {
    const v = s[f.key];
    return v && (Array.isArray(v) ? v.length > 0 : String(v).trim() !== '');
  }).length;
  return Math.round((filled / FIELDS.length) * 100);
}

const PRICING_COLOR: Record<string, string> = {
  free: '#22c55e', freemium: '#60a5fa', paid: '#f97316', 'open-source': '#a78bfa',
};
const PRICING_LABEL: Record<string, string> = {
  free: '무료', freemium: '무료+', paid: '유료', 'open-source': '오픈소스',
};

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

// ── Service Modal ──────────────────────────────────────────────────────────────
function ServiceModal({
  service, categories, onClose, onSaved,
}: {
  service: Service | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = service !== null;
  const [form, setForm] = useState<ServiceForm>(() =>
    service ? {
      name: service.name, slug: service.slug, tagline: service.tagline ?? '',
      description: service.description ?? '', category_id: String(service.category_id ?? ''),
      website_url: service.website_url ?? '', pricing_type: service.pricing_type ?? 'free',
      skill_level: service.skill_level ?? '', platforms: (service.platforms ?? []).join(', '),
      target_user: service.target_user ?? '', key_features: service.key_features ?? '',
      limitations: service.limitations ?? '', tags: (service.tags ?? []).join(', '),
      is_featured: service.is_featured ?? false, is_active: service.is_active ?? true,
    } : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const slugEdited = useRef(isEdit);

  function set(k: keyof ServiceForm, v: string | boolean) {
    setForm(f => {
      const next = { ...f, [k]: v };
      if (k === 'name' && !slugEdited.current) next.slug = toSlug(v as string);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.slug.trim()) { setError('이름과 슬러그는 필수입니다'); return; }
    setSaving(true); setError('');
    const body = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      platforms: form.platforms.split(',').map(s => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
    };
    const url = isEdit ? `/api/admin/services/${service!.id}` : '/api/admin/services';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setError(d.error || '저장 실패'); return; }
    onSaved();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13,
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
    color: '#f0f0ff', outline: 'none', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'rgba(240,240,255,0.45)', marginBottom: 4, display: 'block' };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0e0e1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        width: '100%', maxWidth: 760, maxHeight: '90vh', overflowY: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{isEdit ? '서비스 수정' : '서비스 추가'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>이름 *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="서비스 이름" />
            </div>
            {/* Slug */}
            <div>
              <label style={labelStyle}>슬러그 *</label>
              <input style={inputStyle} value={form.slug}
                onChange={e => { slugEdited.current = true; set('slug', e.target.value); }}
                placeholder="url-slug" />
            </div>
            {/* Website */}
            <div>
              <label style={labelStyle}>웹사이트 URL</label>
              <input style={inputStyle} value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://..." />
            </div>
            {/* Category */}
            <div>
              <label style={labelStyle}>카테고리</label>
              <select style={inputStyle} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">미분류</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            {/* Pricing */}
            <div>
              <label style={labelStyle}>가격 유형</label>
              <select style={inputStyle} value={form.pricing_type} onChange={e => set('pricing_type', e.target.value)}>
                <option value="free">무료</option>
                <option value="freemium">무료+</option>
                <option value="paid">유료</option>
                <option value="open-source">오픈소스</option>
              </select>
            </div>
            {/* Skill level */}
            <div>
              <label style={labelStyle}>난이도</label>
              <select style={inputStyle} value={form.skill_level} onChange={e => set('skill_level', e.target.value)}>
                <option value="">선택 안 함</option>
                <option value="beginner">초급</option>
                <option value="intermediate">중급</option>
                <option value="advanced">고급</option>
              </select>
            </div>
            {/* Tagline */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>한줄 설명</label>
              <input style={inputStyle} value={form.tagline} onChange={e => set('tagline', e.target.value)} placeholder="간단한 설명" />
            </div>
            {/* Platforms */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>플랫폼 (쉼표 구분)</label>
              <input style={inputStyle} value={form.platforms} onChange={e => set('platforms', e.target.value)} placeholder="Web, iOS, Android" />
            </div>
            {/* Target user */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>대상 사용자</label>
              <input style={inputStyle} value={form.target_user} onChange={e => set('target_user', e.target.value)} />
            </div>
            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>상세 설명</label>
              <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.description} onChange={e => set('description', e.target.value)} />
            </div>
            {/* Key features */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>주요 기능</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.key_features} onChange={e => set('key_features', e.target.value)} />
            </div>
            {/* Limitations */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>제한 사항</label>
              <textarea style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} value={form.limitations} onChange={e => set('limitations', e.target.value)} />
            </div>
            {/* Tags */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>태그 (쉼표 구분)</label>
              <input style={inputStyle} value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="태그1, 태그2" />
            </div>
            {/* Checkboxes */}
            <div style={{ display: 'flex', gap: 20, gridColumn: '1 / -1' }}>
              {([['is_featured', '추천 서비스'], ['is_active', '활성화']] as [keyof ServiceForm, string][]).map(([k, label]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                  <input type="checkbox" checked={form[k] as boolean} onChange={e => set(k, e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: '#7c6af7' }} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {error && <div style={{ color: '#f97316', fontSize: 13, marginTop: 12 }}>{error}</div>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="button" onClick={onClose} style={{
              padding: '9px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)',
              background: 'transparent', color: 'rgba(240,240,255,0.6)', cursor: 'pointer', fontSize: 13,
            }}>취소</button>
            <button type="submit" disabled={saving} style={{
              padding: '9px 24px', borderRadius: 8, border: 'none',
              background: saving ? 'rgba(124,106,247,0.4)' : '#7c6af7',
              color: '#fff', cursor: saving ? 'default' : 'pointer', fontSize: 13, fontWeight: 600,
            }}>{saving ? '저장 중...' : isEdit ? '수정 저장' : '추가'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Trash Modal ────────────────────────────────────────────────────────────────
function TrashModal({ onClose, onRestored }: { onClose: () => void; onRestored: () => void }) {
  const [items, setItems] = useState<TrashedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [purgingAll, setPurgingAll] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/trash').then(r => r.json()).then(d => { setItems(d.data ?? []); setLoading(false); });
  };
  useEffect(() => { load(); }, []);

  async function restore(id: number) {
    await fetch(`/api/admin/services/${id}`, { method: 'PATCH' });
    load();
    onRestored();
  }

  async function purgeAll() {
    if (!confirm('휴지통을 완전히 비울까요? 되돌릴 수 없어요.')) return;
    setPurgingAll(true);
    await fetch('/api/admin/trash', { method: 'DELETE' });
    load();
    setPurgingAll(false);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#0e0e1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
        width: '100%', maxWidth: 600, maxHeight: '80vh', overflowY: 'auto', padding: 28,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🗑 휴지통</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            {items.length > 0 && (
              <button onClick={purgeAll} disabled={purgingAll} style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
                background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: 12,
              }}>전체 영구삭제</button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(240,240,255,0.4)', fontSize: 20, cursor: 'pointer' }}>✕</button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: 'rgba(240,240,255,0.4)', padding: 40 }}>불러오는 중...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'rgba(240,240,255,0.4)', padding: 40 }}>휴지통이 비어 있어요</div>
        ) : items.map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)', marginBottom: 8,
          }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.4)', marginTop: 2 }}>
                {item.category_name || '미분류'} · {new Date(item.deleted_at).toLocaleDateString('ko-KR')} 삭제
              </div>
            </div>
            <button onClick={() => restore(item.id)} style={{
              padding: '5px 14px', borderRadius: 7, border: '1px solid rgba(124,106,247,0.4)',
              background: 'rgba(124,106,247,0.1)', color: '#c4b5fd', cursor: 'pointer', fontSize: 12,
            }}>복원</button>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Main ───────────────────────────────────────────────────────────────────────
const PAGE_SIZE = ADMIN_PAGE_SIZE;

export default function AdminPage() {
  const { status } = useSession();
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, complete: 0, incomplete: 0, featured: 0 });
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<Service | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadServices = useCallback((p = page, q = search, cat = filterCat) => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(p), limit: String(PAGE_SIZE),
      ...(q ? { search: q } : {}),
      ...(cat ? { category: cat } : {}),
    });
    fetch(`/api/admin/services?${params}`).then(r => {
      if (r.status === 401) { router.push('/'); return null; }
      return r.json();
    }).then(d => {
      if (d) {
        setServices(d.services ?? []);
        setTotalPages(d.totalPages ?? 1);
        setStats(prev => ({
          ...prev,
          total: d.total ?? 0,
          featured: d.featured ?? 0,
        }));
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, filterCat]);

  useEffect(() => {
    if (status === 'unauthenticated') { router.push('/login'); return; }
    if (status !== 'authenticated') return;
    loadServices(1, search, filterCat);
    fetch('/api/admin/categories').then(r => r.ok ? r.json() : { data: [] }).then(d => setCategories(d.data ?? []));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  // 검색/필터 변경 시 디바운스
  const handleSearch = (q: string) => {
    setSearch(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); loadServices(1, q, filterCat); }, 350);
  };
  const handleFilterCat = (cat: string) => {
    setFilterCat(cat);
    setPage(1);
    loadServices(1, search, cat);
  };
  const goToPage = (p: number) => { setPage(p); loadServices(p, search, filterCat); };

  const paginated = services;

  const catList = useMemo(() =>
    [...new Set(services.map(s => s.category_name).filter(Boolean))].sort(), [services]);

  async function handleDelete(id: number) {
    await fetch(`/api/admin/services/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    setExpanded(null);
    loadServices(page, search, filterCat);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#07070f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f0f0ff' }}>
      불러오는 중...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#07070f', color: '#f0f0ff', fontFamily: 'sans-serif' }}>

      {/* Trash Modal */}
      {trashOpen && (
        <TrashModal onClose={() => setTrashOpen(false)} onRestored={() => loadServices(page, search, filterCat)} />
      )}

      {/* Modal */}
      {modal && (
        <ServiceModal
          service={modal === 'edit' ? editTarget : null}
          categories={categories}
          onClose={() => { setModal(null); setEditTarget(null); }}
          onSaved={() => { setModal(null); setEditTarget(null); loadServices(page, search, filterCat); }}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm !== null && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ background: '#0e0e1f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 28, maxWidth: 360, textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>서비스를 삭제할까요?</div>
            <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)', marginBottom: 22 }}>이 작업은 되돌릴 수 없어요</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{
                padding: '8px 20px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)',
                background: 'transparent', color: '#f0f0ff', cursor: 'pointer', fontSize: 13,
              }}>취소</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#ef4444', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}>삭제</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="admin-header" style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#7c6af7', textDecoration: 'none', fontSize: 14 }}>← 세모 AI</a>
        <span style={{ color: 'rgba(255,255,255,0.3)' }}>/</span>
        <span style={{ fontWeight: 700 }}>서비스 데이터 관리</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setTrashOpen(true)} style={{
          padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
          background: 'rgba(255,255,255,0.05)', color: 'rgba(240,240,255,0.6)', cursor: 'pointer', fontSize: 13,
        }}>🗑 휴지통</button>
        <button onClick={() => setModal('add')} style={{
          padding: '8px 18px', borderRadius: 8, border: 'none',
          background: '#7c6af7', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>+ 서비스 추가</button>
      </div>

      <div className="admin-content" style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px' }}>

        {/* Stats */}
        <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: '전체 서비스', value: stats.total, color: '#7c6af7' },
            { label: '완성도 100%', value: services.filter(s => completeness(s) === 100).length, color: '#22c55e' },
            { label: '60% 미만', value: services.filter(s => completeness(s) < 60).length, color: '#f97316' },
            { label: '추천 서비스', value: stats.featured, color: '#60a5fa' },
          ].map(st => (
            <div key={st.label} style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: st.color }}>{st.value}</div>
              <div style={{ fontSize: 13, color: 'rgba(240,240,255,0.5)', marginTop: 4 }}>{st.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="admin-filters" style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="서비스명 검색..."
            style={{
              flex: '1 1 200px', padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#f0f0ff', fontSize: 14, outline: 'none',
            }}
          />
          <select value={filterCat} onChange={e => handleFilterCat(e.target.value)}
            style={{
              padding: '10px 16px', borderRadius: 10,
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              color: '#f0f0ff', fontSize: 14, outline: 'none',
            }}>
            <option value="">전체 카테고리</option>
            {catList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 13, color: 'rgba(240,240,255,0.5)' }}>
            {stats.total}개 중 {services.length}개 표시
          </div>
        </div>

        {/* Table */}
        <div style={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
          <div className="admin-table-header" style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 100px 80px 60px 120px 80px',
            padding: '12px 20px', background: 'rgba(255,255,255,0.03)',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            fontSize: 12, fontWeight: 600, color: 'rgba(240,240,255,0.45)',
          }}>
            <div>서비스명</div><div className="admin-col-category">카테고리</div><div>가격</div>
            <div>완성도</div><div className="admin-col-featured">추천</div><div className="admin-col-website">웹사이트</div><div>관리</div>
          </div>

          {paginated.map(s => {
            const pct = completeness(s);
            const isOpen = expanded === s.id;
            return (
              <div key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  className="admin-table-row"
                  onClick={() => setExpanded(isOpen ? null : s.id)}
                  style={{
                    display: 'grid', gridTemplateColumns: '2fr 1fr 100px 80px 60px 120px 80px',
                    padding: '14px 20px', alignItems: 'center', cursor: 'pointer',
                    background: isOpen ? 'rgba(124,106,247,0.06)' : 'transparent', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{s.name}</div>
                    <div style={{ fontSize: 12, color: 'rgba(240,240,255,0.45)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                      {s.tagline || <span style={{ color: '#f97316' }}>한줄 설명 없음</span>}
                    </div>
                  </div>
                  <div className="admin-col-category" style={{ fontSize: 13, color: 'rgba(240,240,255,0.6)' }}>
                    {s.category_name || <span style={{ color: '#f97316' }}>미분류</span>}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 12, padding: '3px 10px', borderRadius: 20,
                      color: PRICING_COLOR[s.pricing_type] ?? '#888',
                      border: `1px solid ${PRICING_COLOR[s.pricing_type] ?? '#888'}55`,
                      background: `${PRICING_COLOR[s.pricing_type] ?? '#888'}18`,
                    }}>
                      {PRICING_LABEL[s.pricing_type] ?? s.pricing_type}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 3, width: `${pct}%`,
                        background: pct === 100 ? '#22c55e' : pct >= 60 ? '#60a5fa' : '#f97316',
                      }} />
                    </div>
                    <span style={{ fontSize: 11, color: pct < 60 ? '#f97316' : 'rgba(240,240,255,0.5)', minWidth: 30 }}>{pct}%</span>
                  </div>
                  <div className="admin-col-featured" style={{ textAlign: 'center', fontSize: 16 }}>{s.is_featured ? '⭐' : ''}</div>
                  <div className="admin-col-website">
                    <a href={s.website_url} target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 12, color: '#7c6af7', textDecoration: 'none', wordBreak: 'break-all' }}>
                      {s.website_url?.replace(/^https?:\/\//, '').split('/')[0]}
                    </a>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => { setEditTarget(s); setModal('edit'); }} style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(124,106,247,0.4)',
                      background: 'rgba(124,106,247,0.1)', color: '#c4b5fd', cursor: 'pointer', fontSize: 12,
                    }}>수정</button>
                    <button onClick={() => setDeleteConfirm(s.id)} style={{
                      padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.4)',
                      background: 'rgba(239,68,68,0.1)', color: '#fca5a5', cursor: 'pointer', fontSize: 12,
                    }}>삭제</button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ padding: '16px 20px 20px', background: 'rgba(124,106,247,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                      {FIELDS.map(f => {
                        const v = s[f.key];
                        const empty = !v || (Array.isArray(v) ? v.length === 0 : String(v).trim() === '');
                        return (
                          <div key={f.key} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: `1px solid ${empty ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.07)'}` }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: empty ? '#f97316' : 'rgba(240,240,255,0.4)', marginBottom: 4 }}>{f.label}</div>
                            <div style={{ fontSize: 13, color: empty ? 'rgba(249,115,22,0.7)' : 'rgba(240,240,255,0.75)', lineHeight: 1.5 }}>
                              {empty ? '없음' : Array.isArray(v) ? v.join(', ') : String(v)}
                            </div>
                          </div>
                        );
                      })}
                      {s.tags.length > 0 && (
                        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(240,240,255,0.4)', marginBottom: 6 }}>태그</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {s.tags.map(t => (
                              <span key={t} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'rgba(124,106,247,0.15)', color: '#c4b5fd', border: '1px solid rgba(124,106,247,0.25)' }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <a href={`/service/${s.slug}`} target="_blank" style={{ fontSize: 13, color: '#7c6af7', textDecoration: 'none' }}>서비스 상세 →</a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div style={{ marginTop: 20, paddingBottom: 32 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={goToPage} />
          </div>
        )}
      </div>
    </div>
  );
}
