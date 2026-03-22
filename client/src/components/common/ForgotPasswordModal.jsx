import { useState } from "react";
import {
  getSecurityQuestion,
  resetPasswordWithAnswer,
} from "../../api/authApi";
import { validateEmail, validatePassword } from "../../utils/validators";

// step: 'email' | 'answer' | 'done'
export default function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState("email");
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
      setError(err.response?.data?.error || "Could not find account");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!answer.trim()) return setError("Please enter your answer");
    if (!validatePassword(newPassword))
      return setError("Password: min 8 chars, 1 uppercase, 1 number");
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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 420 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {step === "done" ? "Password Reset" : "Forgot Password"}
          </h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="modal-body">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} noValidate>
              <p
                style={{
                  marginBottom: 16,
                  color: "var(--text-secondary)",
                  fontSize: 14,
                }}>
                Enter your registered email and we'll ask your security
                question.
              </p>
              {error && (
                <div className="auth-error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="o-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ justifyContent: "center" }}>
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
              {error && (
                <div className="auth-error" style={{ marginBottom: 12 }}>
                  {error}
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Security Question</label>
                <p
                  style={{
                    padding: "10px 12px",
                    background: "var(--bg-secondary, #f5f5f5)",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}>
                  {question}
                </p>
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
                    <i
                      className={`fas ${showPw ? "fa-eye-slash" : "fa-eye"}`}
                    />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
                style={{ justifyContent: "center" }}>
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Resetting...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {step === "done" && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <i
                className="fas fa-check-circle"
                style={{
                  fontSize: 48,
                  color: "var(--success, #22c55e)",
                  marginBottom: 16,
                }}
              />
              <p style={{ marginBottom: 20, color: "var(--text-secondary)" }}>
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
