export default function BackgroundGlow() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      <div style={{ position: 'absolute', width: 900, height: 700, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(124,106,247,0.2)', top: '-10%', left: '50%', transform: 'translateX(-50%)' }} />
      <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', filter: 'blur(100px)', background: 'rgba(79,195,247,0.12)', bottom: '-5%', right: '-5%' }} />
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', filter: 'blur(120px)', background: 'rgba(167,139,250,0.09)', bottom: '20%', left: '-5%' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(124,106,247,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,106,247,0.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
    </div>
  );
}
