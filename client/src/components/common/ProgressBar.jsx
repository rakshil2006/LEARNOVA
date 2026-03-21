export default function ProgressBar({ value = 0, showLabel = false }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="o-progress" title={`${pct}%`}>
      <div
        className="o-progress-bar"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      />
      {showLabel && (
        <span
          style={{
            fontSize: "0.786rem",
            color: "var(--o-text-secondary)",
            marginTop: 2,
          }}>
          {pct}%
        </span>
      )}
    </div>
  );
}
