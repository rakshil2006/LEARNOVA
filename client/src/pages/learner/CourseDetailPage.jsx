import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import ProgressBar from "../../components/common/ProgressBar";
import StarRating from "../../components/common/StarRating";
import Modal from "../../components/common/Modal";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import {
  getPublicCourse,
  incrementView,
  addReview,
  updateReview,
  purchaseCourse,
} from "../../api/courseApi";
import {
  formatDate,
  formatDuration,
  resolveMediaUrl,
} from "../../utils/formatters";

const LESSON_ICONS = {
  video: "fa-play-circle",
  document: "fa-file-alt",
  image: "fa-image",
  quiz: "fa-question-circle",
};
const STATUS_ICONS = {
  not_started: "fa-circle",
  in_progress: "fa-adjust",
  completed: "fa-check-circle",
};
const STATUS_COLORS = {
  not_started: "var(--o-gray-400)",
  in_progress: "var(--o-info)",
  completed: "var(--o-success)",
};

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [lessonSearch, setLessonSearch] = useState("");
  const [reviewModal, setReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review_text: "" });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [buyModal, setBuyModal] = useState(false);
  const [buying, setBuying] = useState(false);
  const [myReview, setMyReview] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPublicCourse(id);
      setCourse(res.data);
      if (user) {
        const existing = res.data.reviews?.find((r) => r.user_id === user.id);
        if (existing) {
          setMyReview(existing);
          setReviewForm({
            rating: existing.rating,
            review_text: existing.review_text || "",
          });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    load();
    // Increment view (once per session)
    const key = `viewed_course_${id}`;
    if (!sessionStorage.getItem(key)) {
      incrementView(id).catch(() => {});
      sessionStorage.setItem(key, "1");
    }
  }, [load, id]);

  const handleLessonClick = (lesson) => {
    if (!user) {
      navigate(`/login?redirect=/courses/${id}/lessons/${lesson.id}`);
      return;
    }
    navigate(`/courses/${id}/lessons/${lesson.id}`);
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.rating) {
      toast.error("Please select a rating");
      return;
    }
    setSubmittingReview(true);
    try {
      if (myReview) {
        await updateReview(id, myReview.id, reviewForm);
        toast.success("Review updated");
      } else {
        await addReview(id, reviewForm);
        toast.success("Review submitted");
      }
      setReviewModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleBuy = async () => {
    setBuying(true);
    try {
      await purchaseCourse(id);
      toast.success("Purchase successful!");
      setBuyModal(false);
      load();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Purchase failed. Please try again.",
      );
    } finally {
      setBuying(false);
    }
  };

  if (loading)
    return (
      <div>
        <Navbar variant="public" />
        <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 24px" }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 60, marginBottom: 12, borderRadius: 8 }}
            />
          ))}
        </div>
      </div>
    );

  if (!course)
    return (
      <div>
        <Navbar variant="public" />
        <div className="empty-state" style={{ height: "60vh" }}>
          <div className="empty-state-icon">
            <i className="fas fa-exclamation-circle" />
          </div>
          <div className="empty-state-title">Course not found</div>
          <Link to="/courses" className="btn btn-primary mt-3">
            Browse Courses
          </Link>
        </div>
      </div>
    );

  const lessons = course.lessons || [];
  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(lessonSearch.toLowerCase()),
  );
  const completed = lessons.filter(
    (l) => l.progress_status === "completed",
  ).length;
  const pct =
    lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0;
  const reviews = course.reviews || [];
  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  const canStart =
    user &&
    (course.access_rule === "open" ||
      (course.access_rule === "invitation" && course.enrollment) ||
      (course.access_rule === "payment" && course.is_purchased));

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant="public" />

      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--o-primary-subtle), var(--o-info-light))",
          padding: "32px 24px",
        }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div className="o-breadcrumb" style={{ marginBottom: 12 }}>
            <Link to="/courses">Courses</Link>
            <span className="sep">›</span>
            <span className="current">{course.title}</span>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            {course.cover_image_url && (
              <img
                src={resolveMediaUrl(course.cover_image_url)}
                alt={course.title}
                style={{
                  width: 160,
                  height: 110,
                  objectFit: "cover",
                  borderRadius: "var(--o-radius)",
                  flexShrink: 0,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              />
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ marginBottom: 8 }}>{course.title}</h1>
              {course.short_description && (
                <p
                  style={{
                    color: "var(--o-text-secondary)",
                    marginBottom: 16,
                  }}>
                  {course.short_description}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  flexWrap: "wrap",
                  fontSize: "0.857rem",
                  color: "var(--o-text-secondary)",
                  marginBottom: 16,
                }}>
                <span>
                  <i className="fas fa-play-circle" /> {lessons.length} lessons
                </span>
                <span>
                  <i className="fas fa-clock" />{" "}
                  {formatDuration(course.total_duration_seconds)}
                </span>
                <span>
                  <i className="fas fa-eye" /> {course.views_count || 0} views
                </span>
                {avgRating && (
                  <span>
                    <i
                      className="fas fa-star"
                      style={{ color: "var(--o-warning)" }}
                    />{" "}
                    {avgRating} ({reviews.length})
                  </span>
                )}
              </div>
              {course.enrollment && (
                <div style={{ marginBottom: 12 }}>
                  <ProgressBar value={pct} />
                  <span
                    style={{
                      fontSize: "0.857rem",
                      color: "var(--o-text-secondary)",
                    }}>
                    {pct}% complete — {completed}/{lessons.length} lessons
                  </span>
                </div>
              )}
              {course.access_rule === "payment" &&
                !course.is_purchased &&
                user && (
                  <button
                    className="btn btn-success"
                    onClick={() => setBuyModal(true)}>
                    <i className="fas fa-shopping-cart" /> Buy Course — $
                    {course.price}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "24px",
          width: "100%",
          flex: 1,
        }}>
        <div className="o-tabs" style={{ marginBottom: 20 }}>
          <button
            className={`o-tab ${tab === "overview" ? "active" : ""}`}
            onClick={() => setTab("overview")}>
            Overview
          </button>
          <button
            className={`o-tab ${tab === "reviews" ? "active" : ""}`}
            onClick={() => setTab("reviews")}>
            Reviews{" "}
            {reviews.length > 0 && (
              <span className="badge badge-muted" style={{ marginLeft: 4 }}>
                {reviews.length}
              </span>
            )}
          </button>
        </div>

        {tab === "overview" && (
          <div>
            {course.description && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid var(--o-border)",
                  borderRadius: "var(--o-radius)",
                  padding: 20,
                  marginBottom: 20,
                }}>
                <h3 style={{ marginBottom: 8 }}>About this course</h3>
                <p
                  style={{ color: "var(--o-text-secondary)", lineHeight: 1.6 }}>
                  {course.description}
                </p>
              </div>
            )}
            <div
              style={{
                background: "#fff",
                border: "1px solid var(--o-border)",
                borderRadius: "var(--o-radius)",
                overflow: "hidden",
              }}>
              <div
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--o-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <h3>Lessons</h3>
                  <span
                    style={{
                      fontSize: "0.857rem",
                      color: "var(--o-success)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    <i className="fas fa-check-circle" /> {completed} completed
                  </span>
                  <span
                    style={{
                      fontSize: "0.857rem",
                      color: "var(--o-text-secondary)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}>
                    <i className="fas fa-circle" /> {lessons.length - completed}{" "}
                    incomplete
                  </span>
                </div>
                <input
                  className="o-input"
                  style={{ width: 200 }}
                  placeholder="Search lessons..."
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                />
              </div>
              {filteredLessons.length === 0 ? (
                <div className="empty-state" style={{ padding: 32 }}>
                  <div className="empty-state-icon">
                    <i className="fas fa-play-circle" />
                  </div>
                  <p>No lessons yet.</p>
                </div>
              ) : (
                filteredLessons.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => handleLessonClick(l)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 16px",
                      borderBottom: "1px solid var(--o-border-subtle)",
                      cursor: "pointer",
                      transition: "background var(--o-transition)",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "var(--o-gray-100)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "")
                    }>
                    <i
                      className={`fas ${STATUS_ICONS[l.progress_status || "not_started"]}`}
                      style={{
                        color:
                          STATUS_COLORS[l.progress_status || "not_started"],
                        fontSize: "1rem",
                      }}
                    />
                    <i
                      className={`fas ${LESSON_ICONS[l.type]}`}
                      style={{ color: "var(--o-primary)", width: 16 }}
                    />
                    <span style={{ flex: 1, fontWeight: 500 }}>{l.title}</span>
                    {l.type === "video" && l.duration_seconds && (
                      <span
                        style={{
                          fontSize: "0.857rem",
                          color: "var(--o-text-secondary)",
                        }}>
                        {formatDuration(l.duration_seconds)}
                      </span>
                    )}
                    {!canStart && (
                      <i
                        className="fas fa-lock"
                        style={{
                          color: "var(--o-text-muted)",
                          fontSize: "0.857rem",
                        }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "reviews" && (
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                {avgRating ? (
                  <>
                    <span
                      style={{
                        fontSize: "2rem",
                        fontWeight: 700,
                        color: "var(--o-primary)",
                      }}>
                      {avgRating}
                    </span>
                    <div>
                      <StarRating value={Math.round(avgRating)} readonly />
                      <div
                        style={{
                          fontSize: "0.857rem",
                          color: "var(--o-text-secondary)",
                        }}>
                        {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </>
                ) : (
                  <span style={{ color: "var(--o-text-secondary)" }}>
                    No reviews yet
                  </span>
                )}
              </div>
              {user && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setReviewModal(true)}>
                  <i className="fas fa-star" />{" "}
                  {myReview ? "Edit Review" : "Add Review"}
                </button>
              )}
            </div>
            {reviews.map((r) => (
              <div
                key={r.id}
                style={{
                  background: "#fff",
                  border: "1px solid var(--o-border)",
                  borderRadius: "var(--o-radius)",
                  padding: 16,
                  marginBottom: 12,
                }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "var(--o-primary)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.857rem",
                      fontWeight: 700,
                    }}>
                    {r.user_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 500 }}>{r.user_name}</div>
                    <div
                      style={{
                        fontSize: "0.786rem",
                        color: "var(--o-text-secondary)",
                      }}>
                      {formatDate(r.created_at)}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <StarRating value={r.rating} readonly size="0.857rem" />
                  </div>
                </div>
                {r.review_text && (
                  <p
                    style={{
                      color: "var(--o-text-secondary)",
                      fontSize: "0.929rem",
                    }}>
                    {r.review_text}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewModal && (
        <Modal
          title={myReview ? "Edit Review" : "Add Review"}
          onClose={() => setReviewModal(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setReviewModal(false)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleReviewSubmit}
                disabled={submittingReview}>
                {submittingReview ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Submitting...
                  </>
                ) : (
                  "Submit"
                )}
              </button>
            </>
          }>
          <div className="form-group">
            <label className="form-label">
              Rating <span className="required">*</span>
            </label>
            <StarRating
              value={reviewForm.rating}
              onChange={(v) => setReviewForm({ ...reviewForm, rating: v })}
              size="1.5rem"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Review</label>
            <textarea
              className="o-textarea"
              rows={4}
              value={reviewForm.review_text}
              onChange={(e) =>
                setReviewForm({ ...reviewForm, review_text: e.target.value })
              }
              placeholder="Share your experience..."
            />
          </div>
        </Modal>
      )}

      {buyModal && (
        <Modal
          title="Confirm Purchase"
          onClose={() => setBuyModal(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setBuyModal(false)}>
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
          <p>
            <strong>{course.title}</strong>
          </p>
          <p
            style={{
              fontSize: "1.286rem",
              fontWeight: 700,
              color: "var(--o-primary)",
              marginTop: 8,
            }}>
            ${course.price}
          </p>
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginTop: 8,
              fontSize: "0.929rem",
            }}>
            Simulated purchase — no real payment.
          </p>
        </Modal>
      )}
    </div>
  );
}
