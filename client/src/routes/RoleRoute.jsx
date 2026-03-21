import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function RoleRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "2rem", color: "var(--o-primary)" }}
        />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/courses" replace />;
  return children;
}
