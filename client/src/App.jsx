import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import AppRouter from "./routes/AppRouter";
import Toast from "./components/common/Toast";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <Toast />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
