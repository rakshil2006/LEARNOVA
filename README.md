# Learnova — eLearning Platform

A full-stack eLearning platform built with React 18 + Vite (frontend) and Node.js/Express (backend) with PostgreSQL.

---

## Tech Stack

| Layer       | Technology                                                    |
| ----------- | ------------------------------------------------------------- |
| Frontend    | React 18, Vite, React Router v6, Axios                        |
| Backend     | Node.js, Express.js, express-rate-limit                       |
| Database    | PostgreSQL (via `pg` pool)                                    |
| Auth        | JWT (access token 15m + refresh token 7d via httpOnly cookie) |
| Security    | helmet, cors, bcrypt (cost 12)                                |
| File Upload | Multer (local disk → `/uploads`)                              |
| Styling     | Plain CSS + CSS Variables (Odoo design system)                |

---

## Quick Start

### 1. Database Setup

Open pgAdmin 4 → right-click `Databases` → `Create` → name it `learnova`.

Open the Query Tool on the `learnova` database and run:

```
server/migrations/001_initial_schema.sql
```

### 2. Backend

```bash
cd server
npm install
# configure server/.env (see below)
node server.js        # runs on port 5000
```

**`server/.env`**

```env
PORT=5000
DATABASE_URL=postgresql://postgres:<password>@localhost:5432/learnova
JWT_SECRET=<random-secret>
JWT_REFRESH_SECRET=<random-refresh-secret>
NODE_ENV=development
FRONTEND_URL=http://localhost:5174
```

### 3. Frontend

```bash
cd client
npm install
# configure client/.env (see below)
npm run dev           # runs on port 5174
```

**`client/.env`**

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

### 4. Seed Demo Data

Run the generator then apply the SQL:

```bash
# From workspace root
node gen_seed.js

# Apply to DB (PowerShell)
$env:PGPASSWORD='<password>'
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -U postgres -d learnova -f seed_demo.sql
```

**Seed credentials (all 50 users):**

- Password: `Test@1234`
- Security answer: `test`

**Demo accounts:**

| Role       | Email              | Password  |
| ---------- | ------------------ | --------- |
| Admin      | admin@learnova.com | Test@1234 |
| Instructor | arjun@learnova.com | Test@1234 |
| Learner    | learner1@gmail.com | Test@1234 |

---

## Routes

### Public

| URL            | Description                       |
| -------------- | --------------------------------- |
| `/`            | Landing page                      |
| `/login`       | Login                             |
| `/signup`      | Register (with security question) |
| `/courses`     | Course catalog                    |
| `/courses/:id` | Course detail + reviews           |

### Learner (requires login)

| URL                                    | Description                          |
| -------------------------------------- | ------------------------------------ |
| `/courses/:courseId/lessons/:lessonId` | Lesson player (video/doc/image/quiz) |

### Admin / Instructor

| URL                       | Description                               |
| ------------------------- | ----------------------------------------- |
| `/admin/dashboard`        | Course management (kanban + list view)    |
| `/admin/courses/:id/edit` | Course editor (content, options, quizzes) |
| `/admin/reporting`        | Enrollment & completion reporting         |
| `/admin/settings`         | User management (admin only)              |

---

## API Endpoints

### Auth — `/api/auth`

| Method | Path                        | Description                               |
| ------ | --------------------------- | ----------------------------------------- |
| POST   | `/register`                 | Register with security question           |
| POST   | `/login`                    | Login → returns JWT + sets refresh cookie |
| POST   | `/logout`                   | Clear refresh cookie                      |
| POST   | `/refresh`                  | Rotate access token                       |
| GET    | `/me`                       | Get current user                          |
| POST   | `/forgot-password/question` | Get security question by email            |
| POST   | `/forgot-password/reset`    | Reset password via security answer        |

### Courses — `/api/courses`

| Method | Path             | Description                                    |
| ------ | ---------------- | ---------------------------------------------- |
| GET    | `/public`        | Public course listing (with enrollment status) |
| GET    | `/public/:id`    | Course detail with lessons + reviews           |
| GET    | `/`              | Admin course list                              |
| POST   | `/`              | Create course                                  |
| PUT    | `/:id`           | Update course                                  |
| DELETE | `/:id`           | Delete course                                  |
| POST   | `/:id/publish`   | Toggle publish                                 |
| POST   | `/:id/cover`     | Upload cover image                             |
| POST   | `/:id/enroll`    | Enroll learner                                 |
| POST   | `/:id/purchase`  | Purchase course                                |
| GET    | `/:id/attendees` | List enrolled users                            |
| POST   | `/:id/attendees` | Bulk add attendees by email                    |

### Progress — `/api/progress`

| Method | Path                          | Description                                      |
| ------ | ----------------------------- | ------------------------------------------------ |
| PUT    | `/lessons/:lessonId`          | Update lesson progress + time spent              |
| POST   | `/quizzes/:quizId/attempt`    | Submit quiz attempt (auto-scores, awards points) |
| GET    | `/courses/:courseId`          | Get course progress                              |
| POST   | `/courses/:courseId/complete` | Mark course completed                            |

### Other

- `GET /api/reporting` — Enrollment report with pagination, search, status filter
- `GET /api/learner/recommendations` — Smart practice recommendations (weak areas)
- `GET /api/users` — User list (admin)
- `PUT /api/users/:id` — Update user role/name (admin)

---

## Features

- **Role-based access**: admin, instructor, learner
- **Course types**: open, invitation-only, paid
- **Lesson types**: video (YouTube embed), document (PDF), image, quiz
- **Quiz engine**: multi-attempt, auto-scoring, points/badges reward system
- **Smart recommendations**: surfaces quizzes where learner scored < 60% or attempted 2+ times
- **Progress tracking**: per-lesson status, time spent, course completion %
- **Forgot password**: 3-step security question flow (no email required)
- **Reporting**: paginated enrollment table with sort, filter, column customizer
- **Admin dashboard**: kanban + list view, share links, attendee management

---

## Project Structure

```
learnova/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios API modules
│   │   ├── components/      # Reusable UI components
│   │   │   ├── admin/       # LessonEditorModal, QuizBuilderModal
│   │   │   └── common/      # Navbar, Modal, Toast, etc.
│   │   ├── context/         # AuthContext, NotificationContext
│   │   ├── hooks/           # useAuth, useToast, useDebounce, useRecommendations
│   │   ├── pages/
│   │   │   ├── admin/       # Dashboard, CourseForm, Reporting, Settings
│   │   │   ├── learner/     # Courses, CourseDetail, LessonPlayer
│   │   │   └── public/      # Landing, Login, Signup
│   │   ├── routes/          # AppRouter, ProtectedRoute, RoleRoute
│   │   ├── styles/          # global.css, variables.css
│   │   └── utils/           # formatters, validators, constants
│   └── .env
└── server/                  # Node.js + Express backend
    ├── migrations/          # 001_initial_schema.sql
    ├── src/
    │   ├── config/          # db.js, multer.js
    │   ├── controllers/     # auth, course, lesson, quiz, progress, ...
    │   ├── middleware/       # authMiddleware, roleMiddleware, errorHandler
    │   └── routes/          # All route definitions
    ├── uploads/             # Uploaded files (gitignored in production)
    └── .env
```
