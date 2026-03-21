import { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { useToast } from "../../hooks/useToast";
import {
  getQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  setRewards as saveQuizRewards,
} from "../../api/quizApi";

const DEFAULT_QUIZ_REWARDS = [
  { attempt_number: 1, points: 10 },
  { attempt_number: 2, points: 7 },
  { attempt_number: 3, points: 5 },
  { attempt_number: 0, points: 3 },
];

const BLANK_QFORM = {
  question_text: "",
  options: [
    { option_text: "", is_correct: false },
    { option_text: "", is_correct: false },
  ],
};

const ATTEMPT_LABELS = [
  { label: "1st Attempt", num: 1 },
  { label: "2nd Attempt", num: 2 },
  { label: "3rd Attempt", num: 3 },
  { label: "4th+ Attempt", num: 0 },
];

export default function QuizBuilderModal({ courseId, quiz, onClose }) {
  const toast = useToast();
  const [questions, setQuestions] = useState([]);
  const [selectedQ, setSelectedQ] = useState(null);
  const [qForm, setQForm] = useState(BLANK_QFORM);
  const [showRewards, setShowRewards] = useState(false);
  const [rewards, setRewards] = useState(DEFAULT_QUIZ_REWARDS);
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
      options: q.options?.length ? q.options : BLANK_QFORM.options,
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
      setQForm(BLANK_QFORM);
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
      if (selectedQ?.id === q.id) setSelectedQ(null);
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
    const opts = qForm.options.map((o, i) =>
      field === "is_correct"
        ? { ...o, is_correct: i === idx }
        : i === idx
          ? { ...o, [field]: value }
          : o,
    );
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
        <div className="quiz-sidebar">
          <div className="quiz-sidebar-label">QUESTIONS</div>
          {questions.map((q, i) => (
            <div key={q.id} className="quiz-q-row">
              <button
                onClick={() => selectQuestion(q)}
                className={`quiz-q-btn ${selectedQ?.id === q.id ? "active" : ""}`}>
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
              setQForm(BLANK_QFORM);
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
                  <div key={i} className="quiz-option-row">
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
          {ATTEMPT_LABELS.map(({ label, num }) => {
            const r = rewards.find((x) => x.attempt_number === num) || {
              attempt_number: num,
              points: 0,
            };
            return (
              <div key={num} className="reward-row">
                <span className="reward-label">{label}</span>
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
