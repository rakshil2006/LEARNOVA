import { useContext } from "react";
import { NotificationContext } from "../../context/NotificationContext";

const icons = {
  success: "fa-check-circle",
  error: "fa-times-circle",
  info: "fa-info-circle",
  warning: "fa-exclamation-triangle",
};

export default function Toast() {
  const { toasts, removeToast } = useContext(NotificationContext);
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`} role="alert">
          <i
            className={`fas ${icons[t.type] || icons.info}`}
            style={{
              color: `var(--o-${t.type === "error" ? "danger" : t.type})`,
            }}
          />
          <span className="toast-message">{t.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(t.id)}
            aria-label="Close">
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
