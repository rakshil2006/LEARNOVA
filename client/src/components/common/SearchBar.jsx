export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  style,
}) {
  return (
    <div style={{ position: "relative", ...style }}>
      <i
        className="fas fa-search"
        style={{
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--o-text-muted)",
          fontSize: "0.857rem",
        }}
      />
      <input
        type="text"
        className="o-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ paddingLeft: 28 }}
      />
    </div>
  );
}
