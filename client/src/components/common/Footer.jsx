import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--o-gray-800)",
        color: "var(--o-gray-400)",
        padding: "32px 24px",
        marginTop: "auto",
      }}>
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 24,
        }}>
        <div>
          <div
            style={{
              color: "#fff",
              fontWeight: 700,
              fontSize: "1.143rem",
              marginBottom: 8,
            }}>
            <i className="fas fa-graduation-cap" style={{ marginRight: 6 }} />
            Learnova
          </div>
          <p style={{ fontSize: "0.857rem" }}>
            Learn anything. Grow everywhere.
          </p>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: "0.857rem" }}>
          <Link to="/courses" style={{ color: "var(--o-gray-400)" }}>
            Courses
          </Link>
          <Link to="/login" style={{ color: "var(--o-gray-400)" }}>
            Login
          </Link>
          <Link to="/signup" style={{ color: "var(--o-gray-400)" }}>
            Sign Up
          </Link>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 24,
          fontSize: "0.786rem",
          borderTop: "1px solid var(--o-gray-700)",
          paddingTop: 16,
        }}>
        © {new Date().getFullYear()} Learnova. All rights reserved.
      </div>
    </footer>
  );
}
