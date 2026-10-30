import { useEffect, useRef, useCallback } from 'react';

interface CelebrationHeroCanvasProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  hue: number;
  phase: number;
}

interface FloatingObject {
  x: number;
  y: number;
  baseY: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmplitude: number;
  type: 'ring' | 'gift' | 'lantern';
  glow: string;
}

/**
 * Lightweight HTML5 canvas rendering floating celebration artifacts:
 * - 💍 Shimmering gold geometric ring (Weddings)
 * - 🎁 Animated floating ribbon gift box with confetti (Birthdays)
 * - 🎪 Vibrant community festival lantern (Community Events)
 *
 * Features cursor parallax (mousemove tilts scene), ambient lighting,
 * floating dust motes, and smooth 60fps animation.
 */
export default function CelebrationHeroCanvas({ className = '' }: CelebrationHeroCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animFrameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current = {
      x: e.clientX / window.innerWidth,
      y: e.clientY / window.innerHeight,
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    // Create dust mote particles
    const particles: Particle[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * 1200,
        y: Math.random() * 700,
        size: Math.random() * 2 + 0.5,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
        opacity: Math.random() * 0.4 + 0.1,
        hue: Math.random() * 60 + 30,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Create floating celebration objects
    const objects: FloatingObject[] = [
      {
        x: 0.2, y: 0.4, baseY: 0.4, size: 45,
        rotation: 0, rotSpeed: 0.008, bobPhase: 0, bobSpeed: 0.015, bobAmplitude: 15,
        type: 'ring', glow: 'rgba(255, 215, 0, 0.3)',
      },
      {
        x: 0.5, y: 0.35, baseY: 0.35, size: 40,
        rotation: 0, rotSpeed: -0.005, bobPhase: 1.5, bobSpeed: 0.02, bobAmplitude: 12,
        type: 'gift', glow: 'rgba(255, 100, 130, 0.25)',
      },
      {
        x: 0.8, y: 0.45, baseY: 0.45, size: 35,
        rotation: 0, rotSpeed: 0.006, bobPhase: 3.0, bobSpeed: 0.018, bobAmplitude: 18,
        type: 'lantern', glow: 'rgba(80, 200, 160, 0.3)',
      },
    ];

    // Confetti particles for gift box
    const confetti: Array<{ x: number; y: number; vx: number; vy: number; color: string; life: number; maxLife: number; size: number }> = [];

    const drawRing = (cx: number, cy: number, size: number, rotation: number, time: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Outer ring glow
      const gradient = ctx.createRadialGradient(0, 0, size * 0.6, 0, 0, size * 1.2);
      gradient.addColorStop(0, 'rgba(255, 215, 0, 0.08)');
      gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Diamond shape (geometric ring / gem)
      const shimmer = 0.7 + Math.sin(time * 2) * 0.3;
      ctx.strokeStyle = `rgba(255, 215, 0, ${shimmer})`;
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(255, 215, 0, 0.6)';
      ctx.shadowBlur = 15;

      // Draw hexagonal ring
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i - Math.PI / 2;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Inner diamond sparkle
      ctx.strokeStyle = `rgba(255, 245, 200, ${0.5 + Math.sin(time * 3.5) * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 / 6) * i + Math.PI / 6;
        const px = Math.cos(angle) * size * 0.55;
        const py = Math.sin(angle) * size * 0.55;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const drawGift = (cx: number, cy: number, size: number, rotation: number, time: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation * 0.3);

      // Box body
      const halfSize = size * 0.7;
      ctx.fillStyle = `rgba(255, 100, 150, ${0.6 + Math.sin(time * 2) * 0.15})`;
      ctx.shadowColor = 'rgba(255, 100, 150, 0.4)';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.roundRect(-halfSize, -halfSize * 0.5, halfSize * 2, halfSize * 1.3, 6);
      ctx.fill();

      // Lid
      ctx.fillStyle = `rgba(255, 130, 170, ${0.7 + Math.sin(time * 2.5) * 0.15})`;
      ctx.beginPath();
      ctx.roundRect(-halfSize - 3, -halfSize * 0.5 - 10, halfSize * 2 + 6, 14, 4);
      ctx.fill();

      // Ribbon vertical
      ctx.fillStyle = 'rgba(255, 215, 100, 0.7)';
      ctx.fillRect(-3, -halfSize * 0.5, 6, halfSize * 1.3);

      // Ribbon horizontal
      ctx.fillRect(-halfSize, halfSize * 0.1, halfSize * 2, 5);

      // Bow on top
      ctx.strokeStyle = 'rgba(255, 215, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(-10, -halfSize * 0.5 - 14, 12, 7, -0.3, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(10, -halfSize * 0.5 - 14, 12, 7, 0.3, 0, Math.PI * 2);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();

      // Spawn confetti periodically
      if (Math.random() < 0.06) {
        confetti.push({
          x: cx + (Math.random() - 0.5) * size,
          y: cy - size * 0.5,
          vx: (Math.random() - 0.5) * 2,
          vy: -Math.random() * 1.5 - 0.5,
          color: ['#FF6B9D', '#FFD700', '#00D4AA', '#7B61FF', '#FF9F43'][Math.floor(Math.random() * 5)] as string,
          life: 0,
          maxLife: 80 + Math.random() * 40,
          size: Math.random() * 4 + 2,
        });
      }
    };

    const drawLantern = (cx: number, cy: number, size: number, rotation: number, time: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation * 0.2);

      // Lantern glow
      const gGlow = ctx.createRadialGradient(0, 0, size * 0.2, 0, 0, size * 1.4);
      gGlow.addColorStop(0, `rgba(80, 200, 160, ${0.15 + Math.sin(time * 1.5) * 0.05})`);
      gGlow.addColorStop(1, 'rgba(80, 200, 160, 0)');
      ctx.fillStyle = gGlow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 1.4, 0, Math.PI * 2);
      ctx.fill();

      // Lantern body (octagon)
      ctx.fillStyle = `rgba(0, 180, 140, ${0.5 + Math.sin(time * 2) * 0.15})`;
      ctx.shadowColor = 'rgba(0, 220, 170, 0.5)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i - Math.PI / 8;
        const px = Math.cos(angle) * size * 0.7;
        const py = Math.sin(angle) * size * 0.7;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner light
      const innerGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.4);
      innerGlow.addColorStop(0, `rgba(255, 255, 200, ${0.5 + Math.sin(time * 3) * 0.2})`);
      innerGlow.addColorStop(1, 'rgba(255, 255, 200, 0)');
      ctx.fillStyle = innerGlow;
      ctx.beginPath();
      ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Hanging string
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, -size * 0.7);
      ctx.lineTo(0, -size * 1.3);
      ctx.stroke();

      // Bottom tassel
      ctx.strokeStyle = 'rgba(0, 180, 140, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, size * 0.7);
      ctx.lineTo(0, size * 1.1);
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.restore();
    };

    let time = 0;
    const animate = () => {
      time += 0.016;
      ctx.clearRect(0, 0, width, height);

      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const parallaxX = (mx - 0.5) * 40;
      const parallaxY = (my - 0.5) * 25;

      // Draw dust motes
      for (const p of particles) {
        p.x += p.speedX + parallaxX * 0.003;
        p.y += p.speedY + parallaxY * 0.002;
        p.phase += 0.02;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const flicker = 0.5 + Math.sin(p.phase) * 0.5;
        ctx.fillStyle = `hsla(${p.hue}, 60%, 75%, ${p.opacity * flicker})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw and update floating objects
      for (const obj of objects) {
        obj.bobPhase += obj.bobSpeed;
        obj.rotation += obj.rotSpeed;
        const px = obj.x * width + parallaxX * (obj.type === 'ring' ? 1.2 : obj.type === 'gift' ? 0.8 : 1.0);
        const py = obj.baseY * height + Math.sin(obj.bobPhase) * obj.bobAmplitude + parallaxY * 0.6;

        if (obj.type === 'ring') drawRing(px, py, obj.size, obj.rotation, time);
        else if (obj.type === 'gift') drawGift(px, py, obj.size, obj.rotation, time);
        else drawLantern(px, py, obj.size, obj.rotation, time);
      }

      // Draw and update confetti
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]!;
        c.x += c.vx;
        c.y += c.vy;
        c.vy += 0.03;
        c.life++;
        const lifeRatio = 1 - c.life / c.maxLife;
        if (lifeRatio <= 0) {
          confetti.splice(i, 1);
          continue;
        }
        ctx.fillStyle = c.color;
        ctx.globalAlpha = lifeRatio;
        ctx.fillRect(c.x, c.y, c.size, c.size * 0.6);
        ctx.globalAlpha = 1;
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
    };
  }, [handleMouseMove]);

  return (
    <canvas
      ref={canvasRef}
      className={`celebration-hero-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  );
}
