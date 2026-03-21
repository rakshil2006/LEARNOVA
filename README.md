# Learnova — eLearning Platform

## Quick Start

### 1. Database Setup (PgAdmin)

1. Open PgAdmin 4, right-click `Databases` → `Create` → `Database`, name it `learnova`
2. Select the `learnova` database → open `Query Tool`
3. Paste the contents of `server/migrations/001_initial_schema.sql` and run (F5)

### 2. Run Backend

```bash
cd server
npm install
npm run dev   # runs on port 5000
```

### 3. Run Frontend

```bash
cd client
npm install
npm run dev   # runs on port 5173
```

### 4. Seed Test Users (run in PgAdmin Query Tool)

```sql
-- password for all: Admin@1234
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@learnova.com', '$2b$12$LQv3c1yqBwEHF.a9UX5VsOjGFgH5g1b9Jq3pQwEiD7nW4Rk2mLKa2', 'admin'),
  ('Test Instructor', 'instructor@learnova.com', '$2b$12$LQv3c1yqBwEHF.a9UX5VsOjGFgH5g1b9Jq3pQwEiD7nW4Rk2mLKa2', 'instructor'),
  ('Test Learner', 'learner@learnova.com', '$2b$12$LQv3c1yqBwEHF.a9UX5VsOjGFgH5g1b9Jq3pQwEiD7nW4Rk2mLKa2', 'learner');
```

## Routes

| URL                                    | Description                        |
| -------------------------------------- | ---------------------------------- |
| `/`                                    | Landing page                       |
| `/login`                               | Login                              |
| `/signup`                              | Register                           |
| `/courses`                             | Learner course catalog             |
| `/courses/:id`                         | Course detail                      |
| `/courses/:courseId/lessons/:lessonId` | Lesson player                      |
| `/admin/dashboard`                     | Admin/Instructor course management |
| `/admin/courses/:id/edit`              | Course form                        |
| `/admin/reporting`                     | Reporting                          |

## Tech Stack

- **Frontend**: React 18 + Vite + React Router v6 + Axios
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (via `pg` pool)
- **Auth**: JWT (access + refresh tokens)
- **Styling**: Plain CSS + CSS Variables (Odoo design system)
- **File Upload**: Multer (local disk)
