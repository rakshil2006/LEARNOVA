import { useState, useEffect, useRef } from "react";
import Modal from "../common/Modal";
import ConfirmDialog from "../common/ConfirmDialog";
import { useToast } from "../../hooks/useToast";
import {
  createLesson,
  updateLesson,
  uploadLessonFile,
  addAttachment,
  deleteAttachment,
} from "../../api/lessonApi";

const LESSON_ICONS = {
  video: "fa-play-circle",
  document: "fa-file-alt",
  image: "fa-image",
  quiz: "fa-question-circle",
};

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/[?&]v=([^&]+)/) || url.match(/youtu\.be\/([^?]+)/);
  return m ? m[1] : null;
}

export default function LessonEditorModal({
  courseId,
  lesson,
  onClose,
  onSaved,
  users,
}) {
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
            if (dur > 0)
              setForm((prev) => ({
                ...prev,
                duration_seconds: Math.round(dur / 60),
              }));
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
      if (file && saved.id) await uploadLessonFile(courseId, saved.id, file);
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
                  className={`lesson-type-option ${form.type === t ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    checked={form.type === t}
                    onChange={() => setForm({ ...form, type: t })}
                    style={{ display: "none" }}
                  />
                  <i className={`fas ${LESSON_ICONS[t]}`} />
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
              <label className="checkbox-label" style={{ marginTop: 8 }}>
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
                <div key={a.id} className="attachment-row">
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
          <div className="attach-add-box">
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              {["link", "file"].map((t) => (
                <label key={t} className="checkbox-label">
                  <input
                    type="radio"
                    checked={newAttach.type === t}
                    onChange={() => setNewAttach({ ...newAttach, type: t })}
                  />{" "}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </label>
              ))}
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
