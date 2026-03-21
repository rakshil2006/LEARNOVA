import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ProgressBar from "../../components/common/ProgressBar";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { useDebounce } from "../../hooks/useDebounce";
import { useRecommendations } from "../../hooks/useRecommendations";
import { getPublicCourses, purchaseCourse } from "../../api/courseApi";
import { formatDuration, getInitials } from "../../utils/formatters";
import { getBadge, getNextBadge } from "../../utils/constants";
import Modal from "../../components/common/Modal";

function imgUrl(url) {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `http://localhost:5000${url}`;
}

function CourseCard({ course, onAction }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getCtaLabel = () => {
    if (!user) return { label: "Join Course", action: "login" };
    if (course.access_rule === "payment" && !course.is_purchased)
      return { label: `Buy — $${course.price}`, action: "buy" };
    if (
      !course.enrollment_status ||
      course.enrollment_status === "yet_to_start"
    )
      return { label: "Start", action: "start" };
    if (course.enrollment_status === "in_progress")
      return { label: "Continue", action: "start" };
    if (course.enrollment_status === "completed")
      return { label: "Review", action: "start" };
    return { label: "Enroll", action: "start" };
  };

  const { label, action } = getCtaLabel();
  const pct = course.enrollment_status ? course.completion_percent || 0 : null;

  return (
    <div className="course-card">
      {course.cover_image_url ? (
        <img
          src={imgUrl(course.cover_image_url)}
          alt={course.title}
          className="course-card-img"
          loading="lazy"
          style={{ display: "block" }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.nextSibling.style.display = "flex";
          }}
        />
      ) : null}
      <div
        className="course-card-img"
        style={{ display: course.cover_image_url ? "none" : "flex" }}>
        <i className="fas fa-book-open" />
      </div>
      <div className="course-card-body">
        <div className="course-card-title">{course.title}</div>
        {course.short_description && (
          <div className="course-card-desc">{course.short_description}</div>
        )}
        {course.tags?.length > 0 && (
          <div className="course-card-tags">
            {course.tags.slice(0, 3).map((t) => (
              <span key={t} className="tag-chip">
                {t}
              </span>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            fontSize: "0.786rem",
            color: "var(--o-text-secondary)",
            marginBottom: 8,
          }}>
          <span>
            <i className="fas fa-play-circle" /> {course.total_lessons || 0}{" "}
            lessons
          </span>
          {course.total_duration_seconds > 0 && (
            <span>
              <i className="fas fa-clock" />{" "}
              {formatDuration(course.total_duration_seconds)}
            </span>
          )}
        </div>
        {pct !== null && (
          <div style={{ marginBottom: 8 }}>
            <ProgressBar value={pct} />
            <span
              style={{
                fontSize: "0.786rem",
                color: "var(--o-text-secondary)",
              }}>
              {pct}% complete
            </span>
          </div>
        )}
        <button
          className={`btn btn-sm w-full ${action === "buy" ? "btn-success" : "btn-primary"}`}
          style={{ justifyContent: "center" }}
          onClick={() => onAction(course, action)}>
          {label}
        </button>
      </div>
    </div>
  );
}

function ProfilePanel({ user }) {
  const badge = getBadge(user?.total_points || 0);
  const nextBadge = getNextBadge(user?.total_points || 0);
  const pts = user?.total_points || 0;
  const pct = nextBadge
    ? Math.round(
        ((pts - badge.minPoints) / (nextBadge.minPoints - badge.minPoints)) *
          100,
      )
    : 100;

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: "#fff",
        border: "1px solid var(--o-border)",
        borderRadius: "var(--o-radius-lg)",
        padding: 20,
        height: "fit-content",
        position: "sticky",
        top: 62,
      }}>
      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--o-primary)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            fontWeight: 700,
            margin: "0 auto 8px",
          }}>
          {getInitials(user?.name)}
        </div>
        <div style={{ fontWeight: 500 }}>{user?.name}</div>
        <div style={{ fontSize: "0.857rem", color: "var(--o-text-secondary)" }}>
          {user?.email}
        </div>
      </div>
      <hr className="divider" />
      <div style={{ textAlign: "center", marginBottom: 12 }}>
        <div
          style={{
            fontSize: "2rem",
            fontWeight: 700,
            color: "var(--o-primary)",
          }}>
          {pts}
        </div>
        <div style={{ fontSize: "0.857rem", color: "var(--o-text-secondary)" }}>
          Total Points
        </div>
      </div>
      {badge && (
        <div
          style={{
            background: "var(--o-primary-subtle)",
            borderRadius: "var(--o-radius)",
            padding: "10px 12px",
            marginBottom: 12,
          }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 6,
            }}>
            <span style={{ fontSize: "1.5rem" }}>{badge.icon}</span>
            <div>
              <div style={{ fontWeight: 500 }}>{badge.name}</div>
              <div
                style={{
                  fontSize: "0.786rem",
                  color: "var(--o-text-secondary)",
                }}>
                Current Badge
              </div>
            </div>
          </div>
          {nextBadge && (
            <>
              <ProgressBar value={pct} />
              <div
                style={{
                  fontSize: "0.786rem",
                  color: "var(--o-text-secondary)",
                  marginTop: 4,
                }}>
                {nextBadge.minPoints - pts} pts to {nextBadge.icon}{" "}
                {nextBadge.name}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function RecommendationsSection() {
  const navigate = useNavigate();
  const { recommendations, loading } = useRecommendations();

  if (loading || recommendations.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid var(--o-border)",
          paddingBottom: 12,
          marginBottom: 16,
        }}>
        <span
          style={{
            fontSize: "1.143rem",
            fontWeight: 500,
            color: "var(--o-text-primary)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
          <i className="fas fa-brain" style={{ color: "var(--o-danger)" }} />
          Practice These Topics
        </span>
        <span
          style={{ fontSize: "0.857rem", color: "var(--o-text-secondary)" }}>
          Based on your quiz performance
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
        }}
        className="recommendations-grid">
        {recommendations.map((r) => (
          <div
            key={r.quiz_id}
            style={{
              background: "var(--o-bg-view)",
              border: "1px solid var(--o-border)",
              borderLeft: "4px solid var(--o-danger)",
              borderRadius: "var(--o-radius)",
              padding: 16,
              boxShadow: "var(--o-shadow-sm)",
            }}>
            <div
              style={{
                fontWeight: 500,
                color: "var(--o-text-primary)",
                fontSize: "1rem",
              }}>
              {r.quiz_title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: "var(--o-text-secondary)",
                fontSize: "0.857rem",
                marginTop: 4,
              }}>
              <i className="fas fa-book-open" />
              {r.course_title}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <span
                style={{
                  background: "var(--o-warning-light)",
                  color: "#856404",
                  borderRadius: 20,
                  padding: "2px 8px",
                  fontSize: "0.857rem",
                }}>
                Attempted {r.total_attempts}x
              </span>
              <span
                style={{
                  background:
                    parseFloat(r.avg_score_pct) < 60
                      ? "var(--o-danger-light)"
                      : "var(--o-warning-light)",
                  color:
                    parseFloat(r.avg_score_pct) < 60
                      ? "var(--o-danger)"
                      : "#856404",
                  borderRadius: 20,
                  padding: "2px 8px",
                  fontSize: "0.857rem",
                }}>
                {parseFloat(r.avg_score_pct).toFixed(0)}% avg
              </span>
            </div>
            <button
              className="btn btn-primary btn-sm w-full"
              style={{ marginTop: 12, justifyContent: "center" }}
              onClick={() => navigate(r.player_url)}>
              Practice Now →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [buyTarget, setBuyTarget] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (user && (user.role === "admin" || user.role === "instructor")) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPublicCourses({ q: debouncedSearch });
      setCourses(res.data);
    } catch {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAction = (course, action) => {
    if (action === "login") {
      navigate(`/login?redirect=/courses`);
      return;
    }
    if (action === "buy") {
      setBuyTarget(course);
      return;
    }
    navigate(`/courses/${course.id}`);
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      await purchaseCourse(buyTarget.id);
      toast.success("Purchase successful!");
      setBuyTarget(null);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Purchase failed. Please try again.",
      );
    } finally {
      setBuying(false);
    }
  };

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant="public" />
      <div
        style={{
          flex: 1,
          padding: "24px",
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}>
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}>
              <h2>Courses</h2>
              <input
                className="o-input"
                style={{ width: 240 }}
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="courses-grid">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    style={{
                      background: "#fff",
                      border: "1px solid var(--o-border)",
                      borderRadius: "var(--o-radius-lg)",
                      overflow: "hidden",
                    }}>
                    <div className="skeleton" style={{ height: 160 }} />
                    <div style={{ padding: 12 }}>
                      <div
                        className="skeleton"
                        style={{ height: 14, marginBottom: 6 }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 12, width: "60%" }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : courses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">
                  <i className="fas fa-book-open" />
                </div>
                <div className="empty-state-title">No courses found</div>
                <p className="empty-state-text">Try a different search term.</p>
              </div>
            ) : (
              <div className="courses-grid">
                {courses.map((c) => (
                  <CourseCard key={c.id} course={c} onAction={handleAction} />
                ))}
              </div>
            )}

            {user?.role === "learner" && <RecommendationsSection />}
          </div>

          {user?.role === "learner" && <ProfilePanel user={user} />}
        </div>
      </div>

      {buyTarget && (
        <Modal
          title="Confirm Purchase"
          onClose={() => setBuyTarget(null)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setBuyTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleBuy}
                disabled={buying}>
                {buying ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Processing...
                  </>
                ) : (
                  "Confirm Purchase"
                )}
              </button>
            </>
          }>
          <p style={{ marginBottom: 8 }}>
            <strong>{buyTarget.title}</strong>
          </p>
          <p
            style={{
              fontSize: "1.286rem",
              fontWeight: 700,
              color: "var(--o-primary)",
            }}>
            ${buyTarget.price}
          </p>
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginTop: 8,
              fontSize: "0.929rem",
            }}>
            This is a simulated purchase. No real payment will be processed.
          </p>
        </Modal>
      )}
    </div>
  );
}
