export default function StatCard({ label, value, help, tone = 'orange', icon, loading = false }) {
  return (
    <article className={`stat stat--${tone}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        {icon ? <span className="stat-icon">{icon}</span> : null}
      </div>
      {loading ? (
        <div className="skeleton" style={{ height: 30, width: '58%', marginTop: 10 }} />
      ) : (
        <div className="stat-value">{value}</div>
      )}
      {help ? <div className="stat-help">{help}</div> : null}
    </article>
  );
}
