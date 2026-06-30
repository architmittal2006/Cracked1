import React from 'react';

interface RadarChartProps {
  scores: {
    problem_framing: number;
    framework_fit: number;
    data_integrity: number;
    insight_depth: number;
    feasibility: number;
  };
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ scores, size = 200 }) => {
  const center = size / 2;
  const radius = (size / 2) * 0.75; // Leave room for labels
  const maxScore = 5;
  
  // The 5 axes in order
  const axes = [
    { key: 'problem_framing', label: 'PF' },
    { key: 'framework_fit', label: 'FF' },
    { key: 'insight_depth', label: 'ID' }, // Reordered slightly for better shape
    { key: 'feasibility', label: 'FE' },
    { key: 'data_integrity', label: 'DI' },
  ];
  
  const numAxes = axes.length;
  const angleStep = (Math.PI * 2) / numAxes;
  
  // Calculate coordinates for a point on an axis
  const getPoint = (score: number, index: number) => {
    const angle = index * angleStep - Math.PI / 2; // Start at top
    const distance = (score / maxScore) * radius;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { x, y };
  };

  // Generate grid polygons (levels 1 to 5)
  const gridPolygons = [1, 2, 3, 4, 5].map(level => {
    const points = Array.from({ length: numAxes }).map((_, i) => {
      const p = getPoint(level, i);
      return `${p.x},${p.y}`;
    }).join(' ');
    return points;
  });

  // Generate data polygon
  const dataPoints = axes.map((axis, i) => {
    const score = scores[axis.key as keyof typeof scores];
    const p = getPoint(score, i);
    return `${p.x},${p.y}`;
  }).join(' ');

  // Labels coordinates
  const labelCoords = axes.map((axis, i) => {
    // Push labels slightly outside the max radius
    const angle = i * angleStep - Math.PI / 2;
    const distance = radius + 20;
    const x = center + distance * Math.cos(angle);
    const y = center + distance * Math.sin(angle);
    return { ...axis, x, y };
  });

  return (
    <div className="flex justify-center items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
        <defs>
          <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid */}
        {gridPolygons.map((points, i) => (
          <polygon 
            key={`grid-${i}`}
            points={points} 
            fill="transparent" 
            stroke="rgba(148, 163, 184, 0.15)" 
            strokeWidth="1" 
          />
        ))}

        {/* Axes lines */}
        {axes.map((_, i) => {
          const p = getPoint(maxScore, i);
          return (
            <line 
              key={`axis-${i}`}
              x1={center} y1={center} 
              x2={p.x} y2={p.y} 
              stroke="rgba(148, 163, 184, 0.15)" 
              strokeWidth="1" 
            />
          );
        })}

        {/* Data Area */}
        <polygon 
          points={dataPoints} 
          fill="url(#emeraldGradient)" 
          stroke="#10b981" 
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: 'all 0.5s ease' }}
          filter="url(#glow)"
        />

        {/* Data Points */}
        {axes.map((axis, i) => {
          const score = scores[axis.key as keyof typeof scores];
          const p = getPoint(score, i);
          return (
            <circle 
              key={`point-${i}`}
              cx={p.x} cy={p.y} 
              r="4" 
              fill="#fff" 
              stroke="#10b981"
              strokeWidth="2"
              style={{ transition: 'all 0.5s ease' }}
            />
          );
        })}

        {/* Labels */}
        {labelCoords.map((label, i) => (
          <text 
            key={`label-${i}`}
            x={label.x} y={label.y} 
            fill="#94a3b8" 
            fontSize="10" 
            fontWeight="bold"
            fontFamily="monospace"
            textAnchor="middle" 
            dominantBaseline="middle"
          >
            {label.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
