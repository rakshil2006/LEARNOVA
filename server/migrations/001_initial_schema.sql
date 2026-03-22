CREATE TABLE IF NOT EXISTS users (
  id             SERIAL        PRIMARY KEY,
  name           VARCHAR(150)  NOT NULL,
  email          VARCHAR(255)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  role           VARCHAR(20)   NOT NULL CHECK (role IN ('admin', 'instructor', 'learner')),
  avatar_url     TEXT,
  total_points   INTEGER       NOT NULL DEFAULT 0 CHECK (total_points >= 0),
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role  ON users (role);


CREATE TABLE IF NOT EXISTS courses (
  id                SERIAL         PRIMARY KEY,
  title             VARCHAR(255)   NOT NULL,
  tags              TEXT[]         DEFAULT '{}',
  website_slug      VARCHAR(255),
  cover_image_url   TEXT,
  short_description TEXT,
  description       TEXT,
  is_published      BOOLEAN        NOT NULL DEFAULT FALSE,
  visibility        VARCHAR(20)    NOT NULL DEFAULT 'everyone' CHECK (visibility IN ('everyone', 'signed_in')),
  access_rule       VARCHAR(20)    NOT NULL DEFAULT 'open' CHECK (access_rule IN ('open', 'invitation', 'payment')),
  price             NUMERIC(10,2)  CHECK (price IS NULL OR price >= 0),
  views_count       INTEGER        NOT NULL DEFAULT 0 CHECK (views_count >= 0),
  created_by        INTEGER        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  course_admin_id   INTEGER        REFERENCES users (id) ON DELETE SET NULL,
  created_at        TIMESTAMP      NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMP      NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_courses_slug UNIQUE (website_slug),
  CONSTRAINT chk_payment_has_price CHECK (access_rule != 'payment' OR price IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_courses_created_by      ON courses (created_by);
CREATE INDEX IF NOT EXISTS idx_courses_course_admin_id ON courses (course_admin_id);
CREATE INDEX IF NOT EXISTS idx_courses_is_published    ON courses (is_published);


CREATE TABLE IF NOT EXISTS lessons (
  id               SERIAL       PRIMARY KEY,
  course_id        INTEGER      NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  responsible_id   INTEGER      REFERENCES users (id) ON DELETE SET NULL,
  title            VARCHAR(255) NOT NULL,
  type             VARCHAR(20)  NOT NULL CHECK (type IN ('video', 'document', 'image', 'quiz')),
  description      TEXT,
  video_url        TEXT,
  duration_seconds INTEGER      CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  file_url         TEXT,
  allow_download   BOOLEAN      NOT NULL DEFAULT FALSE,
  position         INTEGER      NOT NULL DEFAULT 0 CHECK (position >= 0),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lessons_course_id ON lessons (course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_position  ON lessons (course_id, position);


CREATE TABLE IF NOT EXISTS lesson_attachments (
  id         SERIAL      PRIMARY KEY,
  lesson_id  INTEGER     NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  type       VARCHAR(10) NOT NULL CHECK (type IN ('file', 'link')),
  label      VARCHAR(255),
  url        TEXT        NOT NULL,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON lesson_attachments (lesson_id);


CREATE TABLE IF NOT EXISTS quizzes (
  id         SERIAL       PRIMARY KEY,
  course_id  INTEGER      NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id  INTEGER      NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_quizzes_lesson_id UNIQUE (lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_quizzes_course_id ON quizzes (course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_lesson_id ON quizzes (lesson_id);


CREATE TABLE IF NOT EXISTS quiz_questions (
  id            SERIAL    PRIMARY KEY,
  quiz_id       INTEGER   NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  question_text TEXT      NOT NULL,
  position      INTEGER   NOT NULL DEFAULT 0 CHECK (position >= 0)
);

CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions (quiz_id);


CREATE TABLE IF NOT EXISTS quiz_options (
  id          SERIAL   PRIMARY KEY,
  question_id INTEGER  NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  option_text TEXT     NOT NULL,
  is_correct  BOOLEAN  NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options (question_id);


CREATE TABLE IF NOT EXISTS quiz_rewards (
  id             SERIAL  PRIMARY KEY,
  quiz_id        INTEGER NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 0),
  points         INTEGER NOT NULL CHECK (points >= 0),
  CONSTRAINT uq_quiz_rewards_attempt UNIQUE (quiz_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS idx_quiz_rewards_quiz_id ON quiz_rewards (quiz_id);


CREATE TABLE IF NOT EXISTS enrollments (
  id           SERIAL      PRIMARY KEY,
  user_id      INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id    INTEGER     NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status       VARCHAR(20) NOT NULL DEFAULT 'yet_to_start' CHECK (status IN ('yet_to_start', 'in_progress', 'completed')),
  enrolled_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
  started_at   TIMESTAMP,
  completed_at TIMESTAMP,
  CONSTRAINT uq_enrollments_user_course UNIQUE (user_id, course_id),
  CONSTRAINT chk_enrollment_completed_at CHECK (status != 'completed' OR completed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id   ON enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments (course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status    ON enrollments (status);


CREATE TABLE IF NOT EXISTS lesson_progress (
  id                 SERIAL      PRIMARY KEY,
  user_id            INTEGER     NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  lesson_id          INTEGER     NOT NULL REFERENCES lessons (id) ON DELETE CASCADE,
  course_id          INTEGER     NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  status             VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  time_spent_seconds INTEGER     NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  completed_at       TIMESTAMP,
  CONSTRAINT uq_lesson_progress_user_lesson UNIQUE (user_id, lesson_id),
  CONSTRAINT chk_progress_completed_at CHECK (status != 'completed' OR completed_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id     ON lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id   ON lesson_progress (lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_course_id   ON lesson_progress (course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_course ON lesson_progress (user_id, course_id);


CREATE TABLE IF NOT EXISTS quiz_attempts (
  id             SERIAL    PRIMARY KEY,
  user_id        INTEGER   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quiz_id        INTEGER   NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  attempt_number INTEGER   NOT NULL CHECK (attempt_number >= 1),
  points_earned  INTEGER   NOT NULL DEFAULT 0 CHECK (points_earned >= 0),
  completed_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id   ON quiz_attempts (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id   ON quiz_attempts (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON quiz_attempts (user_id, quiz_id);


CREATE TABLE IF NOT EXISTS quiz_attempt_answers (
  id                 SERIAL  PRIMARY KEY,
  attempt_id         INTEGER NOT NULL REFERENCES quiz_attempts (id) ON DELETE CASCADE,
  question_id        INTEGER NOT NULL REFERENCES quiz_questions (id) ON DELETE CASCADE,
  selected_option_id INTEGER NOT NULL REFERENCES quiz_options (id) ON DELETE CASCADE,
  CONSTRAINT uq_attempt_answer UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_attempt_answers_attempt_id  ON quiz_attempt_answers (attempt_id);
CREATE INDEX IF NOT EXISTS idx_attempt_answers_question_id ON quiz_attempt_answers (question_id);


CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL    PRIMARY KEY,
  user_id     INTEGER   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id   INTEGER   NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  rating      INTEGER   NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_reviews_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_course_id ON reviews (course_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id   ON reviews (user_id);


CREATE TABLE IF NOT EXISTS purchases (
  id           SERIAL        PRIMARY KEY,
  user_id      INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id    INTEGER       NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  amount_paid  NUMERIC(10,2) NOT NULL CHECK (amount_paid >= 0),
  purchased_at TIMESTAMP     NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_purchases_user_course UNIQUE (user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_purchases_user_id   ON purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_course_id ON purchases (course_id);

CREATE TABLE IF NOT EXISTS quiz_weak_areas (
  id             SERIAL        PRIMARY KEY,
  user_id        INTEGER       NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  quiz_id        INTEGER       NOT NULL REFERENCES quizzes (id) ON DELETE CASCADE,
  course_id      INTEGER       NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  total_attempts INTEGER       NOT NULL DEFAULT 1,
  avg_score_pct  NUMERIC(5,2)  NOT NULL DEFAULT 0,
  last_attempted TIMESTAMP     NOT NULL DEFAULT NOW(),
  is_weak        BOOLEAN       NOT NULL DEFAULT FALSE,
  CONSTRAINT uq_quiz_weak_areas_user_quiz UNIQUE (user_id, quiz_id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_weak_areas_user_id   ON quiz_weak_areas (user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_weak_areas_quiz_id   ON quiz_weak_areas (quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_weak_areas_course_id ON quiz_weak_areas (course_id);
