export default function StarRating({
  value = 0,
  onChange,
  readonly = false,
  size = "1rem",
}) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`${star <= value ? "fas" : "far"} fa-star`}
          style={{
            color: star <= value ? "var(--o-warning)" : "var(--o-gray-400)",
            fontSize: size,
            cursor: readonly ? "default" : "pointer",
          }}
          onClick={() => !readonly && onChange?.(star)}
          role={readonly ? undefined : "button"}
          aria-label={
            readonly ? undefined : `Rate ${star} star${star > 1 ? "s" : ""}`
          }
        />
      ))}
    </div>
  );
}
