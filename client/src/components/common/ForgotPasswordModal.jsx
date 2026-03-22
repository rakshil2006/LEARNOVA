import { useState } from "react";
import {
  getSecurityQuestion,
  resetPasswordWithAnswer,
} from "../../api/authApi";
import { validateEmail, validatePassword } from "../../utils/validators";

export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("email"); // 'email' | 'answer' | 'done'
  const [email, setEmail] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(email)) return setError("Enter a valid email address");
    setLoading(true);
    try {
      const res = await getSecurityQuestion(email);
      setQuestion(res.data.security_question);
      setStep("answer");
    } catch (err) {
      setError(err.response?.data?.error || "No account found with that email");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!answer.trim()) return setError("Please enter your answer");
    if (!validatePassword(newPassword))
      return setError("Password must be min 8 chars, 1 uppercase, 1 number");
    setLoading(true);
    try {
      await resetPasswordWithAnswer({
        email,
        security_answer: answer,
        new_password: newPassword,
      });
      setStep("done");
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="o-dialog-backdrop" onClick={onClose}>
      <div
        className="o-dialog"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="o-dialog-header">
          <span>{step === "done" ? "Password Reset" : "Forgot Password"}</span>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="o-dialog-body">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} noValidate>
              <p
                style={{
                  marginBottom: 16,
                  color: "var(--o-text-secondary)",
                  fontSize: "0.929rem",
                }}>
                Enter your registered email and we'll show your security
                question.
              </p>
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="o-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  autoComplete="email"
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ justifyContent: "center", marginTop: 4 }}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Checking...
                  </>
                ) : (
                  "Continue"
                )}
              </button>
            </form>
          )}

          {step === "answer" && (
            <form onSubmit={handleReset} noValidate>
              {error && <div className="auth-error">{error}</div>}
              <div className="form-group">
                <label className="form-label">Security Question</label>
                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--o-gray-100)",
                    border: "1px solid var(--o-border)",
                    borderRadius: "var(--o-radius-sm)",
                    fontSize: "0.929rem",
                    color: "var(--o-text-primary)",
                  }}>
                  {question}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Your Answer</label>
                <input
                  type="text"
                  className="o-input"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Case-insensitive"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPw ? "text" : "password"}
                    className="o-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                    style={{ paddingRight: 40 }}
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
                    aria-label="Toggle password visibility">
                    <i
                      className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setStep("email");
                    setError("");
                  }}
                  style={{ flex: 1, justifyContent: "center" }}>
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 2, justifyContent: "center" }}>
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin" /> Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "8px 0 16px" }}>
              <i
                className="fas fa-check-circle"
                style={{
                  fontSize: 52,
                  color: "var(--o-success)",
                  marginBottom: 16,
                  display: "block",
                }}
              />
              <p
                style={{
                  marginBottom: 24,
                  color: "var(--o-text-secondary)",
                  fontSize: "0.929rem",
                }}>
                Your password has been reset successfully. You can now log in
                with your new password.
              </p>
              <button
                className="btn btn-primary"
                onClick={onClose}
                style={{ justifyContent: "center" }}>
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
