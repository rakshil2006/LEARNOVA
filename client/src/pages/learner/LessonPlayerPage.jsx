import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../hooks/useToast";
import { getPublicCourse } from "../../api/courseApi";
import {
  updateLessonProgress,
  submitQuizAttempt,
  completeCourse,
} from "../../api/progressApi";
import { getQuiz, getQuizzes } from "../../api/quizApi";
import { formatDuration, resolveMediaUrl } from "../../utils/formatters";
import { getBadge, getNextBadge } from "../../utils/constants";
import Modal from "../../components/common/Modal";
import ProgressBar from "../../components/common/ProgressBar";

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

function getEmbedUrl(url) {
  if (!url) return "";
  if (url.includes("youtube.com/watch")) {
    const v = new URL(url).searchParams.get("v");
    return `https://www.youtube.com/embed/${v}`;
  }
  if (url.includes("youtu.be/")) {
    const v = url.split("youtu.be/")[1]?.split("?")[0];
    return `https://www.youtube.com/embed/${v}`;
  }
  if (url.includes("drive.google.com")) {
    const m = url.match(/\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  }
  return url;
}

function QuizPlayer({ lesson, courseId, onComplete, onNext }) {
  const toast = useToast();
  const { user } = useAuth();
  const [quiz, setQuiz] = useState(null);
  const [phase, setPhase] = useState("intro"); // intro | questions | result
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  // Load quiz for this lesson
  useEffect(() => {
    if (!lesson) return;
    getQuizzes(courseId)
      .then((res) => {
        const q =
          res.data.find((x) => x.lesson_id === lesson.id) || res.data[0];
        if (q) {
          getQuiz(courseId, q.id)
            .then((r) => {
              setQuiz(r.data);
            })
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, [lesson, courseId]);

  const handleSubmit = async () => {
    if (!quiz) return;
    setSubmitting(true);
    const answersArr = quiz.questions.map((q) => ({
      question_id: q.id,
      selected_option_id: answers[q.id] || null,
    }));
    try {
      const res = await submitQuizAttempt(quiz.id, {
        answers: answersArr,
        courseId,
      });
      setResult(res.data);
      setAttemptCount(res.data.attempt_number);
      setPhase("result");
      onComplete(res.data.completion_percent);
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!quiz)
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        <i
          className="fas fa-spinner fa-spin"
          style={{ fontSize: "2rem", color: "var(--o-primary)" }}
        />
      </div>
    );

  if (phase === "intro")
    return (
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: 32,
          textAlign: "center",
        }}>
        <i
          className="fas fa-question-circle"
          style={{
            fontSize: "3rem",
            color: "var(--o-primary)",
            marginBottom: 16,
          }}
        />
        <h2 style={{ marginBottom: 8 }}>{quiz.title}</h2>
        <p style={{ color: "var(--o-text-secondary)", marginBottom: 8 }}>
          {quiz.questions?.length || 0} questions
        </p>
        <p
          style={{
            color: "var(--o-text-secondary)",
            marginBottom: 24,
            fontSize: "0.929rem",
          }}>
          Multiple attempts allowed. Score at least 60% to earn points.
        </p>
        {attemptCount > 0 && (
          <p style={{ color: "var(--o-text-secondary)", marginBottom: 16 }}>
            You have attempted this quiz {attemptCount} time(s).
          </p>
        )}
        <button
          className="btn btn-primary btn-lg"
          onClick={() => {
            setPhase("questions");
            setCurrentQ(0);
            setAnswers({});
          }}>
          {attemptCount > 0 ? "Retake Quiz" : "Start Quiz"}
        </button>
      </div>
    );

  if (phase === "questions") {
    const q = quiz.questions[currentQ];
    const isLast = currentQ === quiz.questions.length - 1;
    return (
      <div style={{ maxWidth: 600, margin: "0 auto", padding: 32 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
            fontSize: "0.857rem",
            color: "var(--o-text-secondary)",
          }}>
          <span>
            Question {currentQ + 1} of {quiz.questions.length}
          </span>
          <span>{Math.round((currentQ / quiz.questions.length) * 100)}%</span>
        </div>
        <ProgressBar
          value={Math.round((currentQ / quiz.questions.length) * 100)}
        />
        <div style={{ marginTop: 24, marginBottom: 24 }}>
          <h3 style={{ marginBottom: 20 }}>{q.question_text}</h3>
          {q.options?.map((opt) => (
            <label
              key={opt.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 14px",
                border: `2px solid ${answers[q.id] === opt.id ? "var(--o-primary)" : "var(--o-border)"}`,
                borderRadius: "var(--o-radius)",
                marginBottom: 8,
                cursor: "pointer",
                background:
                  answers[q.id] === opt.id ? "var(--o-primary-subtle)" : "#fff",
                transition: "all var(--o-transition)",
              }}>
              <input
                type="radio"
                name={`q_${q.id}`}
                checked={answers[q.id] === opt.id}
                onChange={() => setAnswers({ ...answers, [q.id]: opt.id })}
                style={{ display: "none" }}
              />
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: `2px solid ${answers[q.id] === opt.id ? "var(--o-primary)" : "var(--o-gray-400)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                {answers[q.id] === opt.id && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--o-primary)",
                    }}
                  />
                )}
              </div>
              {opt.option_text}
            </label>
          ))}
        </div>
        <button
          className="btn btn-primary"
          disabled={!answers[q.id] || submitting}
          onClick={() => {
            if (isLast) handleSubmit();
            else setCurrentQ(currentQ + 1);
          }}>
          {submitting ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Submitting...
            </>
          ) : isLast ? (
            "Proceed & Complete Quiz"
          ) : (
            "Proceed"
          )}
        </button>
      </div>
    );
  }

  if (phase === "result" && result) {
    const badge = getBadge(result.total_points);
    const nextBadge = getNextBadge(result.total_points);
    const badgePct = nextBadge
      ? Math.round(
          ((result.total_points - badge.minPoints) /
            (nextBadge.minPoints - badge.minPoints)) *
            100,
        )
      : 100;
    const passed = result.passed;
    const scoreColor = passed ? "var(--o-success, #22c55e)" : "var(--o-danger)";
    return (
      <div
        style={{
          maxWidth: 500,
          margin: "0 auto",
          padding: 32,
          textAlign: "center",
        }}>
        <div style={{ fontSize: "3rem", marginBottom: 8 }}>
          {passed ? "🎉" : "😕"}
        </div>
        <h2 style={{ marginBottom: 4, color: scoreColor }}>
          {result.score_pct}% — {passed ? "Passed!" : "Not passed"}
        </h2>
        <p style={{ color: "var(--o-text-secondary)", marginBottom: 4 }}>
          {result.correct} / {result.total} correct · Attempt #
          {result.attempt_number}
        </p>
        {passed ? (
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginBottom: 16,
              fontSize: "0.929rem",
            }}>
            You earned <strong>{result.points_earned}</strong> points for
            passing!
          </p>
        ) : (
          <p
            style={{
              color: "var(--o-text-secondary)",
              marginBottom: 16,
              fontSize: "0.929rem",
            }}>
            Score at least 60% to earn points. Try again!
          </p>
        )}
        <div
          style={{
            background: "var(--o-primary-subtle)",
            borderRadius: "var(--o-radius)",
            padding: 16,
            marginBottom: 20,
          }}>
          <div
            style={{
              fontSize: "1.714rem",
              fontWeight: 700,
              color: "var(--o-primary)",
            }}>
            {result.total_points}
          </div>
          <div
            style={{ fontSize: "0.857rem", color: "var(--o-text-secondary)" }}>
            Total Points
          </div>
          {badge && (
            <div style={{ marginTop: 8 }}>
              {badge.icon} {badge.name}
            </div>
          )}
          {nextBadge && (
            <div style={{ marginTop: 8 }}>
              <ProgressBar value={badgePct} />
              <div
                style={{
                  fontSize: "0.786rem",
                  color: "var(--o-text-secondary)",
                  marginTop: 4,
                }}>
                {nextBadge.minPoints - result.total_points} pts to{" "}
                {nextBadge.icon} {nextBadge.name}
              </div>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          <button
            className="btn btn-secondary"
            onClick={() => setPhase("intro")}>
            Retake Quiz
          </button>
          {onNext && (
            <button className="btn btn-primary" onClick={onNext}>
              Next Lesson <i className="fas fa-arrow-right" />
            </button>
          )}
          {!onNext && (
            <button
              className="btn btn-primary"
              onClick={() => setPhase("intro")}>
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export default function LessonPlayerPage() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [completionPct, setCompletionPct] = useState(0);
  const [completing, setCompleting] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const timeRef = useRef(0);
  const intervalRef = useRef(null);

  const progressRef = useRef({});

  const load = useCallback(async () => {
    try {
      const res = await getPublicCourse(courseId);
      setCourse(res.data);
      const ls = res.data.lessons || [];
      setLessons(ls);
      const lp = {};
      ls.forEach((l) => {
        lp[l.id] = l.progress_status || "not_started";
      });
      progressRef.current = lp;
      setProgress(lp);
      const completed = ls.filter((l) => lp[l.id] === "completed").length;
      setCompletionPct(
        ls.length > 0 ? Math.round((completed / ls.length) * 100) : 0,
      );
      const lesson = ls.find((l) => l.id === parseInt(lessonId));
      setCurrentLesson(lesson || ls[0]);
    } catch {
      toast.error("Failed to load course");
    }
  }, [courseId, lessonId]);

  useEffect(() => {
    load();
  }, [load]);

  // Time tracking
  useEffect(() => {
    if (!currentLesson) return;
    timeRef.current = 0;

    // Mark in_progress for video, auto-complete for doc/image
    const markProgress = async () => {
      const currentStatus = progressRef.current[currentLesson.id];
      if (currentLesson.type === "video") {
        if (currentStatus !== "completed") {
          await updateLessonProgress(currentLesson.id, {
            status: "in_progress",
            courseId,
          }).catch(() => {});
          progressRef.current = {
            ...progressRef.current,
            [currentLesson.id]: "in_progress",
          };
          setProgress((prev) => ({
            ...prev,
            [currentLesson.id]: "in_progress",
          }));
        }
      } else if (
        currentLesson.type === "document" ||
        currentLesson.type === "image"
      ) {
        if (currentStatus !== "completed") {
          const res = await updateLessonProgress(currentLesson.id, {
            status: "completed",
            courseId,
          }).catch(() => null);
          progressRef.current = {
            ...progressRef.current,
            [currentLesson.id]: "completed",
          };
          setProgress((prev) => ({ ...prev, [currentLesson.id]: "completed" }));
          if (res?.data?.completion_percent !== undefined)
            setCompletionPct(res.data.completion_percent);
        }
      }
    };
    markProgress();

    // Heartbeat every 30s
    intervalRef.current = setInterval(async () => {
      timeRef.current += 30;
      await updateLessonProgress(currentLesson.id, {
        time_spent_seconds: 30,
        courseId,
      }).catch(() => {});
    }, 30000);

    return () => {
      clearInterval(intervalRef.current);
      if (timeRef.current > 0) {
        updateLessonProgress(currentLesson.id, {
          time_spent_seconds: timeRef.current % 30,
          courseId,
        }).catch(() => {});
      }
    };
  }, [currentLesson?.id]);

  const handleMarkComplete = async () => {
    try {
      const res = await updateLessonProgress(currentLesson.id, {
        status: "completed",
        courseId,
      });
      progressRef.current = {
        ...progressRef.current,
        [currentLesson.id]: "completed",
      };
      setProgress((prev) => ({ ...prev, [currentLesson.id]: "completed" }));
      if (res.data.completion_percent !== undefined)
        setCompletionPct(res.data.completion_percent);
      toast.success("Lesson marked as complete");
    } catch {
      toast.error("Failed to mark complete");
    }
  };

  const handleCompleteCourse = async () => {
    setCompleting(true);
    try {
      await completeCourse(courseId);
      setConfetti(true);
      setShowCompleteModal(true);
      setTimeout(() => {
        setConfetti(false);
        setShowCompleteModal(false);
        navigate(`/courses/${courseId}`);
      }, 3500);
    } catch {
      toast.error("Could not mark course complete. Please try again.");
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizComplete = (pct) => {
    setCompletionPct(pct);
    setProgress((prev) => ({ ...prev, [currentLesson.id]: "completed" }));
  };

  const currentIdx = lessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
  const nextLesson =
    currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;

  const navigateLesson = (lesson) => {
    setCurrentLesson(lesson);
    navigate(`/courses/${courseId}/lessons/${lesson.id}`, { replace: true });
  };

  if (!course || !currentLesson)
    return (
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

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}>
      {/* Top strip */}
      <div
        style={{
          height: 46,
          background: "var(--o-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          gap: 12,
          flexShrink: 0,
        }}>
        <Link
          to={`/courses/${courseId}`}
          style={{ color: "#fff", opacity: 0.85 }}>
          <i className="fas fa-arrow-left" />
        </Link>
        <span
          style={{
            fontWeight: 500,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}>
          {course.title}
        </span>
        <span style={{ fontSize: "0.857rem", opacity: 0.85 }}>
          {completionPct}% complete
        </span>
        <div style={{ width: 100 }}>
          <ProgressBar value={completionPct} />
        </div>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div
            style={{
              width: 280,
              background: "var(--o-bg-sidebar)",
              borderRight: "1px solid var(--o-border)",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              overflow: "hidden",
            }}>
            <div
              style={{
                padding: "8px 12px",
                borderBottom: "1px solid var(--o-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
              <span
                style={{
                  fontSize: "0.857rem",
                  fontWeight: 500,
                  color: "var(--o-text-secondary)",
                }}>
                CONTENTS
              </span>
              <button
                className="btn-icon"
                onClick={() => setSidebarOpen(false)}>
                <i className="fas fa-chevron-left" />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {lessons.map((l) => (
                <div key={l.id}>
                  <div
                    onClick={() => navigateLesson(l)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      cursor: "pointer",
                      background:
                        l.id === currentLesson.id
                          ? "var(--o-primary-subtle)"
                          : "transparent",
                      borderLeft: `3px solid ${l.id === currentLesson.id ? "var(--o-primary)" : "transparent"}`,
                      transition: "background var(--o-transition)",
                      minHeight: 32,
                    }}
                    onMouseEnter={(e) => {
                      if (l.id !== currentLesson.id)
                        e.currentTarget.style.background = "var(--o-gray-100)";
                    }}
                    onMouseLeave={(e) => {
                      if (l.id !== currentLesson.id)
                        e.currentTarget.style.background = "";
                    }}>
                    <i
                      className={`fas ${STATUS_ICONS[progress[l.id] || "not_started"]}`}
                      style={{
                        color: STATUS_COLORS[progress[l.id] || "not_started"],
                        fontSize: "0.857rem",
                        flexShrink: 0,
                      }}
                    />
                    <i
                      className={`fas ${LESSON_ICONS[l.type]}`}
                      style={{
                        color:
                          l.id === currentLesson.id
                            ? "var(--o-primary)"
                            : "var(--o-text-secondary)",
                        fontSize: "0.857rem",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: "0.857rem",
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: l.id === currentLesson.id ? 500 : 400,
                        color:
                          l.id === currentLesson.id
                            ? "var(--o-primary)"
                            : "var(--o-text-primary)",
                      }}>
                      {l.title}
                    </span>
                  </div>
                  {/* Attachments */}
                  {l.attachments?.map((a) => (
                    <a
                      key={a.id}
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 12px 4px 36px",
                        fontSize: "0.786rem",
                        color: "var(--o-info)",
                        textDecoration: "none",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.textDecoration = "underline")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.textDecoration = "none")
                      }>
                      <i
                        className={`fas ${a.type === "file" ? "fa-paperclip" : "fa-link"}`}
                      />
                      {a.label || "Attachment"}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
          {!sidebarOpen && (
            <button
              className="btn-icon"
              onClick={() => setSidebarOpen(true)}
              style={{
                position: "absolute",
                left: 0,
                top: "50%",
                zIndex: 10,
                background: "#fff",
                border: "1px solid var(--o-border)",
                borderRadius: "0 4px 4px 0",
                padding: "8px 4px",
              }}>
              <i className="fas fa-chevron-right" />
            </button>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            <h1 style={{ marginBottom: 8 }}>{currentLesson.title}</h1>
            {currentLesson.description && (
              <p
                style={{
                  color: "var(--o-text-secondary)",
                  marginBottom: 20,
                  lineHeight: 1.6,
                }}>
                {currentLesson.description}
              </p>
            )}

            {/* Content area */}
            {currentLesson.type === "video" && (
              <div>
                {currentLesson.video_url ? (
                  <div
                    style={{
                      position: "relative",
                      paddingBottom: "56.25%",
                      height: 0,
                      marginBottom: 16,
                    }}>
                    <iframe
                      src={getEmbedUrl(currentLesson.video_url)}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        border: "none",
                        borderRadius: "var(--o-radius)",
                      }}
                      allowFullScreen
                      title={currentLesson.title}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      background: "var(--o-gray-200)",
                      height: 300,
                      borderRadius: "var(--o-radius)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                    }}>
                    <i
                      className="fas fa-play-circle"
                      style={{ fontSize: "3rem", color: "var(--o-gray-500)" }}
                    />
                  </div>
                )}
                {progress[currentLesson.id] !== "completed" && (
                  <button
                    className="btn btn-success"
                    onClick={handleMarkComplete}>
                    <i className="fas fa-check" /> Mark as Complete
                  </button>
                )}
                {progress[currentLesson.id] === "completed" && (
                  <span className="badge badge-success">
                    <i
                      className="fas fa-check-circle"
                      style={{ marginRight: 4 }}
                    />
                    Completed
                  </span>
                )}
              </div>
            )}

            {currentLesson.type === "document" && (
              <div>
                {currentLesson.file_url ? (
                  <div
                    style={{
                      border: "1px solid var(--o-border)",
                      borderRadius: "var(--o-radius)",
                      padding: 32,
                      textAlign: "center",
                      background: "var(--o-gray-50)",
                    }}>
                    <i
                      className="fas fa-file-pdf"
                      style={{
                        fontSize: "3rem",
                        color: "var(--o-danger)",
                        marginBottom: 16,
                        display: "block",
                      }}
                    />
                    <p
                      style={{
                        marginBottom: 16,
                        color: "var(--o-text-secondary)",
                      }}>
                      {currentLesson.file_url.split("/").pop()}
                    </p>
                    <a
                      href={resolveMediaUrl(currentLesson.file_url)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary">
                      <i className="fas fa-eye" /> Open Document
                    </a>
                    {currentLesson.allow_download && (
                      <a
                        href={resolveMediaUrl(currentLesson.file_url)}
                        download
                        className="btn btn-secondary"
                        style={{ marginLeft: 8 }}>
                        <i className="fas fa-download" /> Download
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fas fa-file-alt" />
                    </div>
                    <p>No document uploaded.</p>
                  </div>
                )}
              </div>
            )}

            {currentLesson.type === "image" && (
              <div style={{ textAlign: "center" }}>
                {currentLesson.file_url ? (
                  <img
                    src={resolveMediaUrl(currentLesson.file_url)}
                    alt={currentLesson.title}
                    style={{
                      maxWidth: "100%",
                      borderRadius: "var(--o-radius)",
                      border: "1px solid var(--o-border)",
                    }}
                    loading="lazy"
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fas fa-image" />
                    </div>
                    <p>No image uploaded.</p>
                  </div>
                )}
                {currentLesson.allow_download && currentLesson.file_url && (
                  <div style={{ marginTop: 12 }}>
                    <a
                      href={resolveMediaUrl(currentLesson.file_url)}
                      download
                      className="btn btn-secondary btn-sm">
                      <i className="fas fa-download" /> Download
                    </a>
                  </div>
                )}
              </div>
            )}

            {currentLesson.type === "quiz" && (
              <QuizPlayer
                lesson={currentLesson}
                courseId={courseId}
                onComplete={handleQuizComplete}
                onNext={nextLesson ? () => navigateLesson(nextLesson) : null}
              />
            )}

            {/* Complete Course button */}
            <div
              style={{
                marginTop: 32,
                paddingTop: 20,
                borderTop: "1px solid var(--o-border-subtle)",
              }}>
              <button
                className={`btn btn-lg ${completionPct >= 100 ? "btn-success pulse-success" : "btn-secondary"}`}
                disabled={completionPct < 100 || completing}
                onClick={handleCompleteCourse}
                title={
                  completionPct < 100
                    ? "Complete all lessons to finish the course"
                    : "Mark course as completed"
                }>
                {completing ? (
                  <>
                    <i className="fas fa-spinner fa-spin" /> Completing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-trophy" /> Complete This Course
                  </>
                )}
              </button>
              {completionPct < 100 && (
                <p
                  style={{
                    fontSize: "0.857rem",
                    color: "var(--o-text-secondary)",
                    marginTop: 6,
                  }}>
                  Complete all lessons to finish the course ({completionPct}%
                  done)
                </p>
              )}
            </div>
          </div>

          {/* Bottom nav */}
          <div
            style={{
              borderTop: "1px solid var(--o-border)",
              padding: "10px 24px",
              display: "flex",
              justifyContent: "space-between",
              background: "#fff",
              flexShrink: 0,
            }}>
            <button
              className="btn btn-secondary"
              disabled={!prevLesson}
              onClick={() => prevLesson && navigateLesson(prevLesson)}>
              <i className="fas fa-arrow-left" /> Back
            </button>
            <Link
              to={`/courses/${courseId}`}
              className="btn btn-secondary btn-sm">
              <i className="fas fa-th-list" /> Course Overview
            </Link>
            <button
              className="btn btn-primary"
              disabled={!nextLesson}
              onClick={() => nextLesson && navigateLesson(nextLesson)}>
              Next Content <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Completion modal */}
      {showCompleteModal && (
        <div className="o-dialog-backdrop">
          <div
            className="o-dialog"
            style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: "3rem", marginBottom: 12 }}>🏆</div>
            <h2 style={{ marginBottom: 8 }}>Course Completed!</h2>
            <p style={{ color: "var(--o-text-secondary)" }}>
              Congratulations! Redirecting to course overview...
            </p>
          </div>
        </div>
      )}

      {/* Confetti */}
      {confetti &&
        [...Array(20)].map((_, i) => (
          <div
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              background: [
                "var(--o-primary)",
                "var(--o-success)",
                "var(--o-warning)",
                "var(--o-info)",
              ][i % 4],
              animationDelay: `${Math.random() * 1}s`,
              borderRadius: Math.random() > 0.5 ? "50%" : 0,
            }}
          />
        ))}
    </div>
  );
}
