'use client';

interface ScoreGaugeProps {
  score: number;
}

export function ScoreGauge({ score }: ScoreGaugeProps) {
  const clipped = Math.min(100, Math.max(0, Math.round(score)));
  const color = clipped >= 70 ? '#10b981' : clipped >= 45 ? '#f59e0b' : '#ef4444';

  const r = 36;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - clipped / 100);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={96} height={96} viewBox="0 0 96 96">
        <circle cx={48} cy={48} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={48}
          cy={48}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={8}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x={48} y={52} textAnchor="middle" fontSize={18} fontWeight="700" fill={color}>
          {clipped}%
        </text>
      </svg>
      <p className="text-xs text-gray-500 font-medium">Score de match</p>
    </div>
  );
}
