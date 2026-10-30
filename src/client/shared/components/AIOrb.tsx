import { useEffect, useRef, useCallback } from 'react';

export type AIOrbState = 'idle' | 'thinking' | 'answered';

interface AIOrbProps {
  state?: AIOrbState;
  size?: number;
  className?: string;
  interactive?: boolean;
}

/**
 * 3D Holographic AI Energy Orb.
 * Renders a glowing, morphing energy sphere with concentric procedural plasma rings,
 * floating particle field, chromatic aberration shifts based on AI state:
 * - 'idle': gentle azure & violet breathing rhythm
 * - 'thinking': rapid chromatic vortex with accelerating particle core
 * - 'answered': radiant emerald & golden celebration pulse
 * Features magnetic gravitational pull toward cursor proximity.
 */
export default function AIOrb({
  state = 'idle',
  size = 120,
  className = '',
  interactive = true,
}: AIOrbProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mousePosRef = useRef({ x: 0, y: 0, dist: 999 });
  const animFrameRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!interactive || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    mousePosRef.current = { x: dx, y: dy, dist };
  }, [interactive]);

  useEffect(() => {
    if (interactive) {
      window.addEventListener('mousemove', handleMouseMove);
      return () => window.removeEventListener('mousemove', handleMouseMove);
    }
  }, [interactive, handleMouseMove]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    let time = 0;
    const center = size / 2;
    const radius = size * 0.32;

    // Mini particles orbiting the orb
    const particles = Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * Math.PI * 2,
      dist: radius * (1 + Math.random() * 0.35),
      speed: (Math.random() * 0.02 + 0.01) * (i % 2 === 0 ? 1 : -1),
      size: Math.random() * 2 + 1,
    }));

    const render = () => {
      ctx.clearRect(0, 0, size, size);

      const speedFactor = state === 'thinking' ? 2.5 : state === 'answered' ? 1.5 : 1.0;
      time += 0.03 * speedFactor;

      // Magnetic mouse offset
      let offsetX = 0;
      let offsetY = 0;
      if (mousePosRef.current.dist < 250) {
        const pull = (1 - mousePosRef.current.dist / 250) * 8;
        const angle = Math.atan2(mousePosRef.current.y, mousePosRef.current.x);
        offsetX = Math.cos(angle) * pull;
        offsetY = Math.sin(angle) * pull;
      }

      const orbX = center + offsetX;
      const orbY = center + offsetY;

      // Color scheme based on state
      let coreColor1 = 'rgba(56, 189, 248, 0.9)';   // sky blue
      let coreColor2 = 'rgba(129, 140, 248, 0.6)';  // indigo
      let glowColor = 'rgba(99, 102, 241, 0.25)';   // purple glow
      let ringColor = 'rgba(168, 85, 247, 0.5)';    // violet ring

      if (state === 'thinking') {
        const hueShift = (time * 120) % 360;
        coreColor1 = `hsla(${hueShift}, 90%, 65%, 0.95)`;
        coreColor2 = `hsla(${(hueShift + 60) % 360}, 85%, 55%, 0.7)`;
        glowColor = `hsla(${hueShift}, 80%, 60%, 0.35)`;
        ringColor = `hsla(${(hueShift + 120) % 360}, 90%, 70%, 0.6)`;
      } else if (state === 'answered') {
        coreColor1 = 'rgba(52, 211, 153, 0.95)';  // emerald
        coreColor2 = 'rgba(251, 191, 36, 0.7)';   // gold
        glowColor = 'rgba(16, 185, 129, 0.35)';   // green glow
        ringColor = 'rgba(52, 211, 153, 0.6)';
      }

      // 1. Ambient outer glow
      const outerPulse = Math.sin(time * 1.5) * 4;
      const glowGrad = ctx.createRadialGradient(orbX, orbY, radius * 0.4, orbX, orbY, radius + 20 + outerPulse);
      glowGrad.addColorStop(0, glowColor);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, radius + 20 + outerPulse, 0, Math.PI * 2);
      ctx.fill();

      // 2. Swirling concentric plasma ripples
      ctx.save();
      ctx.translate(orbX, orbY);
      for (let r = 0; r < 3; r++) {
        const ringTime = time * (r % 2 === 0 ? 1 : -1) + r * 1.2;
        const ringRad = radius * (0.85 + r * 0.15) + Math.sin(time * 2 + r) * 2;
        ctx.beginPath();
        ctx.strokeStyle = ringColor;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([8, 12]);
        ctx.lineDashOffset = -ringTime * 20;
        ctx.ellipse(0, 0, ringRad, ringRad * 0.85, ringTime * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Central glowing orb sphere
      const spherePulse = Math.sin(time * 2) * 2;
      const sphereGrad = ctx.createRadialGradient(
        orbX - radius * 0.3,
        orbY - radius * 0.3,
        radius * 0.1,
        orbX,
        orbY,
        radius + spherePulse
      );
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(0.3, coreColor1);
      sphereGrad.addColorStop(0.75, coreColor2);
      sphereGrad.addColorStop(1, 'rgba(15, 23, 42, 0.2)');

      ctx.save();
      ctx.shadowColor = coreColor1;
      ctx.shadowBlur = 18;
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, radius + spherePulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 4. Orbiting energy particles
      for (const p of particles) {
        p.angle += p.speed * speedFactor;
        const px = orbX + Math.cos(p.angle) * p.dist;
        const py = orbY + Math.sin(p.angle) * (p.dist * 0.65); // perspective ellipse

        ctx.fillStyle = state === 'thinking' ? '#FFFFFF' : coreColor1;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [state, size, interactive]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="pointer-events-none drop-shadow-2xl"
        aria-label={`AI Energy Orb status: ${state}`}
      />
    </div>
  );
}
