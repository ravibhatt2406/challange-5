import type { ReactNode } from 'react';

/** Surface primitive for grouping related content while preserving semantic HTML. */
interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: 'div' | 'article' | 'section';
}

export default function Card({
  children,
  className = '',
  hover = false,
  as: Component = 'div',
}: CardProps) {
  return (
    <Component
      className={`glass-card p-6 animate-fade-in ${
        hover
          ? 'cursor-pointer transition-all hover:border-brand-500/30 hover:shadow-lg hover:shadow-brand-600/5 hover:-translate-y-0.5'
          : ''
      } ${className}`}
    >
      {children}
    </Component>
  );
}
