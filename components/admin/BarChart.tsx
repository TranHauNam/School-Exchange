interface BarChartBar {
  label: string;
  heightPct: number;
  color?: string;
}

interface BarChartProps {
  bars: BarChartBar[];
}

export function BarChart({ bars }: BarChartProps) {
  return (
    <div className="chart">
      {bars.map((bar) => (
        <div
          key={bar.label}
          className="bar"
          style={{
            height: `${Math.max(8, Math.min(100, bar.heightPct))}%`,
            background: bar.color,
          }}
        >
          <span>{bar.label}</span>
        </div>
      ))}
    </div>
  );
}
