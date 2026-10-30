import { useRef, useCallback, type ReactNode, type CSSProperties } from 'react';

interface Tilt3DCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;  // tilt degree intensity (default 12)
  glare?: boolean;     // enable specular glass sheen
  scale?: number;      // hover scale factor
  as?: 'div' | 'article' | 'section';
  style?: CSSProperties;
}

/**
 * Interactive 3D perspective tilt card.
 * Tracks mouse position and applies real-time rotateX/Y/translateZ transforms
 * with a specular glass sheen reflection layer.
 */
export default function Tilt3DCard({
  children,
  className = '',
  intensity = 12,
  glare = true,
  scale = 1.02,
  as: Component = 'div',
  style,
}: Tilt3DCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateY = ((x - centerX) / centerX) * intensity;
      const rotateX = ((centerY - y) / centerY) * intensity;

      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) scale3d(${scale}, ${scale}, 1)`;

      if (glare && glareRef.current) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glareRef.current.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.15) 0%, transparent 60%)`;
        glareRef.current.style.opacity = '1';
      }
    },
    [intensity, scale, glare]
  );

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1,1,1)';
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  }, []);

  return (
    <Component
      ref={cardRef as React.Ref<HTMLDivElement>}
      className={`tilt-3d-card ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1)',
        willChange: 'transform',
        position: 'relative',
        ...style,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="tilt-3d-glare"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 'inherit',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.3s ease',
            zIndex: 10,
          }}
          aria-hidden="true"
        />
      )}
    </Component>
  );
}
