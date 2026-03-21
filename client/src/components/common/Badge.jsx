export default function Badge({ children, type = "muted" }) {
  return <span className={`badge badge-${type}`}>{children}</span>;
}
