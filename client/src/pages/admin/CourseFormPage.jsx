import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Modal from "../../components/common/Modal";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  getCourse,
  updateCourse,
  publishCourse,
  uploadCover,
  addAttendees,
  getAttendees,
  contactAttendees,
} from "../../api/courseApi";
import {
  getLessons,
  createLesson,
  updateLesson,
  deleteLesson,
  uploadLessonFile,
  addAttachment,
  deleteAttachment,
  reorderLessons,
} from "../../api/lessonApi";
import {
  getQuizzes,
  createQuiz,
  deleteQuiz,
  getQuiz,
  updateQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  setRewards as saveQuizRewards,
} from "../../api/quizApi";
import { getUsers } from "../../api/userApi";
import { formatDuration } from "../../utils/formatters";

const LESSON_ICONS = {
  video: "fa-play-circle",
  document: "fa-file-alt",
  image: "fa-image",
  quiz: "fa-question-circle",
};

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

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : null;
}

function LessonEditorModal({ courseId, lesson, onClose, onSaved, users }) {
  const toast = useToast();
  const [tab, setTab] = useState("content");
  const [form, setForm] = useState({
    title: lesson?.title || "",
    type: lesson?.type || "video",
    description: lesson?.description || "",
    video_url: lesson?.video_url || "",
    duration_seconds: lesson?.duration_seconds
      ? Math.round(lesson.duration_seconds / 60)
      : "",
    allow_download: lesson?.allow_download || false,
    responsible_id: lesson?.responsible_id || "",
  });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [attachments, setAttachments] = useState(lesson?.attachments || []);
  const [newAttach, setNewAttach] = useState({
    type: "link",
    label: "",
    url: "",
    file: null,
  });
  const [deleteAttachTarget, setDeleteAttachTarget] = useState(null);
  const [fetchingDuration, setFetchingDuration] = useState(false);
  const ytPlayerRef = useRef(null);
  const ytContainerRef = useRef(null);

  // Auto-fetch YouTube duration when video_url changes
  useEffect(() => {
    if (form.type !== "video") return;
    const ytId = getYouTubeId(form.video_url);
    if (!ytId) return;

    setFetchingDuration(true);

    const loadPlayer = () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: ytId,
        playerVars: { autoplay: 0 },
        events: {
          onReady: (e) => {
            const dur = e.target.getDuration();
            if (dur > 0) {
              setForm((prev) => ({
                ...prev,
                duration_seconds: Math.round(dur / 60),
              }));
            }
            setFetchingDuration(false);
          },
          onError: () => setFetchingDuration(false),
        },
      });
    };

    if (window.YT && window.YT.Player) {
      loadPlayer();
    } else {
      window.onYouTubeIframeAPIReady = loadPlayer;
      if (!document.getElementById("yt-iframe-api")) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [form.video_url, form.type]);

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        video_url: form.type === "video" ? form.video_url : null,
        duration_seconds:
          form.type === "video" && form.duration_seconds
            ? parseInt(form.duration_seconds) * 60
            : null,
        allow_download: form.allow_download,
        responsible_id: form.responsible_id || null,
      };
      let saved;
      if (lesson?.id) {
        const res = await updateLesson(courseId, lesson.id, payload);
        saved = res.data;
      } else {
        const res = await createLesson(courseId, payload);
        saved = res.data;
      }
      if (file && saved.id) {
        await uploadLessonFile(courseId, saved.id, file);
      }
      toast.success(lesson?.id ? "Lesson updated" : "Lesson created");
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save lesson");
    } finally {
      setSaving(false);
    }
  };

  const handleAddAttachment = async () => {
    if (!lesson?.id) {
      toast.info("Save the lesson first before adding attachments");
      return;
    }
    try {
      const res = await addAttachment(courseId, lesson.id, newAttach);
      setAttachments((prev) => [...prev, res.data]);
      setNewAttach({ type: "link", label: "", url: "", file: null });
      toast.success("Attachment added");
    } catch {
      toast.error("Failed to add attachment");
    }
  };

  const handleDeleteAttachment = async (a) => {
    try {
      await deleteAttachment(courseId, lesson.id, a.id);
      setAttachments((prev) => prev.filter((x) => x.id !== a.id));
      toast.success("Attachment removed");
    } catch {
      toast.error("Failed to remove attachment");
    }
    setDeleteAttachTarget(null);
  };

  return (
    <Modal
      title={lesson?.id ? "Edit Lesson" : "Add Lesson"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}>
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin" /> Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </>
      }>
      <div className="o-tabs" style={{ marginBottom: 16 }}>
        {["content", "description", "attachments"].map((t) => (
          <button
            key={t}
            className={`o-tab ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "content" && (
        <div>
          <div className="form-group">
            <label className="form-label">
              Title <span className="required">*</span>
            </label>
            <input
              className={`o-input ${errors.title ? "error" : ""}`}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Lesson title"
            />
            {errors.title && <span className="form-error">{errors.title}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Type</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["video", "document", "image"].map((t) => (
                <label
                  key={t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    cursor: "pointer",
                    padding: "4px 12px",
                    border: `1px solid ${form.type === t ? "var(--o-primary)" : "var(--o-gray-400)"}`,
                    borderRadius: "var(--o-radius-sm)",
                    background:
                      form.type === t ? "var(--o-primary-subtle)" : "#fff",
                  }}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => setForm({ ...form, type: t })}
                    style={{ display: "none" }}
                  />
                  <i
                    className={`fas ${LESSON_ICONS[t]}`}
                    style={{
                      color:
                        form.type === t
                          ? "var(--o-primary)"
                          : "var(--o-text-secondary)",
                    }}
                  />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
            </div>
          </div>
          {form.type === "video" && (
            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Video URL (YouTube/Drive)</label>
                <input
                  className="o-input"
                  value={form.video_url}
                  onChange={(e) =>
                    setForm({ ...form, video_url: e.target.value })
                  }
                  placeholder="https://youtube.com/..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Duration (minutes)
                  {fetchingDuration && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: "0.786rem",
                        color: "var(--o-text-secondary)",
                      }}>
                      <i className="fas fa-spinner fa-spin" /> detecting...
                    </span>
                  )}
                </label>
                <input
                  type="number"
                  className="o-input"
                  value={form.duration_seconds}
                  onChange={(e) =>
                    setForm({ ...form, duration_seconds: e.target.value })
                  }
                  placeholder="e.g. 15"
                  min="0"
                />
              </div>
            </div>
          )}
          {/* Hidden YT player container for duration detection */}
          <div ref={ytContainerRef} style={{ display: "none" }} />
          {(form.type === "document" || form.type === "image") && (
            <div className="form-group">
              <label className="form-label">Upload File</label>
              <input
                type="file"
                className="o-input"
                onChange={(e) => setFile(e.target.files[0])}
                accept={
                  form.type === "image"
                    ? "image/*"
                    : ".pdf,.doc,.docx,.ppt,.pptx"
                }
              />
              {lesson?.file_url && (
                <span
                  style={{
                    fontSize: "0.857rem",
                    color: "var(--o-text-secondary)",
                  }}>
                  Current: {lesson.file_url.split("/").pop()}
                </span>
              )}
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 8,
                  cursor: "pointer",
                }}>
                <input
                  type="checkbox"
                  checked={form.allow_download}
                  onChange={(e) =>
                    setForm({ ...form, allow_download: e.target.checked })
                  }
                />
                Allow download
              </label>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Responsible</label>
            <select
              className="o-select"
              value={form.responsible_id}
              onChange={(e) =>
                setForm({ ...form, responsible_id: e.target.value })
              }>
              <option value="">— None —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {tab === "description" && (
        <div className="form-group">
          <label className="form-label">Lesson Description</label>
          <textarea
            className="o-textarea"
            rows={8}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe what learners will learn in this lesson..."
          />
        </div>
      )}

      {tab === "attachments" && (
        <div>
          {attachments.length === 0 ? (
            <p style={{ color: "var(--o-text-secondary)", marginBottom: 16 }}>
              No attachments yet.
            </p>
          ) : (
            <div style={{ marginBottom: 16 }}>
              {attachments.map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 0",
                    borderBottom: "1px solid var(--o-border-subtle)",
                  }}>
                  <i
                    className={`fas ${a.type === "file" ? "fa-paperclip" : "fa-link"}`}
                    style={{ color: "var(--o-text-secondary)" }}
                  />
                  <span style={{ flex: 1 }}>{a.label || a.url}</span>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-icon">
                    <i className="fas fa-external-link-alt" />
                  </a>
                  <button
                    className="btn-icon"
                    onClick={() => setDeleteAttachTarget(a)}>
                    <i
                      className="fas fa-trash"
                      style={{ color: "var(--o-danger)" }}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              border: "1px solid var(--o-border)",
              borderRadius: "var(--o-radius)",
              padding: 12,
            }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}>
                <input
                  type="radio"
                  checked={newAttach.type === "link"}
                  onChange={() => setNewAttach({ ...newAttach, type: "link" })}
                />{" "}
                Link
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  cursor: "pointer",
                }}>
                <input
                  type="radio"
                  checked={newAttach.type === "file"}
                  onChange={() => setNewAttach({ ...newAttach, type: "file" })}
                />{" "}
                File
              </label>
            </div>
            <div className="form-grid-2">
              <input
                className="o-input"
                placeholder="Label"
                value={newAttach.label}
                onChange={(e) =>
                  setNewAttach({ ...newAttach, label: e.target.value })
                }
              />
              {newAttach.type === "link" ? (
                <input
                  className="o-input"
                  placeholder="https://..."
                  value={newAttach.url}
                  onChange={(e) =>
                    setNewAttach({ ...newAttach, url: e.target.value })
                  }
                />
              ) : (
                <input
                  type="file"
                  className="o-input"
                  onChange={(e) =>
                    setNewAttach({ ...newAttach, file: e.target.files[0] })
                  }
                />
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm mt-2"
              onClick={handleAddAttachment}>
              <i className="fas fa-plus" /> Add Attachment
            </button>
          </div>
        </div>
      )}

      {deleteAttachTarget && (
        <ConfirmDialog
          title="Remove Attachment"
          message={`Remove "${deleteAttachTarget.label || deleteAttachTarget.url}"?`}
          onConfirm={() => handleDeleteAttachment(deleteAttachTarget)}
          onCancel={() => setDeleteAttachTarget(null)}
        />
      )}
    </Modal>
  );
}

function QuizBuilderModal({ courseId, quiz, onClose, onSaved }) {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [selectedQ, setSelectedQ] = useState(null);
  const [qForm, setQForm] = useState({
    question_text: "",
    options: [
      { option_text: "", is_correct: false },
      { option_text: "", is_correct: false },
    ],
  });
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState([
    { attempt_number: 1, points: 10 },
    { attempt_number: 2, points: 7 },
    { attempt_number: 3, points: 5 },
    { attempt_number: 0, points: 3 },
  ]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (quiz?.id) {
      getQuiz(courseId, quiz.id)
        .then((r) => {
          setQuestions(r.data.questions || []);
          if (r.data.rewards?.length) setRewards(r.data.rewards);
        })
        .catch(() => {});
    }
  }, [quiz?.id, courseId]);

  const selectQuestion = (q) => {
    setSelectedQ(q);
    setQForm({
      question_text: q.question_text,
      options: q.options?.length
        ? q.options
        : [
            { option_text: "", is_correct: false },
            { option_text: "", is_correct: false },
          ],
    });
  };

  const handleSaveQuestion = async () => {
    if (!qForm.question_text.trim()) {
      toast.error("Question text is required");
      return;
    }
    setSaving(true);
    try {
      if (selectedQ?.id) {
        const res = await updateQuestion(
          courseId,
          quiz.id,
          selectedQ.id,
          qForm,
        );
        setQuestions((prev) =>
          prev.map((q) => (q.id === selectedQ.id ? res.data : q)),
        );
        toast.success("Question updated");
      } else {
        const res = await addQuestion(courseId, quiz.id, qForm);
        setQuestions((prev) => [...prev, res.data]);
        toast.success("Question added");
      }
      setSelectedQ(null);
      setQForm({
        question_text: "",
        options: [
          { option_text: "", is_correct: false },
          { option_text: "", is_correct: false },
        ],
      });
    } catch {
      toast.error("Failed to save question");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (q) => {
    try {
      await deleteQuestion(courseId, quiz.id, q.id);
      setQuestions((prev) => prev.filter((x) => x.id !== q.id));
      if (selectedQ?.id === q.id) {
        setSelectedQ(null);
      }
      toast.success("Question deleted");
    } catch {
      toast.error("Failed to delete question");
    }
  };

  const handleSaveRewards = async () => {
    try {
      await saveQuizRewards(courseId, quiz.id, rewards);
      toast.success("Rewards saved");
      setShowRewards(false);
    } catch {
      toast.error("Failed to save rewards");
    }
  };

  const updateOption = (idx, field, value) => {
    const opts = [...qForm.options];
    if (field === "is_correct") {
      opts.forEach((o, i) => {
        opts[i] = { ...o, is_correct: i === idx };
      });
    } else {
      opts[idx] = { ...opts[idx], [field]: value };
    }
    setQForm({ ...qForm, options: opts });
  };

  return (
    <Modal
      title={`Quiz Builder — ${quiz?.title}`}
      onClose={onClose}
      size="lg"
      footer={
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }>
      <div style={{ display: "flex", gap: 16, minHeight: 400 }}>
        {/* Left panel */}
        <div
          style={{
            width: 220,
            borderRight: "1px solid var(--o-border)",
            paddingRight: 16,
            flexShrink: 0,
          }}>
          <div
            style={{
              fontWeight: 500,
              marginBottom: 8,
              fontSize: "0.857rem",
              color: "var(--o-text-secondary)",
            }}>
            QUESTIONS
          </div>
          {questions.map((q, i) => (
            <div
              key={q.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 4,
              }}>
              <button
                onClick={() => selectQuestion(q)}
                style={{
                  flex: 1,
                  textAlign: "left",
                  padding: "6px 8px",
                  border: `1px solid ${selectedQ?.id === q.id ? "var(--o-primary)" : "var(--o-border)"}`,
                  borderRadius: "var(--o-radius-sm)",
                  background:
                    selectedQ?.id === q.id ? "var(--o-primary-subtle)" : "#fff",
                  cursor: "pointer",
                  fontSize: "0.857rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                Q{i + 1}. {q.question_text.slice(0, 30)}
                {q.question_text.length > 30 ? "..." : ""}
              </button>
              <button
                className="btn-icon"
                onClick={() => handleDeleteQuestion(q)}>
                <i
                  className="fas fa-trash"
                  style={{ color: "var(--o-danger)", fontSize: "0.786rem" }}
                />
              </button>
            </div>
          ))}
          <button
            className="btn btn-secondary btn-sm w-full mt-2"
            onClick={() => {
              setSelectedQ({});
              setQForm({
                question_text: "",
                options: [
                  { option_text: "", is_correct: false },
                  { option_text: "", is_correct: false },
                ],
              });
            }}>
            <i className="fas fa-plus" /> Add Question
          </button>
          <button
            className="btn btn-secondary btn-sm w-full mt-2"
            onClick={() => setShowRewards(true)}>
            <i className="fas fa-trophy" /> Set Rewards
          </button>
        </div>

        {/* Right editor */}
        <div style={{ flex: 1 }}>
          {!selectedQ ? (
            <div className="empty-state" style={{ padding: 24 }}>
              <div className="empty-state-icon">
                <i className="fas fa-question-circle" />
              </div>
              <p>Select a question to edit or add a new one.</p>
            </div>
          ) : (
            <div>
              <div className="form-group">
                <label className="form-label">
                  Question Text <span className="required">*</span>
                </label>
                <textarea
                  className="o-textarea"
                  rows={3}
                  value={qForm.question_text}
                  onChange={(e) =>
                    setQForm({ ...qForm, question_text: e.target.value })
                  }
                  placeholder="Enter your question..."
                />
              </div>
              <div className="form-group">
                <label className="form-label">Options</label>
                {qForm.options.map((opt, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}>
                    <input
                      type="radio"
                      name="correct"
                      checked={opt.is_correct}
                      onChange={() => updateOption(i, "is_correct", true)}
                      title="Mark as correct"
                    />
                    <input
                      className="o-input"
                      value={opt.option_text}
                      onChange={(e) =>
                        updateOption(i, "option_text", e.target.value)
                      }
                      placeholder={`Option ${i + 1}`}
                    />
                    {qForm.options.length > 2 && (
                      <button
                        className="btn-icon"
                        onClick={() =>
                          setQForm({
                            ...qForm,
                            options: qForm.options.filter((_, j) => j !== i),
                          })
                        }>
                        <i className="fas fa-times" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() =>
                    setQForm({
                      ...qForm,
                      options: [
                        ...qForm.options,
                        { option_text: "", is_correct: false },
                      ],
                    })
                  }>
                  <i className="fas fa-plus" /> Add Option
                </button>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleSaveQuestion}
                disabled={saving}>
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Saving...
                  </>
                ) : selectedQ?.id ? (
                  "Update Question"
                ) : (
                  "Add Question"
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {showRewards && (
        <Modal
          title="Set Quiz Rewards"
          onClose={() => setShowRewards(false)}
          footer={
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setShowRewards(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveRewards}>
                Save Rewards
              </button>
            </>
          }>
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginBottom: 16,
              fontSize: "0.929rem",
            }}>
            Points awarded per attempt number (regardless of score).
          </p>
          {[
            { label: "1st Attempt", num: 1 },
            { label: "2nd Attempt", num: 2 },
            { label: "3rd Attempt", num: 3 },
            { label: "4th+ Attempt", num: 0 },
          ].map(({ label, num }) => {
            const r = rewards.find((x) => x.attempt_number === num) || {
              attempt_number: num,
              points: 0,
            };
            return (
              <div
                key={num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}>
                <span style={{ width: 120, fontSize: "0.929rem" }}>
                  {label}
                </span>
                <input
                  type="number"
                  className="o-input"
                  style={{ width: 80 }}
                  value={r.points}
                  min={0}
                  onChange={(e) =>
                    setRewards((prev) => {
                      const next = prev.filter((x) => x.attempt_number !== num);
                      return [
                        ...next,
                        {
                          attempt_number: num,
                          points: parseInt(e.target.value) || 0,
                        },
                      ];
                    })
                  }
                />
                <span
                  style={{
                    color: "var(--o-text-secondary)",
                    fontSize: "0.857rem",
                  }}>
                  points
                </span>
              </div>
            );
          })}
        </Modal>
      )}
    </Modal>
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
      const payload = { ...form, tags: form.tags };
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
                  src={
                    course.cover_image_url.startsWith("http")
                      ? course.cover_image_url
                      : `http://localhost:5000${course.cover_image_url}`
                  }
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
