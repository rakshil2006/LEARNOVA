import { createContext, useState, useCallback, useMemo } from "react";

export const NotificationContext = createContext(null);

const TOAST_DURATION_MS = 4000;

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message, type = "info") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), TOAST_DURATION_MS);
    },
    [removeToast],
  );

  const toast = useMemo(
    () => ({
      success: (msg) => addToast(msg, "success"),
      error: (msg) => addToast(msg, "error"),
      info: (msg) => addToast(msg, "info"),
      warning: (msg) => addToast(msg, "warning"),
    }),
    [addToast],
  );

  return (
    <NotificationContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
    </NotificationContext.Provider>
  );
}
