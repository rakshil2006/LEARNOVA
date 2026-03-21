import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { login as loginApi } from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { validateEmail } from "../../utils/validators";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") || null;

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!validateEmail(form.email)) e.email = "Enter a valid email address";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await loginApi(form);
      login(res.data.accessToken, res.data.user);
      toast.success("Welcome back!");
      const role = res.data.user.role;
      if (redirect) navigate(redirect);
      else if (role === "admin" || role === "instructor")
        navigate("/admin/dashboard");
      else navigate("/courses");
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <i className="fas fa-graduation-cap" /> Learnova
          </div>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className={`o-input ${errors.email ? "error" : ""}`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Password <span className="required">*</span>
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                className={`o-input ${errors.password ? "error" : ""}`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 36 }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: "absolute",
                  right: 4,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
                aria-label="Toggle password">
                <i className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`} />
              </button>
            </div>
            {errors.password && (
              <span className="form-error">{errors.password}</span>
            )}
          </div>
          <div style={{ textAlign: "right", marginBottom: 16 }}>
            <span className="forgot-link">Forgot password?</span>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ justifyContent: "center" }}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Signing in...
              </>
            ) : (
              "Log In"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>
    </div>
  );
}
