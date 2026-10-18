import React, { useState } from 'react';
<<<<<<< HEAD
import { formatRupiahAmount } from '../shared/currency.tsx';
=======
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443

export interface SparklinePoint {
  label: string; // e.g. "Nov", "Dec", "Jan", "Feb", "Mar", "Apr"
  value: number;
}

interface SparklineProps {
  data: SparklinePoint[];
  color?: string; // hex or CSS color
  fillColor?: string;
  height?: number;
  width?: number | string;
  formatValue?: (val: number) => string;
  badgeTrend?: string; // e.g. "+14.2%"
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = '#0f172a',
  fillColor,
  height = 36,
<<<<<<< HEAD
  formatValue = formatRupiahAmount,
=======
  formatValue = (v) => `$${v.toLocaleString()}`,
>>>>>>> 2e64693bfb1fbb36a821a7a7248b397ac785b443
  badgeTrend,
  isPositive = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const svgWidth = 140;
  const paddingX = 4;
  const paddingY = 4;
  const effectiveWidth = svgWidth - paddingX * 2;
  const effectiveHeight = height - paddingY * 2;

  // Calculate coordinates
  const points = data.map((d, i) => {
    const x = paddingX + (i / (data.length - 1)) * effectiveWidth;
    const y = paddingY + effectiveHeight - ((d.value - min) / range) * effectiveHeight;
    return { x, y, ...d };
  });

  // SVG path string (smooth cubic bezier or straight lines)
  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    // Simple smooth curve control points
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  // Closed area path for gradient
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

  const gradientId = `sparkline-grad-${color.replace('#', '')}-${Math.random().toString(36).substr(2, 5)}`;

  return (
    <div className="relative group flex items-center justify-between gap-3 pt-2">
      <div className="flex-1 relative" style={{ height: `${height}px` }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${height}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor || color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={fillColor || color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <path d={areaD} fill={`url(#${gradientId})`} />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoveredIndex === i ? 3.5 : i === points.length - 1 ? 2.5 : 1.5}
              fill={hoveredIndex === i ? '#ffffff' : color}
              stroke={color}
              strokeWidth={hoveredIndex === i ? 2 : 1}
              className="transition-all duration-150 cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap z-20"
            style={{
              left: `${(points[hoveredIndex].x / svgWidth) * 100}%`,
            }}
          >
            {points[hoveredIndex].label}: {formatValue(points[hoveredIndex].value)}
          </div>
        )}
      </div>

      {/* Trend Indicator */}
      {badgeTrend && (
        <div className="shrink-0 flex items-center gap-1 text-[11px] font-mono font-semibold">
          <span className={isPositive ? 'text-emerald-700' : 'text-rose-600'}>
            {badgeTrend}
          </span>
          <span className="text-[10px] text-slate-400 font-sans font-normal">6m trend</span>
        </div>
      )}
    </div>
  );
};
