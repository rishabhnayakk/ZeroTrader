import './StatCard.css';

export default function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{label}</span>
        {Icon && <div className="stat-icon"><Icon size={16} /></div>}
      </div>
      <div className={`stat-value ${color || ''}`}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
