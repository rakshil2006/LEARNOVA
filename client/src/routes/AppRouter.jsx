import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

const LandingPage = lazy(() => import("../pages/public/LandingPage"));
const LoginPage = lazy(() => import("../pages/public/LoginPage"));
const SignupPage = lazy(() => import("../pages/public/SignupPage"));
const DashboardPage = lazy(() => import("../pages/admin/DashboardPage"));
const CourseFormPage = lazy(() => import("../pages/admin/CourseFormPage"));
const ReportingPage = lazy(() => import("../pages/admin/ReportingPage"));
const SettingsPage = lazy(() => import("../pages/admin/SettingsPage"));
const CoursesPage = lazy(() => import("../pages/learner/CoursesPage"));
const CourseDetailPage = lazy(
  () => import("../pages/learner/CourseDetailPage"),
);
const LessonPlayerPage = lazy(
  () => import("../pages/learner/LessonPlayerPage"),
);

const Loader = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
    }}>
    <i
      className="fas fa-spinner fa-spin"
      style={{ fontSize: "2rem", color: "var(--o-primary)" }}
    />
  </div>
);

export default function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route
          path="/courses/:courseId/lessons/:lessonId"
          element={
            <ProtectedRoute>
              <LessonPlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute roles={["admin", "instructor"]}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/courses/:id/edit"
          element={
            <RoleRoute roles={["admin", "instructor"]}>
              <CourseFormPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/reporting"
          element={
            <RoleRoute roles={["admin", "instructor"]}>
              <ReportingPage />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <RoleRoute roles={["admin"]}>
              <SettingsPage />
            </RoleRoute>
          }
        />
        <Route
          path="*"
          element={
            <div className="empty-state" style={{ height: "100vh" }}>
              <div className="empty-state-icon">
                <i className="fas fa-map-signs" />
              </div>
              <div className="empty-state-title">Page Not Found</div>
              <a href="/" className="btn btn-primary mt-3">
                Go Home
              </a>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
