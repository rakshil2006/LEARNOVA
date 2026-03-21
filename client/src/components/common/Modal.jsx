import { useEffect } from "react";

export default function Modal({ title, children, footer, onClose, size = "" }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="o-dialog-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div
        className={`o-dialog ${size === "lg" ? "o-dialog-lg" : ""}`}
        role="dialog"
        aria-modal="true">
        <div className="o-dialog-header">
          <span>{title}</span>
          {onClose && (
            <button className="btn-icon" onClick={onClose} aria-label="Close">
              <i className="fas fa-times" />
            </button>
          )}
        </div>
        <div className="o-dialog-body">{children}</div>
        {footer && <div className="o-dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}
