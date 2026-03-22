import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getPublicStats, getPublicCourses } from "../../api/courseApi";
import { resolveMediaUrl } from "../../utils/formatters";

/* ── tiny hook: count-up animation ── */
function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0);
  const ref = useRef(false);
  useEffect(() => {
    if (!target || ref.current) return;
    ref.current = true;
    const steps = 60;
    const inc = target / steps;
    let cur = 0;
    const id = setInterval(() => {
      cur += inc;
      if (cur >= target) {
        setVal(target);
        clearInterval(id);
      } else setVal(Math.floor(cur));
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

const FEATURES = [
  {
    icon: "fa-play-circle",
    color: "#714b67",
    bg: "#f3eef1",
    title: "Video Lessons",
    desc: "Watch high-quality video content at your own pace, anytime and anywhere.",
  },
  {
    icon: "fa-trophy",
    color: "#f0ad4e",
    bg: "#fef8ee",
    title: "Earn Badges & Points",
    desc: "Complete quizzes to earn points and unlock achievement badges as you grow.",
  },
  {
    icon: "fa-chart-line",
    color: "#017e84",
    bg: "#e6f4f5",
    title: "Track Progress",
    desc: "Visual progress bars and completion stats keep you motivated every step.",
  },
  {
    icon: "fa-file-alt",
    color: "#28a745",
    bg: "#eaf6ec",
    title: "Rich Resources",
    desc: "Download documents, guides and supplementary materials for every course.",
  },
  {
    icon: "fa-users",
    color: "#6f42c1",
    bg: "#f0ebff",
    title: "Community Learning",
    desc: "Join thousands of learners, share reviews and learn together.",
  },
  {
    icon: "fa-shield-alt",
    color: "#d9534f",
    bg: "#fdf2f2",
    title: "Certified Content",
    desc: "All courses are reviewed and maintained by expert instructors.",
  },
];

const STEPS = [
  {
    n: "01",
    icon: "fa-search",
    title: "Discover",
    desc: "Browse our growing catalog of courses across tech, design, data science and more.",
  },
  {
    n: "02",
    icon: "fa-user-check",
    title: "Enroll",
    desc: "Sign up for free and enroll instantly — no credit card needed for open courses.",
  },
  {
    n: "03",
    icon: "fa-graduation-cap",
    title: "Learn",
    desc: "Watch videos, read docs, and complete interactive quizzes at your own pace.",
  },
  {
    n: "04",
    icon: "fa-star",
    title: "Achieve",
    desc: "Earn points, unlock badges, and showcase your skills to the world.",
  },
];

const TESTIMONIALS = [
  {
    name: "Priya Sharma",
    role: "Frontend Developer",
    avatar: "PS",
    color: "#714b67",
    text: "Learnova completely changed how I learn. The progress tracking keeps me accountable and the quizzes are genuinely fun.",
  },
  {
    name: "Carlos Rivera",
    role: "Data Analyst",
    avatar: "CR",
    color: "#017e84",
    text: "The Python Data Science course was exactly what I needed. Clear explanations, real datasets, and great pacing.",
  },
  {
    name: "Emily Johnson",
    role: "UX Designer",
    avatar: "EJ",
    color: "#f0ad4e",
    text: "I went from zero Figma knowledge to building full prototypes in 3 weeks. The UI/UX course is absolutely top-notch.",
  },
];

export default function LandingPage() {
  const [stats, setStats] = useState({
    total_courses: 0,
    total_learners: 0,
    lessons_published: 0,
  });
  const [courses, setCourses] = useState([]);

  const cCount = useCountUp(stats.total_courses);
  const lCount = useCountUp(stats.total_learners);
  const pCount = useCountUp(stats.lessons_published);

  useEffect(() => {
    getPublicStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
    getPublicCourses()
      .then((r) => setCourses(r.data.slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        fontFamily: "'Roboto', sans-serif",
      }}>
      <Navbar variant="public" />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #3d1f38 0%, #56364d 40%, #714b67 100%)",
          padding: "100px 24px 80px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}>
        {/* decorative blobs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: "rgba(113,75,103,0.25)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 280,
            height: 280,
            borderRadius: "50%",
            background: "rgba(1,126,132,0.2)",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "15%",
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(240,173,78,0.12)",
            filter: "blur(40px)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: 780,
            margin: "0 auto",
            position: "relative",
            zIndex: 1,
          }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              borderRadius: 20,
              padding: "6px 16px",
              marginBottom: 28,
              color: "rgba(255,255,255,0.9)",
              fontSize: "0.857rem",
              backdropFilter: "blur(8px)",
            }}>
            <i className="fas fa-bolt" style={{ color: "#f0ad4e" }} />
            The smarter way to learn online
          </div>

          <h1
            style={{
              fontSize: "clamp(2rem, 5vw, 3.2rem)",
              fontWeight: 800,
              color: "#fff",
              lineHeight: 1.15,
              marginBottom: 20,
              letterSpacing: "-0.02em",
            }}>
            Learn Anything.
            <br />
            <span
              style={{
                background: "linear-gradient(90deg, #e8c5de, #c49ab8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
              Grow Everywhere.
            </span>
          </h1>

          <p
            style={{
              fontSize: "1.143rem",
              color: "rgba(255,255,255,0.75)",
              marginBottom: 40,
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto 40px",
            }}>
            Learnova is your all-in-one eLearning platform. Explore expert-led
            courses, earn badges, and track your progress — all in one beautiful
            place.
          </p>

          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#714b67",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "1.071rem",
                textDecoration: "none",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(0,0,0,0.28)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
              }}>
              <i className="fas fa-rocket" /> Start Learning Free
            </Link>
            <Link
              to="/courses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: "1.071rem",
                textDecoration: "none",
                backdropFilter: "blur(8px)",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.18)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
              }>
              <i className="fas fa-book-open" /> Browse Courses
            </Link>
          </div>

          {/* social proof */}
          <div
            style={{
              marginTop: 48,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}>
            <div style={{ display: "flex" }}>
              {["PS", "CR", "EJ", "RV", "JW"].map((a, i) => (
                <div
                  key={a}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: [
                      "#714b67",
                      "#017e84",
                      "#f0ad4e",
                      "#28a745",
                      "#6f42c1",
                    ][i],
                    border: "2px solid rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "0.714rem",
                    fontWeight: 700,
                    marginLeft: i > 0 ? -10 : 0,
                    zIndex: 5 - i,
                  }}>
                  {a}
                </div>
              ))}
            </div>
            <span
              style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.929rem" }}>
              Join{" "}
              <strong style={{ color: "#fff" }}>
                {lCount > 0 ? `${lCount}+` : "…"}
              </strong>{" "}
              learners already growing
            </span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          STATS BAR
      ══════════════════════════════════════════ */}
      <section
        style={{
          background: "#fff",
          borderBottom: "1px solid #dee2e6",
          padding: "32px 24px",
          display: "flex",
          justifyContent: "center",
          gap: 0,
          flexWrap: "wrap",
        }}>
        {[
          {
            label: "Published Courses",
            value: cCount,
            icon: "fa-book-open",
            suffix: "+",
          },
          {
            label: "Active Learners",
            value: lCount,
            icon: "fa-users",
            suffix: "+",
          },
          {
            label: "Lessons Available",
            value: pCount,
            icon: "fa-play-circle",
            suffix: "+",
          },
          {
            label: "Satisfaction Rate",
            value: 98,
            icon: "fa-heart",
            suffix: "%",
          },
        ].map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign: "center",
              padding: "16px 48px",
              borderRight: i < 3 ? "1px solid #dee2e6" : "none",
              flex: "1 1 160px",
            }}>
            <i
              className={`fas ${s.icon}`}
              style={{
                fontSize: "1.286rem",
                color: "var(--o-primary)",
                marginBottom: 6,
                display: "block",
              }}
            />
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "#1a0a14",
                lineHeight: 1,
              }}>
              {s.value}
              {s.suffix}
            </div>
            <div
              style={{ fontSize: "0.857rem", color: "#6c757d", marginTop: 4 }}>
              {s.label}
            </div>
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "#f8f9fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span
              style={{
                background: "#f3eef1",
                color: "#714b67",
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: "0.857rem",
                fontWeight: 600,
              }}>
              WHY LEARNOVA
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 800,
                color: "#1a0a14",
                marginTop: 12,
                marginBottom: 12,
              }}>
              Everything You Need to Succeed
            </h2>
            <p
              style={{
                color: "#6c757d",
                fontSize: "1.071rem",
                maxWidth: 520,
                margin: "0 auto",
              }}>
              A complete learning ecosystem built for modern learners and
              educators.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "28px 24px",
                  border: "1px solid #dee2e6",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 24px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 12,
                    background: f.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}>
                  <i
                    className={`fas ${f.icon}`}
                    style={{ fontSize: "1.286rem", color: f.color }}
                  />
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.071rem",
                    color: "#1a0a14",
                    marginBottom: 8,
                  }}>
                  {f.title}
                </h3>
                <p
                  style={{
                    color: "#6c757d",
                    fontSize: "0.929rem",
                    lineHeight: 1.6,
                  }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FEATURED COURSES
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 40,
              flexWrap: "wrap",
              gap: 12,
            }}>
            <div>
              <span
                style={{
                  background: "#f3eef1",
                  color: "#714b67",
                  borderRadius: 20,
                  padding: "4px 14px",
                  fontSize: "0.857rem",
                  fontWeight: 600,
                }}>
                FEATURED
              </span>
              <h2
                style={{
                  fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                  fontWeight: 800,
                  color: "#1a0a14",
                  marginTop: 10,
                }}>
                Popular Courses
              </h2>
            </div>
            <Link
              to="/courses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                color: "#714b67",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.929rem",
              }}>
              View all courses <i className="fas fa-arrow-right" />
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}>
            {courses.length === 0
              ? [0, 1, 2].map((i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 12,
                      overflow: "hidden",
                      border: "1px solid #dee2e6",
                    }}>
                    <div className="skeleton" style={{ height: 180 }} />
                    <div style={{ padding: 20 }}>
                      <div
                        className="skeleton"
                        style={{
                          height: 18,
                          marginBottom: 10,
                          borderRadius: 4,
                        }}
                      />
                      <div
                        className="skeleton"
                        style={{ height: 14, width: "70%", borderRadius: 4 }}
                      />
                    </div>
                  </div>
                ))
              : courses.map((c) => {
                  const img = c.cover_image_url
                    ? resolveMediaUrl(c.cover_image_url)
                    : null;
                  return (
                    <Link
                      key={c.id}
                      to={`/courses/${c.id}`}
                      style={{ textDecoration: "none" }}>
                      <div
                        style={{
                          background: "#fff",
                          borderRadius: 12,
                          overflow: "hidden",
                          border: "1px solid #dee2e6",
                          transition: "transform 0.2s, box-shadow 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-4px)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(0,0,0,0.12)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "none";
                        }}>
                        {img ? (
                          <img
                            src={img}
                            alt={c.title}
                            style={{
                              width: "100%",
                              height: 180,
                              objectFit: "cover",
                            }}
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: 180,
                              background:
                                "linear-gradient(135deg, #f3eef1, #e6f4f5)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}>
                            <i
                              className="fas fa-book-open"
                              style={{ fontSize: "2.5rem", color: "#714b67" }}
                            />
                          </div>
                        )}
                        <div style={{ padding: "20px" }}>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                              marginBottom: 10,
                            }}>
                            {(c.tags || []).slice(0, 3).map((t) => (
                              <span
                                key={t}
                                style={{
                                  background: "#f3eef1",
                                  color: "#714b67",
                                  borderRadius: 20,
                                  padding: "2px 10px",
                                  fontSize: "0.786rem",
                                  fontWeight: 500,
                                }}>
                                {t}
                              </span>
                            ))}
                          </div>
                          <h3
                            style={{
                              fontWeight: 700,
                              fontSize: "1.071rem",
                              color: "#1a0a14",
                              marginBottom: 8,
                              lineHeight: 1.4,
                            }}>
                            {c.title}
                          </h3>
                          <p
                            style={{
                              color: "#6c757d",
                              fontSize: "0.857rem",
                              lineHeight: 1.5,
                              marginBottom: 16,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}>
                            {c.short_description}
                          </p>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                fontSize: "0.857rem",
                                color: "#6c757d",
                              }}>
                              <span>
                                <i
                                  className="fas fa-play-circle"
                                  style={{ marginRight: 4 }}
                                />
                                {c.total_lessons || 0} lessons
                              </span>
                              <span>
                                <i
                                  className="fas fa-clock"
                                  style={{ marginRight: 4 }}
                                />
                                {Math.round(
                                  (c.total_duration_seconds || 0) / 60,
                                )}{" "}
                                min
                              </span>
                            </div>
                            <span
                              style={{
                                background:
                                  c.access_rule === "payment"
                                    ? "#fef8ee"
                                    : "#eaf6ec",
                                color:
                                  c.access_rule === "payment"
                                    ? "#856404"
                                    : "#28a745",
                                borderRadius: 20,
                                padding: "3px 10px",
                                fontSize: "0.786rem",
                                fontWeight: 600,
                              }}>
                              {c.access_rule === "payment"
                                ? `$${c.price}`
                                : "Free"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════ */}
      <section
        style={{
          padding: "80px 24px",
          background: "linear-gradient(135deg, #56364d 0%, #714b67 100%)",
        }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "rgba(255,255,255,0.9)",
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: "0.857rem",
                fontWeight: 600,
              }}>
              HOW IT WORKS
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 800,
                color: "#fff",
                marginTop: 12,
                marginBottom: 12,
              }}>
              Your Learning Journey
            </h2>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "1.071rem" }}>
              Four simple steps to transform your skills
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 32,
              position: "relative",
            }}>
            {STEPS.map((s, i) => (
              <div
                key={s.n}
                style={{ textAlign: "center", position: "relative" }}>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      position: "absolute",
                      top: 28,
                      left: "calc(50% + 36px)",
                      width: "calc(100% - 72px)",
                      height: 2,
                      background:
                        "linear-gradient(90deg, rgba(240,173,78,0.5), rgba(240,173,78,0.1))",
                      display: "none",
                    }}
                    className="step-connector"
                  />
                )}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.15)",
                    border: "2px solid rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}>
                  <i
                    className={`fas ${s.icon}`}
                    style={{ fontSize: "1.286rem", color: "#fff" }}
                  />
                </div>
                <div
                  style={{
                    fontSize: "0.786rem",
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.5)",
                    letterSpacing: "0.1em",
                    marginBottom: 6,
                  }}>
                  STEP {s.n}
                </div>
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "1.071rem",
                    color: "#fff",
                    marginBottom: 8,
                  }}>
                  {s.title}
                </h3>
                <p
                  style={{
                    color: "rgba(255,255,255,0.55)",
                    fontSize: "0.857rem",
                    lineHeight: 1.6,
                  }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 56 }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#714b67",
                padding: "14px 36px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "1.071rem",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}>
              <i className="fas fa-rocket" /> Get Started — It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px", background: "#f8f9fa" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span
              style={{
                background: "#f3eef1",
                color: "#714b67",
                borderRadius: 20,
                padding: "4px 14px",
                fontSize: "0.857rem",
                fontWeight: 600,
              }}>
              TESTIMONIALS
            </span>
            <h2
              style={{
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                fontWeight: 800,
                color: "#1a0a14",
                marginTop: 12,
              }}>
              What Our Learners Say
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}>
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: "28px 24px",
                  border: "1px solid #dee2e6",
                  position: "relative",
                }}>
                <i
                  className="fas fa-quote-left"
                  style={{
                    fontSize: "1.714rem",
                    color: "#f3eef1",
                    position: "absolute",
                    top: 20,
                    right: 20,
                  }}
                />
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <i
                      key={s}
                      className="fas fa-star"
                      style={{ color: "#f0ad4e", fontSize: "0.857rem" }}
                    />
                  ))}
                </div>
                <p
                  style={{
                    color: "#495057",
                    fontSize: "0.929rem",
                    lineHeight: 1.7,
                    marginBottom: 20,
                    fontStyle: "italic",
                  }}>
                  "{t.text}"
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: "50%",
                      background: t.color,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: "0.857rem",
                      flexShrink: 0,
                    }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: "0.929rem",
                        color: "#1a0a14",
                      }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "0.786rem", color: "#6c757d" }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════ */}
      <section
        style={{
          background: "linear-gradient(135deg, #714b67 0%, #56364d 100%)",
          padding: "72px 24px",
          textAlign: "center",
        }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: 16 }}>🎓</div>
          <h2
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
              fontWeight: 800,
              color: "#fff",
              marginBottom: 16,
            }}>
            Ready to Start Your Journey?
          </h2>
          <p
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: "1.071rem",
              marginBottom: 36,
              lineHeight: 1.6,
            }}>
            Join thousands of learners who are already building real skills on
            Learnova. Sign up today — completely free.
          </p>
          <div
            style={{
              display: "flex",
              gap: 14,
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            <Link
              to="/signup"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                color: "#714b67",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 700,
                fontSize: "1.071rem",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-2px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }>
              <i className="fas fa-user-plus" /> Create Free Account
            </Link>
            <Link
              to="/courses"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "2px solid rgba(255,255,255,0.5)",
                color: "#fff",
                padding: "14px 32px",
                borderRadius: 8,
                fontWeight: 600,
                fontSize: "1.071rem",
                textDecoration: "none",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.9)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)")
              }>
              <i className="fas fa-book-open" /> Explore Courses
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
