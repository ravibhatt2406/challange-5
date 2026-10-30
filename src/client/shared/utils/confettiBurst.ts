/**
 * Physics-based particle and confetti burst engine.
 * Zero external dependencies. Spawns high-velocity 3D tumbling confetti,
 * sparkling star particles, and gravity arcs directly to a temporary overlay canvas.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  opacity: number;
  decay: number;
  shape: 'rect' | 'circle' | 'star';
}

const PALETTES = [
  '#FFD700', '#FFA500', '#FF4500', '#FF1493', '#9370DB',
  '#00CED1', '#32CD32', '#38BDF8', '#818CF8', '#F472B6'
];

export function fireConfetti(originX?: number, originY?: number, count = 70): void {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const startX = originX ?? w / 2;
  const startY = originY ?? h / 2;

  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = Math.random() * 12 + 6;
    particles.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4, // initial upward kick
      width: Math.random() * 8 + 6,
      height: Math.random() * 6 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      color: PALETTES[Math.floor(Math.random() * PALETTES.length)] ?? '#FFD700',
      opacity: 1,
      decay: Math.random() * 0.015 + 0.01,
      shape: Math.random() > 0.4 ? 'rect' : Math.random() > 0.5 ? 'circle' : 'star',
    });
  }

  let animId: number;
  const gravity = 0.35;
  const friction = 0.98;

  const render = () => {
    ctx.clearRect(0, 0, w, h);
    let active = 0;

    for (const p of particles) {
      if (p.opacity <= 0) continue;
      active++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += gravity;
      p.vx *= friction;
      p.rotation += p.rotSpeed;
      p.opacity -= p.decay;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.shape === 'rect') {
        ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      } else if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.width / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Star shape
        ctx.beginPath();
        for (let s = 0; s < 5; s++) {
          const a = (s * Math.PI * 2) / 5 - Math.PI / 2;
          const r = s % 2 === 0 ? p.width : p.width / 2;
          ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
        }
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    if (active > 0) {
      animId = requestAnimationFrame(render);
    } else {
      cancelAnimationFrame(animId);
      canvas.remove();
    }
  };

  animId = requestAnimationFrame(render);
}
