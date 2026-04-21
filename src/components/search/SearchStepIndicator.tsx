'use client';

export const STEP_HEADERS: Record<1 | 2 | 3, { suffix: string }> = {
  1: { suffix: '개 서비스 탐색 중' },
  2: { suffix: '개로 좁혀졌어요' },
  3: { suffix: '개 최종 추천' },
};

export default function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['탐색', '좁히기', '최종 추천'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginBottom: 12 }}>
      {[1, 2, 3].map(s => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            background: s <= step ? 'linear-gradient(135deg, #7c6af7, #4fc3f7)' : 'rgba(255,255,255,0.06)',
            color: s <= step ? '#fff' : 'rgba(255,255,255,0.45)',
            border: s === step ? '2px solid rgba(124,106,247,0.8)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: s === step ? '0 0 12px rgba(124,106,247,0.4)' : 'none',
            transition: 'all 0.3s',
          }}>{s}</div>
          <span style={{
            fontSize: 11, fontWeight: 600, color: s <= step ? 'rgba(196,181,253,0.9)' : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.03em', transition: 'color 0.3s',
          }}>{labels[s - 1]}</span>
          {s < 3 && <div style={{
            width: 24, height: 1,
            background: s < step ? 'rgba(124,106,247,0.5)' : 'rgba(255,255,255,0.08)',
            transition: 'background 0.3s',
          }} />}
        </div>
      ))}
    </div>
  );
}
