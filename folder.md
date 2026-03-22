# Learnova — Folder Structure

```
learnova/
├── client/                          # React + Vite frontend
│   ├── public/
│   ├── src/
│   │   ├── api/                     # Axios API layer (one file per domain)
│   │   │   ├── axiosInstance.js     # Axios base instance + JWT interceptor + refresh logic
│   │   │   ├── authApi.js           # register, login, logout, refresh, getMe
│   │   │   ├── courseApi.js         # Admin + public course endpoints, reviews, purchase
│   │   │   ├── lessonApi.js         # CRUD lessons, file upload, attachments, reorder
│   │   │   ├── progressApi.js       # updateLessonProgress, submitQuizAttempt, completeCourse
│   │   │   ├── quizApi.js           # CRUD quizzes, questions, options, rewards
│   │   │   ├── recommendationsApi.js# GET /api/learner/recommendations
│   │   │   ├── reportApi.js         # GET /api/reporting
│   │   │   └── userApi.js           # getUsers (admin)
│   │   │
│   │   ├── components/
│   │   │   ├── admin/               # Admin-specific reusable components
│   │   │   │   ├── LessonEditorModal.jsx  # Create/edit lesson with YT duration detection
│   │   │   │   └── QuizBuilderModal.jsx   # Quiz question builder + rewards config
│   │   │   │
│   │   │   ├── common/              # Shared UI components
│   │   │   │   ├── Badge.jsx        # Gamification badge display
│   │   │   │   ├── ConfirmDialog.jsx# Reusable confirm/cancel modal
│   │   │   │   ├── Footer.jsx       # Public footer
│   │   │   │   ├── Modal.jsx        # Base modal wrapper
│   │   │   │   ├── Navbar.jsx       # Topbar (public / admin variants)
│   │   │   │   ├── ProgressBar.jsx  # Reusable progress bar
│   │   │   │   ├── SearchBar.jsx    # Debounced search input
│   │   │   │   ├── StarRating.jsx   # Star rating display/input
│   │   │   │   └── Toast.jsx        # Toast notification renderer
│   │   │   │
│   │   │   └── learner/             # (reserved for learner-specific components)
│   │   │
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # user, token, login(), logout(), loading state
│   │   │   └── NotificationContext.jsx  # toast.success/error/info/warning (memoized)
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js           # Consumes AuthContext
│   │   │   ├── useDebounce.js       # Generic debounce hook (300ms default)
│   │   │   ├── useRecommendations.js# Fetches smart practice recommendations once on mount
│   │   │   └── useToast.js          # Consumes NotificationContext
│   │   │
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── CourseFormPage.jsx   # Course editor (content/description/options/quiz tabs)
│   │   │   │   ├── DashboardPage.jsx    # Kanban + list view of all courses
│   │   │   │   ├── ReportingPage.jsx    # Enrollment report table with pagination + filters
│   │   │   │   └── SettingsPage.jsx     # User management (admin only)
│   │   │   │
│   │   │   ├── learner/
│   │   │   │   ├── CourseDetailPage.jsx # Course overview, enroll/purchase, reviews
│   │   │   │   ├── CoursesPage.jsx      # Course catalog + smart recommendations section
│   │   │   │   └── LessonPlayerPage.jsx # Video/doc/image/quiz lesson player + progress tracking
│   │   │   │
│   │   │   └── public/
│   │   │       ├── LandingPage.jsx  # Marketing landing page with live stats + featured courses
│   │   │       ├── LoginPage.jsx    # Login form with JWT auth
│   │   │       └── SignupPage.jsx   # Registration form (learner / instructor)
│   │   │
│   │   ├── routes/
│   │   │   ├── AppRouter.jsx        # All routes with React.lazy + Suspense
│   │   │   ├── ProtectedRoute.jsx   # Redirects unauthenticated users to /login
│   │   │   └── RoleRoute.jsx        # Redirects users without required role
│   │   │
│   │   ├── styles/
│   │   │   ├── global.css           # All component styles, Odoo design system classes
│   │   │   └── variables.css        # CSS custom properties (colors, spacing, shadows)
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.js         # App-wide constants (badge levels, etc.)
│   │   │   ├── formatters.js        # formatDuration, formatDate, getInitials, resolveMediaUrl
│   │   │   └── validators.js        # validateEmail, validatePassword, validateName
│   │   │
│   │   ├── App.jsx                  # Root component (BrowserRouter + providers)
│   │   └── main.jsx                 # ReactDOM.createRoot entry point
│   │
│   ├── index.html
│   ├── vite.config.js               # Vite config, port 5174, /api + /uploads proxy
│   └── package.json
│
├── server/                          # Node.js + Express backend
│   ├── migrations/
│   │   └── 001_initial_schema.sql   # Full PostgreSQL schema (all tables + constraints)
│   │
│   ├── uploads/                     # Multer file storage (images, PDFs)
│   │
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                # pg Pool connection
│   │   │   └── multer.js            # File upload config (MIME validation, 10MB limit)
│   │   │
│   │   ├── controllers/             # Business logic, one file per domain
│   │   │   ├── authController.js    # register, login, logout, refresh, me
│   │   │   ├── courseController.js  # CRUD courses, publish, cover, attendees, public endpoints
│   │   │   ├── lessonController.js  # CRUD lessons, file upload, attachments, reorder
│   │   │   ├── progressController.js# updateLessonProgress, submitQuizAttempt, completeCourse
│   │   │   ├── purchaseController.js# Purchase flow with BEGIN/COMMIT/ROLLBACK transaction
│   │   │   ├── quizController.js    # CRUD quizzes, questions (bulk insert), rewards (transaction)
│   │   │   ├── recommendationController.js  # Smart practice recommendations query
│   │   │   ├── reportController.js  # Enrollment report with pagination
│   │   │   ├── reviewController.js  # Course reviews CRUD
│   │   │   └── userController.js    # User management (admin)
│   │   │
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js    # JWT verify (authMiddleware + optionalAuth)
│   │   │   ├── errorHandler.js      # Centralized error handler
│   │   │   ├── roleMiddleware.js    # Role-based access control
│   │   │   └── validateMiddleware.js# Request body validation
│   │   │
│   │   ├── models/                  # (reserved — SQL is in controllers at current scale)
│   │   │
│   │   ├── routes/                  # Express routers, one file per domain
│   │   │   ├── authRoutes.js        # /api/auth — rate limited login + register
│   │   │   ├── courseRoutes.js      # /api/courses + /api/public/courses
│   │   │   ├── lessonRoutes.js      # /api/courses/:courseId/lessons
│   │   │   ├── progressRoutes.js    # /api/progress
│   │   │   ├── purchaseRoutes.js    # /api/courses/:courseId/purchase
│   │   │   ├── quizRoutes.js        # /api/courses/:courseId/quizzes
│   │   │   ├── recommendationRoutes.js  # /api/learner/recommendations
│   │   │   ├── reportRoutes.js      # /api/reporting
│   │   │   ├── reviewRoutes.js      # /api/courses/:courseId/reviews
│   │   │   └── userRoutes.js        # /api/users
│   │   │
│   │   ├── validators/              # (reserved — validation inline in controllers)
│   │   │
│   │   └── app.js                   # Express app setup (Helmet, CORS, routes, errorHandler)
│   │
│   ├── server.js                    # HTTP server entry point
│   └── package.json
│
├── seed_demo.sql                    # Generated demo seed (50 users, 50 courses, 1000 lessons, full quiz/progress data)
├── gen_seed.js                      # Node.js seed generator script (run: node gen_seed.js)
└── folder.md                        # This file
```

## Key Design Decisions

- Frontend runs on port **5174**, backend on **5000**
- Vite proxies `/api` and `/uploads` to `localhost:5000` — no CORS issues in dev
- All API calls go through `api/` layer — zero direct axios in components
- JWT access token (15m) + httpOnly refresh cookie (7d) with silent refresh via axios interceptor
- All SQL uses parameterized queries (`$1, $2`) — no string concatenation
- `recalculateCourseStatus()` runs after every `lesson_progress` update
- Quiz weak area upsert is non-blocking (wrapped in its own try/catch)
- `React.lazy` + `Suspense` applied to all routes for code splitting
- Odoo design system: `--o-primary: #714B67`, Roboto 14px, 46px topbar
