import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import SearchBar from "../../components/common/SearchBar";
import { useDebounce } from "../../hooks/useDebounce";
import { useToast } from "../../hooks/useToast";
import {
  getCourses,
  createCourse,
  deleteCourse,
  publishCourse,
  getShareLink,
} from "../../api/courseApi";
import { formatDuration, formatDate } from "../../utils/formatters";

function CourseStatusBadge({ published }) {
  return published ? (
    <span className="badge badge-success">
      <i className="fas fa-globe" style={{ marginRight: 4 }} />
      Published
    </span>
  ) : (
    <span className="badge badge-muted">Draft</span>
  );
}

function SkeletonCard() {
  return (
    <div className="o-kanban-card">
      <div
        className="skeleton"
        style={{ height: 120, marginBottom: 8, borderRadius: 4 }}
      />
      <div
        className="skeleton"
        style={{ height: 14, width: "70%", marginBottom: 6 }}
      />
      <div className="skeleton" style={{ height: 12, width: "40%" }} />
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [view, setView] = useState(
    () => localStorage.getItem("courseView") || "kanban",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [titleError, setTitleError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourses({ q: debouncedSearch });
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

  const handleCreate = async () => {
    if (!newTitle.trim() || newTitle.trim().length < 3) {
      setTitleError("Title must be at least 3 characters");
      return;
    }
    setCreating(true);
    try {
      const res = await createCourse({ title: newTitle.trim() });
      toast.success("Course created");
      setShowCreate(false);
      setNewTitle("");
      navigate(`/admin/courses/${res.data.id}/edit`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCourse(deleteTarget.id);
      toast.success("Course deleted");
      setCourses((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    } catch {
      toast.error("Failed to delete course");
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleShare = async (id) => {
    try {
      const res = await getShareLink(id);
      await navigator.clipboard.writeText(res.data.url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
    setOpenMenu(null);
  };

  const setViewMode = (v) => {
    setView(v);
    localStorage.setItem("courseView", v);
  };

  const draft = courses.filter((c) => !c.is_published);
  const published = courses.filter((c) => c.is_published);

  const CourseActions = ({ course }) => (
    <div className="dropdown" style={{ position: "relative" }}>
      <button
        className="btn-icon"
        onClick={(e) => {
          e.stopPropagation();
          setOpenMenu(openMenu === course.id ? null : course.id);
        }}
        aria-label="Actions">
        <i className="fas fa-ellipsis-v" />
      </button>
      {openMenu === course.id && (
        <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
          <button
            className="dropdown-item"
            onClick={() => {
              navigate(`/admin/courses/${course.id}/edit`);
              setOpenMenu(null);
            }}>
            <i className="fas fa-pencil" /> Edit
          </button>
          <button
            className="dropdown-item"
            onClick={() => handleShare(course.id)}>
            <i className="fas fa-share-alt" /> Share
          </button>
          <hr className="dropdown-divider" />
          <button
            className="dropdown-item danger"
            onClick={() => {
              setDeleteTarget(course);
              setOpenMenu(null);
            }}>
            <i className="fas fa-trash" /> Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div onClick={() => setOpenMenu(null)}>
      <Navbar variant="admin" />

      <div className="o-control-panel">
        <span className="o-control-panel-title">Courses</span>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search courses..."
          style={{ width: 240 }}
        />
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          <button
            className={`btn ${view === "kanban" ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setViewMode("kanban")}
            title="Kanban view">
            <i className="fas fa-th-large" />
          </button>
          <button
            className={`btn ${view === "list" ? "btn-primary" : "btn-secondary"} btn-sm`}
            onClick={() => setViewMode("list")}
            title="List view">
            <i className="fas fa-list" />
          </button>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowCreate(true)}>
          <i className="fas fa-plus" /> New Course
        </button>
      </div>

      <div className="o-main-view">
        {loading ? (
          view === "kanban" ? (
            <div className="o-kanban-board">
              {["Draft", "Published"].map((col) => (
                <div key={col} className="o-kanban-col">
                  <div className="o-kanban-col-header">{col}</div>
                  {[1, 2].map((i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: "#fff",
                borderRadius: "var(--o-radius)",
                overflow: "hidden",
              }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 44, margin: "2px 0" }}
                />
              ))}
            </div>
          )
        ) : courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <i className="fas fa-book-open" />
            </div>
            <div className="empty-state-title">No courses yet</div>
            <p className="empty-state-text">
              Create your first course to get started.
            </p>
            <button
              className="btn btn-primary mt-3"
              onClick={() => setShowCreate(true)}>
              <i className="fas fa-plus" /> New Course
            </button>
          </div>
        ) : view === "kanban" ? (
          <div className="o-kanban-board">
            {[
              { label: "Draft", items: draft },
              { label: "Published", items: published },
            ].map(({ label, items }) => (
              <div key={label} className="o-kanban-col">
                <div className="o-kanban-col-header">
                  {label}{" "}
                  <span
                    style={{
                      background: "var(--o-gray-200)",
                      borderRadius: 20,
                      padding: "1px 8px",
                      fontSize: "0.786rem",
                    }}>
                    {items.length}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: 24,
                      color: "var(--o-text-muted)",
                      fontSize: "0.857rem",
                    }}>
                    No {label.toLowerCase()} courses
                  </div>
                ) : (
                  items.map((c) => (
                    <div
                      key={c.id}
                      className="o-kanban-card"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/admin/courses/${c.id}/edit`)}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: 8,
                        }}>
                        <CourseStatusBadge published={c.is_published} />
                        <CourseActions course={c} />
                      </div>
                      {c.cover_image_url ? (
                        <img
                          src={
                            c.cover_image_url.startsWith("http")
                              ? c.cover_image_url
                              : `http://localhost:5000${c.cover_image_url}`
                          }
                          alt={c.title}
                          style={{
                            width: "100%",
                            height: 100,
                            objectFit: "cover",
                            borderRadius: 4,
                            marginBottom: 8,
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: "100%",
                            height: 100,
                            background:
                              "linear-gradient(135deg, var(--o-primary-subtle), var(--o-info-light))",
                            borderRadius: 4,
                            marginBottom: 8,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <i
                            className="fas fa-book-open"
                            style={{
                              fontSize: "2rem",
                              color: "var(--o-primary)",
                            }}
                          />
                        </div>
                      )}
                      <div style={{ fontWeight: 500, marginBottom: 4 }}>
                        {c.title}
                      </div>
                      {c.tags?.length > 0 && (
                        <div
                          className="course-card-tags"
                          style={{ marginBottom: 6 }}>
                          {c.tags.slice(0, 3).map((t) => (
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
                        }}>
                        <span>
                          <i className="fas fa-play-circle" />{" "}
                          {c.total_lessons || 0} lessons
                        </span>
                        <span>
                          <i className="fas fa-clock" />{" "}
                          {formatDuration(c.total_duration_seconds)}
                        </span>
                        <span>
                          <i className="fas fa-eye" /> {c.views_count || 0}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              background: "#fff",
              borderRadius: "var(--o-radius)",
              overflow: "hidden",
              border: "1px solid var(--o-border)",
            }}>
            <table className="o-list-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Tags</th>
                  <th>Lessons</th>
                  <th>Duration</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr
                    key={c.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => navigate(`/admin/courses/${c.id}/edit`)}>
                    <td>
                      {c.cover_image_url ? (
                        <img
                          src={
                            c.cover_image_url.startsWith("http")
                              ? c.cover_image_url
                              : `http://localhost:5000${c.cover_image_url}`
                          }
                          alt=""
                          style={{
                            width: 48,
                            height: 32,
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div
                          style={{
                            width: 48,
                            height: 32,
                            background: "var(--o-primary-subtle)",
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}>
                          <i
                            className="fas fa-book-open"
                            style={{
                              color: "var(--o-primary)",
                              fontSize: "0.857rem",
                            }}
                          />
                        </div>
                      )}
                    </td>
                    <td style={{ fontWeight: 500 }}>{c.title}</td>
                    <td>
                      {c.tags?.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="tag-chip"
                          style={{ marginRight: 4 }}>
                          {t}
                        </span>
                      ))}
                    </td>
                    <td>{c.total_lessons || 0}</td>
                    <td>{formatDuration(c.total_duration_seconds)}</td>
                    <td>{c.views_count || 0}</td>
                    <td>
                      <CourseStatusBadge published={c.is_published} />
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <CourseActions course={c} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <Modal
          title="Create New Course"
          onClose={() => {
            setShowCreate(false);
            setNewTitle("");
            setTitleError("");
          }}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowCreate(false);
                  setNewTitle("");
                  setTitleError("");
                }}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreate}
                disabled={creating}>
                {creating ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Creating...
                  </>
                ) : (
                  "Create"
                )}
              </button>
            </>
          }>
          <div className="form-group">
            <label className="form-label">
              Course Title <span className="required">*</span>
            </label>
            <input
              type="text"
              className={`o-input ${titleError ? "error" : ""}`}
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                setTitleError("");
              }}
              placeholder="e.g. Introduction to Python"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {titleError && <span className="form-error">{titleError}</span>}
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Course"
          message={`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
