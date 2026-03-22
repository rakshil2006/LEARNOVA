import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../../api/authApi";
import { useToast } from "../../hooks/useToast";
import {
  validateEmail,
  validatePassword,
  validateName,
} from "../../utils/validators";

export default function SignupPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "learner",
    security_question: "",
    security_answer: "",
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const e = {};
    if (!validateName(form.name)) e.name = "Name must be 2–150 characters";
    if (!validateEmail(form.email)) e.email = "Enter a valid email address";
    if (!validatePassword(form.password))
      e.password = "Min 8 chars, 1 uppercase, 1 number";
    if (form.password !== form.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!form.role) e.role = "Please select a role";
    if (!form.security_question)
      e.security_question = "Please select a security question";
    if (!form.security_answer.trim())
      e.security_answer = "Security answer is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        security_question: form.security_question,
        security_answer: form.security_answer,
      });
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err) {
      setApiError(
        err.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const f = (field) => ({
    value: form[field],
    onChange: (e) => setForm({ ...form, [field]: e.target.value }),
  });

  return (
    <div className="auth-page">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <div className="auth-logo">
            <i className="fas fa-graduation-cap" /> Learnova
          </div>
          <p className="auth-subtitle">Create your free account</p>
        </div>

        {apiError && <div className="auth-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">
              Full Name <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`o-input ${errors.name ? "error" : ""}`}
              {...f("name")}
              placeholder="Your full name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Email <span className="required">*</span>
            </label>
            <input
              type="email"
              className={`o-input ${errors.email ? "error" : ""}`}
              {...f("email")}
              placeholder="you@example.com"
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
                {...f("password")}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
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
          <div className="form-group">
            <label className="form-label">
              Confirm Password <span className="required">*</span>
            </label>
            <input
              type="password"
              className={`o-input ${errors.confirmPassword ? "error" : ""}`}
              {...f("confirmPassword")}
              placeholder="Repeat your password"
            />
            {errors.confirmPassword && (
              <span className="form-error">{errors.confirmPassword}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Role <span className="required">*</span>
            </label>
            <select
              className={`o-select ${errors.role ? "error" : ""}`}
              {...f("role")}>
              <option value="learner">Learner</option>
              <option value="instructor">Instructor</option>
            </select>
            {errors.role && <span className="form-error">{errors.role}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">
              Security Question <span className="required">*</span>
            </label>
            <select
              className={`o-select ${errors.security_question ? "error" : ""}`}
              {...f("security_question")}>
              <option value="">— Select a question —</option>
              <option value="What was the name of your first pet?">
                What was the name of your first pet?
              </option>
              <option value="What is your mother's maiden name?">
                What is your mother's maiden name?
              </option>
              <option value="What city were you born in?">
                What city were you born in?
              </option>
              <option value="What was the name of your primary school?">
                What was the name of your primary school?
              </option>
              <option value="What is your oldest sibling's middle name?">
                What is your oldest sibling's middle name?
              </option>
              <option value="What was the make of your first car?">
                What was the make of your first car?
              </option>
            </select>
            {errors.security_question && (
              <span className="form-error">{errors.security_question}</span>
            )}
          </div>
          <div className="form-group">
            <label className="form-label">
              Security Answer <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`o-input ${errors.security_answer ? "error" : ""}`}
              {...f("security_answer")}
              placeholder="Your answer (case-insensitive)"
              autoComplete="off"
            />
            {errors.security_answer && (
              <span className="form-error">{errors.security_answer}</span>
            )}
          </div>
          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={loading}
            style={{ justifyContent: "center" }}>
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
