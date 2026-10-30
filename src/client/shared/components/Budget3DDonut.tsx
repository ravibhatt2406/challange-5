import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { BudgetItem } from '../../../shared/types/budget';

interface Budget3DDonutProps {
  items: BudgetItem[];
  totalBudget: number;
  currency?: string;
  className?: string;
}

interface SliceData {
  category: string;
  amount: number;
  percent: number;
  startAngle: number;
  endAngle: number;
  color: string;
  darkColor: string;
}

const CATEGORY_COLORS: Record<string, { main: string; dark: string }> = {
  'Venue': { main: '#6366F1', dark: '#4338CA' },
  'Venue & Catering': { main: '#6366F1', dark: '#4338CA' },
  'Venue & Food': { main: '#6366F1', dark: '#4338CA' },
  'Venue & Permits': { main: '#6366F1', dark: '#4338CA' },
  'Catering': { main: '#EC4899', dark: '#BE185D' },
  'Food & Supplies': { main: '#EC4899', dark: '#BE185D' },
  'Decor': { main: '#8B5CF6', dark: '#6D28D9' },
  'Flowers & Decor': { main: '#8B5CF6', dark: '#6D28D9' },
  'Cake & Decor': { main: '#F43F5E', dark: '#BE123C' },
  'Media': { main: '#06B6D4', dark: '#0E7490' },
  'Photography & Media': { main: '#06B6D4', dark: '#0E7490' },
  'Photography & Video': { main: '#06B6D4', dark: '#0E7490' },
  'Entertainment': { main: '#10B981', dark: '#047857' },
  'Music & DJ': { main: '#10B981', dark: '#047857' },
  'Entertainment & Games': { main: '#10B981', dark: '#047857' },
  'Sound & Activities': { main: '#10B981', dark: '#047857' },
  'Permits': { main: '#F59E0B', dark: '#B45309' },
  'Contingency Buffer': { main: '#EAB308', dark: '#A16207' },
  'Favors & Contingency': { main: '#EAB308', dark: '#A16207' },
  'Volunteers & Safety': { main: '#14B8A6', dark: '#0F766E' },
};

const DEFAULT_PALETTE = [
  { main: '#6366F1', dark: '#4338CA' },
  { main: '#EC4899', dark: '#BE185D' },
  { main: '#8B5CF6', dark: '#6D28D9' },
  { main: '#06B6D4', dark: '#0E7490' },
  { main: '#10B981', dark: '#047857' },
  { main: '#F59E0B', dark: '#B45309' },
];

/**
 * Interactive 3D Holographic Donut Chart for Budget Allocation.
 * Features 3D cylindrical extrusion depth, slice hover pop-out,
 * mouse drag rotation, and glowing center financial metrics.
 */
export default function Budget3DDonut({
  items,
  totalBudget,
  currency = 'USD',
  className = '',
}: Budget3DDonutProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [hoveredSlice, setHoveredSlice] = useState<SliceData | null>(null);
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);

  // Group items by category
  const slices: SliceData[] = useMemo(() => {
    if (!items.length) return [];
    const grouped = new Map<string, number>();
    for (const item of items) {
      const cat = item.category || 'Other';
      grouped.set(cat, (grouped.get(cat) ?? 0) + item.estimated_cost);
    }

    const totalPlanned = Array.from(grouped.values()).reduce((a, b) => a + b, 0);
    const denominator = totalPlanned > 0 ? totalPlanned : 1;

    let currentAngle = 0;
    let colorIdx = 0;
    const result: SliceData[] = [];

    for (const [category, amount] of grouped.entries()) {
      const percent = amount / denominator;
      const angleLength = percent * Math.PI * 2;
      const palette = CATEGORY_COLORS[category] ?? DEFAULT_PALETTE[colorIdx % DEFAULT_PALETTE.length] ?? { main: '#6366F1', dark: '#4338CA' };
      colorIdx++;

      result.push({
        category,
        amount,
        percent,
        startAngle: currentAngle,
        endAngle: currentAngle + angleLength,
        color: palette.main,
        darkColor: palette.dark,
      });

      currentAngle += angleLength;
    }

    return result;
  }, [items]);

  const totalSpent = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.actual_cost ?? 0), 0);
  }, [items]);

  const remaining = totalBudget - totalSpent;

  // Mouse interaction handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMouseXRef.current = e.clientX;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      const deltaX = e.clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.clientX;
      setRotation((prev) => prev + deltaX * 0.015);
      return;
    }

    // Check hit test for hover
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = (e.clientY - rect.top - rect.height / 2) / 0.6; // account for isometric flattening

    const dist = Math.sqrt(x * x + y * y);
    const outerRadius = 110;
    const innerRadius = 60;

    if (dist >= innerRadius && dist <= outerRadius + 15) {
      let mouseAngle = Math.atan2(y, x) - rotation;
      while (mouseAngle < 0) mouseAngle += Math.PI * 2;
      while (mouseAngle >= Math.PI * 2) mouseAngle -= Math.PI * 2;

      const hit = slices.find((s) => mouseAngle >= s.startAngle && mouseAngle < s.endAngle);
      setHoveredSlice(hit ?? null);
    } else {
      setHoveredSlice(null);
    }
  }, [rotation, slices]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 320;
    const height = 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2 + 10;
    const outerR = 105;
    const innerR = 60;
    const depth3D = 22; // 3D cylinder extrusion thickness
    const flattenY = 0.65; // isometric tilt ratio

    if (slices.length === 0) {
      // Empty state cylinder
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(1, flattenY);
      ctx.beginPath();
      ctx.arc(0, 0, outerR, 0, Math.PI * 2);
      ctx.arc(0, 0, innerR, 0, Math.PI * 2, true);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      return;
    }

    // 1. Draw 3D Extrusion Depth (Bottom & sides)
    for (let d = depth3D; d > 0; d -= 2) {
      ctx.save();
      ctx.translate(centerX, centerY + d);
      ctx.scale(1, flattenY);

      for (const slice of slices) {
        const isHovered = hoveredSlice?.category === slice.category;
        const extrude = isHovered ? 8 : 0;
        const midAngle = (slice.startAngle + slice.endAngle) / 2 + rotation;
        const ex = Math.cos(midAngle) * extrude;
        const ey = Math.sin(midAngle) * extrude;

        ctx.beginPath();
        ctx.arc(ex, ey, outerR, slice.startAngle + rotation, slice.endAngle + rotation);
        ctx.arc(ex, ey, innerR, slice.endAngle + rotation, slice.startAngle + rotation, true);
        ctx.closePath();
        ctx.fillStyle = slice.darkColor;
        ctx.globalAlpha = 0.5;
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Draw Top Donut Surface
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.scale(1, flattenY);

    for (const slice of slices) {
      const isHovered = hoveredSlice?.category === slice.category;
      const extrude = isHovered ? 10 : 0;
      const midAngle = (slice.startAngle + slice.endAngle) / 2 + rotation;
      const ex = Math.cos(midAngle) * extrude;
      const ey = Math.sin(midAngle) * extrude;

      ctx.save();
      if (isHovered) {
        ctx.shadowColor = slice.color;
        ctx.shadowBlur = 18;
      }

      ctx.beginPath();
      ctx.arc(ex, ey, outerR, slice.startAngle + rotation, slice.endAngle + rotation);
      ctx.arc(ex, ey, innerR, slice.endAngle + rotation, slice.startAngle + rotation, true);
      ctx.closePath();
      ctx.fillStyle = slice.color;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();

    // 3. Central glowing holographic display
    ctx.save();
    ctx.shadowColor = 'rgba(99, 102, 241, 0.4)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const currSymbol = currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '$';

    if (hoveredSlice) {
      ctx.font = 'bold 13px system-ui, sans-serif';
      ctx.fillStyle = hoveredSlice.color;
      ctx.fillText(hoveredSlice.category, centerX, centerY - 14);

      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${currSymbol}${hoveredSlice.amount.toLocaleString()}`, centerX, centerY + 4);

      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText(`${Math.round(hoveredSlice.percent * 100)}% of plan`, centerX, centerY + 20);
    } else {
      ctx.font = '10px system-ui, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillText('BUDGET POOL', centerX, centerY - 16);

      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(`${currSymbol}${totalBudget.toLocaleString()}`, centerX, centerY + 2);

      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = remaining >= 0 ? '#34D399' : '#F87171';
      ctx.fillText(remaining >= 0 ? `+${currSymbol}${remaining.toLocaleString()} left` : `-${currSymbol}${Math.abs(remaining).toLocaleString()}`, centerX, centerY + 18);
    }
    ctx.restore();
  }, [slices, totalBudget, hoveredSlice, rotation, remaining, currency]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setRotation((prev) => prev - 0.2);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setRotation((prev) => prev + 0.2);
    }
  };

  return (
    <figure
      role="region"
      aria-label="3D Interactive Budget Breakdown"
      className={`relative flex flex-col items-center select-none ${className}`}
    >
      <figcaption className="sr-only">
        Interactive 3D Budget Ring for {currency} {totalBudget.toLocaleString()}.
        Remaining funds: {remaining >= 0 ? '+' : '-'}{currency} {Math.abs(remaining).toLocaleString()}.
      </figcaption>

      <canvas
        ref={canvasRef}
        style={{ width: 320, height: 240 }}
        tabIndex={0}
        role="img"
        aria-label={`3D Budget Ring with ${slices.length} categories. Use Left and Right arrow keys to rotate.`}
        className="cursor-grab active:cursor-grabbing transition-transform focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-xl"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onKeyDown={handleKeyDown}
      />

      <div className="flex items-center gap-2 text-[11px] text-surface-400 mt-1" aria-hidden="true">
        <span>✨ Drag or Arrow keys to rotate</span>
        <span>•</span>
        <span>Hover slices to inspect</span>
      </div>

      {/* Screen-reader accessible data table */}
      <table className="sr-only">
        <caption>Category allocations and expenditure</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            <th scope="col">Planned Amount</th>
            <th scope="col">Share of Budget</th>
          </tr>
        </thead>
        <tbody>
          {slices.map((slice) => (
            <tr key={slice.category}>
              <td>{slice.category}</td>
              <td>{currency} {slice.amount.toLocaleString()}</td>
              <td>{Math.round(slice.percent * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
