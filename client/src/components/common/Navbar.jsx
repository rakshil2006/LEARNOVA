import { useState, useEffect, useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getInitials } from "../../utils/formatters";

export default function Navbar({ variant = "public" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Close dropdown on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  return (
    <nav className="o-topbar">
      <Link to="/" className="o-topbar-logo" style={{ textDecoration: "none" }}>
        <i className="fas fa-graduation-cap" />
        Learnova
      </Link>

      {variant === "public" && (
        <div className="o-topbar-nav" style={{ display: "flex", gap: 4 }}>
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? "active" : "")}>
            Home
          </NavLink>
          <NavLink
            to="/courses"
            className={({ isActive }) => (isActive ? "active" : "")}>
            Courses
          </NavLink>
        </div>
      )}

      {variant === "admin" && (
        <div className="o-topbar-nav">
          <NavLink
            to="/admin/dashboard"
            className={({ isActive }) => (isActive ? "active" : "")}>
            <i className="fas fa-book-open" /> Courses
          </NavLink>
          <NavLink
            to="/admin/reporting"
            className={({ isActive }) => (isActive ? "active" : "")}>
            <i className="fas fa-chart-bar" /> Reporting
          </NavLink>
          {/* Settings only for admin role */}
          {user?.role === "admin" && (
            <NavLink
              to="/admin/settings"
              className={({ isActive }) => (isActive ? "active" : "")}>
              <i className="fas fa-users-cog" /> Settings
            </NavLink>
          )}
        </div>
      )}

      <div className="o-topbar-actions">
        {!user ? (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </>
        ) : (
          <div className="dropdown" ref={dropdownRef}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="o-avatar-initials">
                {getInitials(user.name)}
              </span>
              {user.name.split(" ")[0]}
              <i
                className="fas fa-chevron-down"
                style={{ fontSize: "0.714rem" }}
              />
            </button>
            {menuOpen && (
              <div className="dropdown-menu" onClick={() => setMenuOpen(false)}>
                {(user.role === "admin" || user.role === "instructor") && (
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/admin/dashboard")}>
                    <i className="fas fa-cog" /> Backoffice
                  </button>
                )}
                <button
                  className="dropdown-item"
                  onClick={() =>
                    navigate(
                      user.role === "admin" || user.role === "instructor"
                        ? "/admin/dashboard"
                        : "/courses",
                    )
                  }>
                  <i className="fas fa-book-open" /> My Courses
                </button>
                {user.role === "admin" && (
                  <button
                    className="dropdown-item"
                    onClick={() => navigate("/admin/settings")}>
                    <i className="fas fa-users-cog" /> User Management
                  </button>
                )}
                <hr className="dropdown-divider" />
                <button className="dropdown-item danger" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt" /> Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
