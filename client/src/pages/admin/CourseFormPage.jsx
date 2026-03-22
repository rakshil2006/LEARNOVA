import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import LessonEditorModal from "../../components/admin/LessonEditorModal";
import QuizBuilderModal from "../../components/admin/QuizBuilderModal";
import { useToast } from "../../hooks/useToast";
import {
  getCourse,
  updateCourse,
  publishCourse,
  uploadCover,
  addAttendees,
  getAttendees,
} from "../../api/courseApi";
import { getLessons, deleteLesson } from "../../api/lessonApi";
import { getQuizzes, createQuiz, deleteQuiz } from "../../api/quizApi";
import { getUsers } from "../../api/userApi";
import { formatDuration, resolveMediaUrl } from "../../utils/formatters";

const LESSON_ICONS = {
  video: "fa-play-circle",
  document: "fa-file-alt",
  image: "fa-image",
  quiz: "fa-question-circle",
};

// ── TagInput ──────────────────────────────────────────────────────────────────
function TagInput({ tags = [], onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !tags.includes(v)) {
      onChange([...tags, v]);
    }
    setInput("");
  };
  return (
    <div
      style={{
        border: "1px solid var(--o-gray-400)",
        borderRadius: "var(--o-radius-sm)",
        padding: "4px 8px",
        display: "flex",
        flexWrap: "wrap",
        gap: 4,
        background: "#fff",
      }}>
      {tags.map((t) => (
        <span
          key={t}
          className="tag-chip"
          style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {t}
          <button
            type="button"
            onClick={() => onChange(tags.filter((x) => x !== t))}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--o-primary)",
              padding: 0,
              lineHeight: 1,
            }}>
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
        placeholder="Add tag, press Enter"
        style={{
          border: "none",
          outline: "none",
          fontSize: "1rem",
          minWidth: 120,
          flex: 1,
        }}
      />
    </div>
  );
}

export default function CourseFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [users, setUsers] = useState([]);
  const [tab, setTab] = useState("content");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [form, setForm] = useState({});
  const [slugError, setSlugError] = useState("");
  const [lessonModal, setLessonModal] = useState(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState(null);
  const [quizModal, setQuizModal] = useState(null);
  const [deleteQuizTarget, setDeleteQuizTarget] = useState(null);
  const [attendeeModal, setAttendeeModal] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [attendeeEmails, setAttendeeEmails] = useState("");
  const [contactForm, setContactForm] = useState({ subject: "", message: "" });
  const [coverFile, setCoverFile] = useState(null);
  const [lessonSearch, setLessonSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, lRes, qRes, uRes] = await Promise.all([
        getCourse(id),
        getLessons(id),
        getQuizzes(id),
        getUsers(),
      ]);
      setCourse(cRes.data);
      setForm({
        title: cRes.data.title || "",
        tags: cRes.data.tags || [],
        website_slug: cRes.data.website_slug || "",
        short_description: cRes.data.short_description || "",
        description: cRes.data.description || "",
        visibility: cRes.data.visibility || "everyone",
        access_rule: cRes.data.access_rule || "open",
        price: cRes.data.price || "",
        course_admin_id: cRes.data.course_admin_id || "",
      });
      setLessons(lRes.data);
      setQuizzes(qRes.data);
      setUsers(uRes.data);
    } catch {
      toast.error("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags,
        price: form.price !== "" && form.price != null ? form.price : null,
        course_admin_id: form.course_admin_id || null,
      };
      if (coverFile) await uploadCover(id, coverFile);
      await updateCourse(id, payload);
      toast.success("Course saved");
      setCoverFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (
      !course.is_published &&
      (!form.website_slug || !form.website_slug.trim())
    ) {
      setSlugError("Website slug is required to publish this course");
      setTab("options");
      return;
    }
    setPublishing(true);
    try {
      await handleSave();
      const res = await publishCourse(id);
      setCourse(res.data);
      toast.success(
        res.data.is_published ? "Course published!" : "Course unpublished",
      );
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to toggle publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleDeleteLesson = async () => {
    try {
      await deleteLesson(id, deleteLessonTarget.id);
      setLessons((prev) => prev.filter((l) => l.id !== deleteLessonTarget.id));
      toast.success("Lesson deleted");
    } catch {
      toast.error("Failed to delete lesson");
    }
    setDeleteLessonTarget(null);
  };

  const handleDeleteQuiz = async () => {
    try {
      await deleteQuiz(id, deleteQuizTarget.id);
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteQuizTarget.id));
      toast.success("Quiz deleted");
    } catch {
      toast.error("Failed to delete quiz");
    }
    setDeleteQuizTarget(null);
  };

  const handleAddAttendees = async () => {
    const emails = attendeeEmails
      .split(/[\n,;]/)
      .map((e) => e.trim())
      .filter(Boolean);
    try {
      const res = await addAttendees(id, emails);
      toast.success(
        `${res.data.enrolled.length} enrolled, ${res.data.skipped.length} skipped`,
      );
      setAttendeeModal(false);
      setAttendeeEmails("");
    } catch {
      toast.error("Failed to add attendees");
    }
  };

  const handleContact = async () => {
    try {
      const res = await getAttendees(id);
      const emails = res.data.map((a) => a.email);
      if (!emails.length) {
        toast.error("No attendees enrolled in this course");
        return;
      }
      const subject = encodeURIComponent(contactForm.subject || "");
      const body = encodeURIComponent(contactForm.message || "");
      window.location.href = `mailto:${emails.join(",")}?subject=${subject}&body=${body}`;
      setContactModal(false);
      setContactForm({ subject: "", message: "" });
    } catch {
      toast.error("Failed to fetch attendees");
    }
  };

  const filteredLessons = lessons.filter((l) =>
    l.title.toLowerCase().includes(lessonSearch.toLowerCase()),
  );

  if (loading)
    return (
      <div>
        <Navbar variant="admin" />
        <div className="o-main-view">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 40, marginBottom: 8, borderRadius: 4 }}
            />
          ))}
        </div>
      </div>
    );

  return (
    <div>
      <Navbar variant="admin" />

      {/* Action bar */}
      <div
        className="o-control-panel"
        style={{ justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate("/admin/dashboard")}>
            <i className="fas fa-arrow-left" /> Back
          </button>
          <div className="o-breadcrumb">
            <Link to="/admin/dashboard">Courses</Link>
            <span className="sep">›</span>
            <span className="current">{course?.title}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => window.open(`/courses/${id}`, "_blank")}>
            <i className="fas fa-eye" /> Preview
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setAttendeeModal(true)}>
            <i className="fas fa-users" /> Add Attendees
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setContactModal(true)}>
            <i className="fas fa-envelope" /> Contact
          </button>
          <button
            className={`btn btn-sm ${course?.is_published ? "btn-warning" : "btn-success"}`}
            onClick={handlePublish}
            disabled={publishing}>
            {publishing ? (
              <i className="fas fa-spinner fa-spin" />
            ) : (
              <i className="fas fa-globe" />
            )}
            {course?.is_published ? " Unpublish" : " Publish"}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save" /> Save
              </>
            )}
          </button>
        </div>
      </div>

      <div className="o-main-view">
        <div
          style={{
            background: "#fff",
            border: "1px solid var(--o-border)",
            borderRadius: "var(--o-radius-lg)",
            padding: 24,
          }}>
          {/* Top fields */}
          <div className="form-grid-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">
                Course Title <span className="required">*</span>
              </label>
              <input
                className="o-input"
                value={form.title || ""}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Cover Image</label>
              <input
                type="file"
                className="o-input"
                accept="image/*"
                onChange={(e) => setCoverFile(e.target.files[0])}
              />
              {course?.cover_image_url && (
                <img
                  src={resolveMediaUrl(course.cover_image_url)}
                  alt="cover"
                  style={{ height: 40, marginTop: 4, borderRadius: 4 }}
                />
              )}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Tags</label>
            <TagInput
              tags={form.tags || []}
              onChange={(tags) => setForm({ ...form, tags })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Short Description</label>
            <input
              className="o-input"
              value={form.short_description || ""}
              onChange={(e) =>
                setForm({ ...form, short_description: e.target.value })
              }
              placeholder="Brief summary shown on course cards"
            />
          </div>

          <hr className="divider" />

          {/* Tabs */}
          <div className="o-tabs" style={{ marginBottom: 16 }}>
            {["content", "description", "options", "quiz"].map((t) => (
              <button
                key={t}
                className={`o-tab ${tab === t ? "active" : ""}`}
                onClick={() => setTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Content Tab */}
          {tab === "content" && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}>
                <input
                  className="o-input"
                  style={{ maxWidth: 240 }}
                  placeholder="Search lessons..."
                  value={lessonSearch}
                  onChange={(e) => setLessonSearch(e.target.value)}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setLessonModal({})}>
                  <i className="fas fa-plus" /> Add Content
                </button>
              </div>
              {filteredLessons.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="fas fa-play-circle" />
                  </div>
                  <div className="empty-state-title">No lessons yet</div>
                  <p className="empty-state-text">
                    Add your first lesson to get started.
                  </p>
                </div>
              ) : (
                <table className="o-list-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLessons.map((l, i) => (
                      <tr key={l.id}>
                        <td style={{ color: "var(--o-text-muted)" }}>
                          {i + 1}
                        </td>
                        <td>
                          <i
                            className={`fas ${LESSON_ICONS[l.type]}`}
                            style={{ color: "var(--o-primary)" }}
                          />
                        </td>
                        <td style={{ fontWeight: 500 }}>{l.title}</td>
                        <td>
                          {l.type === "video"
                            ? formatDuration(l.duration_seconds)
                            : "—"}
                        </td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => setLessonModal(l)}
                            title="Edit">
                            <i className="fas fa-pencil" />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setDeleteLessonTarget(l)}
                            title="Delete">
                            <i
                              className="fas fa-trash"
                              style={{ color: "var(--o-danger)" }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Description Tab */}
          {tab === "description" && (
            <div className="form-group">
              <label className="form-label">Course Description</label>
              <textarea
                className="o-textarea"
                rows={10}
                value={form.description || ""}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Full course description shown to learners..."
              />
            </div>
          )}

          {/* Options Tab */}
          {tab === "options" && (
            <div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">
                    Website Slug{" "}
                    {course?.is_published && (
                      <span className="required">*</span>
                    )}
                  </label>
                  <input
                    className={`o-input ${slugError ? "error" : ""}`}
                    value={form.website_slug || ""}
                    onChange={(e) => {
                      setForm({ ...form, website_slug: e.target.value });
                      setSlugError("");
                    }}
                    placeholder="e.g. intro-to-python"
                  />
                  {slugError && <span className="form-error">{slugError}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Course Admin</label>
                  <select
                    className="o-select"
                    value={form.course_admin_id || ""}
                    onChange={(e) =>
                      setForm({ ...form, course_admin_id: e.target.value })
                    }>
                    <option value="">— Select —</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Visibility</label>
                <div style={{ display: "flex", gap: 16 }}>
                  {[
                    { v: "everyone", label: "Everyone" },
                    { v: "signed_in", label: "Signed In Only" },
                  ].map(({ v, label }) => (
                    <label
                      key={v}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}>
                      <input
                        type="radio"
                        name="visibility"
                        checked={form.visibility === v}
                        onChange={() => setForm({ ...form, visibility: v })}
                      />{" "}
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Access Rule</label>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {[
                    { v: "open", label: "Open" },
                    { v: "invitation", label: "On Invitation" },
                    { v: "payment", label: "On Payment" },
                  ].map(({ v, label }) => (
                    <label
                      key={v}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                      }}>
                      <input
                        type="radio"
                        name="access_rule"
                        checked={form.access_rule === v}
                        onChange={() => setForm({ ...form, access_rule: v })}
                      />{" "}
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              {form.access_rule === "payment" && (
                <div className="form-group" style={{ maxWidth: 200 }}>
                  <label className="form-label">Price ($)</label>
                  <input
                    type="number"
                    className="o-input"
                    value={form.price || ""}
                    onChange={(e) =>
                      setForm({ ...form, price: e.target.value })
                    }
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          )}

          {/* Quiz Tab */}
          {tab === "quiz" && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: 12,
                }}>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={async () => {
                    const title = prompt("Quiz title:");
                    if (!title) return;
                    try {
                      const res = await createQuiz(id, { title });
                      setQuizzes((prev) => [...prev, res.data]);
                      toast.success("Quiz created");
                    } catch {
                      toast.error("Failed to create quiz");
                    }
                  }}>
                  <i className="fas fa-plus" /> Add Quiz
                </button>
              </div>
              {quizzes.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <i className="fas fa-question-circle" />
                  </div>
                  <div className="empty-state-title">No quizzes yet</div>
                </div>
              ) : (
                <table className="o-list-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quizzes.map((q) => (
                      <tr key={q.id}>
                        <td style={{ fontWeight: 500 }}>{q.title}</td>
                        <td>{q.question_count || 0}</td>
                        <td>
                          <button
                            className="btn-icon"
                            onClick={() => setQuizModal(q)}
                            title="Edit">
                            <i className="fas fa-pencil" />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => setDeleteQuizTarget(q)}
                            title="Delete">
                            <i
                              className="fas fa-trash"
                              style={{ color: "var(--o-danger)" }}
                            />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>

      {lessonModal !== null && (
        <LessonEditorModal
          courseId={id}
          lesson={lessonModal?.id ? lessonModal : null}
          onClose={() => setLessonModal(null)}
          onSaved={() => {
            setLessonModal(null);
            getLessons(id).then((r) => setLessons(r.data));
          }}
          users={users}
        />
      )}
      {deleteLessonTarget && (
        <ConfirmDialog
          title="Delete Lesson"
          message={`Delete "${deleteLessonTarget.title}"?`}
          onConfirm={handleDeleteLesson}
          onCancel={() => setDeleteLessonTarget(null)}
        />
      )}
      {quizModal && (
        <QuizBuilderModal
          courseId={id}
          quiz={quizModal}
          onClose={() => setQuizModal(null)}
          onSaved={() => {
            setQuizModal(null);
            getQuizzes(id).then((r) => setQuizzes(r.data));
          }}
        />
      )}
      {deleteQuizTarget && (
        <ConfirmDialog
          title="Delete Quiz"
          message={`Delete "${deleteQuizTarget.title}"?`}
          onConfirm={handleDeleteQuiz}
          onCancel={() => setDeleteQuizTarget(null)}
        />
      )}

      {attendeeModal && (
        <Modal
          title="Add Attendees"
          onClose={() => setAttendeeModal(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setAttendeeModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddAttendees}>
                Add
              </button>
            </>
          }>
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginBottom: 12,
              fontSize: "0.929rem",
            }}>
            Enter email addresses (one per line or comma-separated). Users must
            already be registered.
          </p>
          <textarea
            className="o-textarea"
            rows={6}
            value={attendeeEmails}
            onChange={(e) => setAttendeeEmails(e.target.value)}
            placeholder="user1@example.com&#10;user2@example.com"
          />
        </Modal>
      )}

      {contactModal && (
        <Modal
          title="Contact Attendees"
          onClose={() => setContactModal(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setContactModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleContact}>
                Send
              </button>
            </>
          }>
          <div className="form-group">
            <label className="form-label">Subject</label>
            <input
              className="o-input"
              value={contactForm.subject}
              onChange={(e) =>
                setContactForm({ ...contactForm, subject: e.target.value })
              }
              placeholder="Email subject"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Message</label>
            <textarea
              className="o-textarea"
              rows={5}
              value={contactForm.message}
              onChange={(e) =>
                setContactForm({ ...contactForm, message: e.target.value })
              }
              placeholder="Your message to learners..."
            />
          </div>
        </Modal>
      )}
    </div>
  );
}
