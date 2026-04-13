import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: '#07070f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,106,247,0.2) 0%, transparent 70%)',
          top: -100,
          left: -50,
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,247,0.15) 0%, transparent 70%)',
          bottom: -100,
          right: -50,
          display: 'flex',
        }} />

        {/* Logo */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #7c6af7, #4fc3f7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 40,
          color: '#fff',
          fontWeight: 800,
          marginBottom: 32,
        }}>
          △
        </div>

        {/* Title */}
        <div style={{
          fontSize: 80,
          fontWeight: 900,
          background: 'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #7c6af7 100%)',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: 16,
          letterSpacing: '-2px',
          display: 'flex',
        }}>
          세모 AI
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: 28,
          color: 'rgba(240,240,255,0.6)',
          fontWeight: 400,
          marginBottom: 40,
          display: 'flex',
        }}>
          세상의 모든 AI를 한곳에
        </div>

        {/* Tags */}
        <div style={{ display: 'flex', gap: 12 }}>
          {['이미지 생성', '영상', '음악', '코딩', '글쓰기'].map(tag => (
            <div key={tag} style={{
              fontSize: 16,
              padding: '8px 20px',
              borderRadius: 20,
              border: '1px solid rgba(124,106,247,0.4)',
              color: '#c4b5fd',
              background: 'rgba(124,106,247,0.1)',
              display: 'flex',
            }}>
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
