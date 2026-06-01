interface StatCardProps {
  label: string;
  value: number | string;
}

export function StatCard({ label, value }: StatCardProps) {
  return (
    <div className="card stat">
      <p>{label}</p>
      <div className="value">{value}</div>
    </div>
  );
}
