import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getPublicStats } from "../../api/courseApi";

export default function LandingPage() {
  const [stats, setStats] = useState({
    total_courses: 0,
    total_learners: 0,
    lessons_published: 0,
  });

  useEffect(() => {
    getPublicStats()
      .then((r) => setStats(r.data))
      .catch(() => {});
  }, []);

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Navbar variant="public" />

      {/* Hero */}
      <section
        style={{
          background:
            "linear-gradient(135deg, var(--o-primary-subtle) 0%, var(--o-info-light) 100%)",
          padding: "80px 24px",
          textAlign: "center",
        }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "2.286rem",
              fontWeight: 700,
              color: "var(--o-primary)",
              marginBottom: 16,
            }}>
            Learn Anything. Grow Everywhere.
          </h1>
          <p
            style={{
              fontSize: "1.143rem",
              color: "var(--o-text-secondary)",
              marginBottom: 32,
              lineHeight: 1.6,
            }}>
            Learnova is your all-in-one eLearning platform. Explore courses,
            earn badges, and track your progress — all in one place.
          </p>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            <Link to="/courses" className="btn btn-primary btn-lg">
              <i className="fas fa-book-open" /> Browse Courses
            </Link>
            <Link to="/signup" className="btn btn-secondary btn-lg">
              <i className="fas fa-user-plus" /> Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          background: "var(--o-primary)",
          padding: "24px",
          display: "flex",
          justifyContent: "center",
          gap: 48,
          flexWrap: "wrap",
        }}>
        {[
          {
            label: "Courses",
            value: stats.total_courses,
            icon: "fa-book-open",
          },
          { label: "Learners", value: stats.total_learners, icon: "fa-users" },
          {
            label: "Lessons",
            value: stats.lessons_published,
            icon: "fa-play-circle",
          },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: "center", color: "#fff" }}>
            <i
              className={`fas ${s.icon}`}
              style={{ fontSize: "1.5rem", marginBottom: 4 }}
            />
            <div style={{ fontSize: "1.714rem", fontWeight: 700 }}>
              {s.value}
            </div>
            <div style={{ fontSize: "0.857rem", opacity: 0.85 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section style={{ padding: "64px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", marginBottom: 40 }}>
            Everything You Need to Learn
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 24,
            }}>
            {[
              {
                icon: "fa-book-open",
                title: "Rich Course Content",
                desc: "Videos, documents, images, and interactive quizzes — all in one place.",
              },
              {
                icon: "fa-trophy",
                title: "Earn Points & Badges",
                desc: "Complete quizzes and courses to earn points and unlock achievement badges.",
              },
              {
                icon: "fa-chart-bar",
                title: "Track Your Progress",
                desc: "See exactly where you are in every course with detailed progress tracking.",
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  textAlign: "center",
                  padding: 24,
                  border: "1px solid var(--o-border)",
                  borderRadius: "var(--o-radius-lg)",
                }}>
                <i
                  className={`fas ${f.icon}`}
                  style={{
                    fontSize: "2rem",
                    color: "var(--o-primary)",
                    marginBottom: 12,
                  }}
                />
                <h3 style={{ marginBottom: 8 }}>{f.title}</h3>
                <p
                  style={{
                    color: "var(--o-text-secondary)",
                    fontSize: "0.929rem",
                  }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "64px 24px", background: "var(--o-bg-body)" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ marginBottom: 40 }}>How It Works</h2>
          <div
            style={{
              display: "flex",
              gap: 24,
              justifyContent: "center",
              flexWrap: "wrap",
            }}>
            {[
              {
                step: "1",
                icon: "fa-search",
                title: "Browse",
                desc: "Explore our catalog of courses across all topics.",
              },
              {
                step: "2",
                icon: "fa-user-check",
                title: "Enroll",
                desc: "Join a course for free or purchase premium content.",
              },
              {
                step: "3",
                icon: "fa-star",
                title: "Learn & Earn",
                desc: "Complete lessons, take quizzes, and earn badges.",
              },
            ].map((s) => (
              <div key={s.step} style={{ flex: 1, minWidth: 200, padding: 24 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "var(--o-primary)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 12px",
                    fontSize: "1.286rem",
                    fontWeight: 700,
                  }}>
                  {s.step}
                </div>
                <i
                  className={`fas ${s.icon}`}
                  style={{
                    fontSize: "1.5rem",
                    color: "var(--o-primary)",
                    marginBottom: 8,
                  }}
                />
                <h3 style={{ marginBottom: 6 }}>{s.title}</h3>
                <p
                  style={{
                    color: "var(--o-text-secondary)",
                    fontSize: "0.929rem",
                  }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
