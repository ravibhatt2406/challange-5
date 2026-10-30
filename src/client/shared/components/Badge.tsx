export type BadgeColor = 'gray' | 'blue' | 'green' | 'yellow' | 'red' | 'emerald' | 'purple' | 'brand' | 'wedding' | 'birthday' | 'community' | 'rose' | 'amber';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  size?: 'sm' | 'md';
}

// Keep visual status choices centralized so badges remain consistent across features.
const colorMap: Record<BadgeColor, string> = {
  gray: 'bg-surface-700/50 text-surface-300',
  blue: 'bg-blue-500/15 text-blue-400',
  green: 'bg-green-500/15 text-green-400',
  yellow: 'bg-yellow-500/15 text-yellow-400',
  red: 'bg-red-500/15 text-red-400',
  emerald: 'bg-emerald-500/15 text-emerald-400',
  purple: 'bg-purple-500/15 text-purple-400',
  brand: 'bg-brand-500/15 text-brand-400',
  wedding: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-950/40',
  birthday: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm shadow-fuchsia-950/40',
  community: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/40',
  rose: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  amber: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
};

const sizeMap = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({
  children,
  color = 'gray',
  size = 'sm',
}: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${colorMap[color]} ${sizeMap[size]}`}>
      {children}
    </span>
  );
}
