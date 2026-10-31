# CodeAssess AI

CodeAssess AI is a full-stack technical assessment and deliberate practice platform designed for students, beginners, job seekers, and software engineers. Users configure a target subject, programming language, calibrated skill tier, question format, duration, and focus subtopics, after which the backend AI engine generates and schema-validates a structured coding and technical assessment.

---

## 1. Project Overview

CodeAssess AI supports the full assessment lifecycle:

1. Select from 16 technical, web, computer science, data, and analytical subjects.
2. Specify a target programming language when applicable to the selected subject.
3. Choose a calibrated skill tier across 7 progressive levels (Absolute Beginner to Expert).
4. Configure format (Multiple Choice, Coding, Debugging, Conceptual, or Mixed), question count, duration, negative marking, timer enforcement, hints, explanations, and focus topics.
5. Generate original questions through a server-side LLM integration with JSON schema validation and automatic corrective retry.
6. Attempt the assessment in a distraction-free workspace with persistent local progress, review flags, countdown timer, and a CodeMirror 6 editor.
7. Submit responses for automated grading across question formats.
8. Inspect granular results, topic-wise and difficulty-wise breakdowns, and question-by-question explanations.
9. Track historical attempts, subject mastery, skill tier progression, and personalized next-assessment recommendations in an authenticated candidate dashboard.

---

## 2. Features

- **16 Curriculum Subjects**: Programming Fundamentals, JavaScript, React, HTML, CSS, Python, Java, C, C++, Data Structures and Algorithms, SQL, Full Stack Development, Computer Science Fundamentals, English Grammar, Quantitative Aptitude, and Logical Reasoning.
- **7-Tier Skill Calibration**: Explicit rubric definitions from Absolute Beginner (L1) through Expert (L7).
- **Multi-Format Question Support**:
  - **Multiple Choice Questions**: Four distinct options (`A`-`D`), optional negative marking (`-25%`), and detailed explanations.
  - **Coding Questions**: Problem specification, input/output formats, constraints, sample I/O, starter code, CodeMirror syntax editor with plain-text fallback, and optional external sandboxed execution.
  - **Debugging Questions**: Defective code snippet, expected behavior, interactive fix editor, and root-cause explanation review.
  - **Conceptual Questions**: Structured written responses evaluated against expected technical key points.
  - **Mixed Assessments**: Balanced combination of supported formats for the chosen subject.
- **Persistent Test-Taking Workspace**: Answers, code drafts, flagged review states, active question index, and countdown deadlines persist across browser refreshes.
- **Guest & Authenticated Modes**: Unauthenticated users can generate, attempt, submit, and review assessments in Guest Mode; registered users unlock persistent history and progression analytics.
- **Transparent Evaluation & Honesty**:
  - Correct answers, reference solutions, and hidden test cases are stripped from active test payloads and exposed only after submission.
  - AI generation never falls back to silent fake questions; missing credentials or upstream errors surface actionable diagnostic notices.
  - Untrusted candidate code is never executed on the Express server; coding execution runs only when an external sandboxed execution endpoint (`CODE_EXECUTION_URL`) is configured.

---

## 3. Technology Stack

### Frontend (`client/`)
- **React 18** (JavaScript / JSX)
- **Vite 6**
- **Tailwind CSS 3**
- **React Router 6** (`react-router-dom`)
- **Lucide React** (`lucide-react`)
- **CodeMirror 6** (`@uiw/react-codemirror` and language extensions for JavaScript/JSX, Python, Java, C/C++, SQL, HTML, and CSS)

### Backend (`server/`)
- **Node.js** (ES Modules, Node 18+)
- **Express.js 4**
- **MongoDB & Mongoose 8**
- **Authentication & Security**: `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `helmet`, `cors`, `express-rate-limit`
- **Testing**: Node built-in test runner (`node:test`) + `supertest`

---

## 4. Application Architecture

```text
+-------------------------------------------------------------------+
|                        React JSX Client (Vite)                    |
|  Pages -> Reusable UI / Assessment Components -> Hooks -> Context |
|                        Service Layer (/api/*)                     |
+---------------------------------+---------------------------------+
                                  | HTTP / JSON (Cookie + Bearer + Guest ID)
                                  v
+-------------------------------------------------------------------+
|                      Express REST API Server                      |
|  Rate Limiter -> Auth / Guest Session -> Input Validators         |
|  Controllers -> Assessment Generation Engine & Evaluation Service |
+----------------+------------------------+-------------------------+
                 |                        |
                 v                        v
   +---------------------------+   +--------------------------------+
   |  Mongoose Models & Store  |   | External Integrations          |
   |  - User                   |   | - LLM API (OpenAI / Gemini /   |
   |  - Assessment             |   |   Anthropic / Compatible)      |
   |  - AssessmentAttempt      |   | - Optional Code Sandbox API    |
   +---------------------------+   +--------------------------------+
```

---

## 5. Project Folder Structure

```text
.
├── client/
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── assessment/
│       │   │   ├── AssessmentCard.jsx
│       │   │   ├── AssessmentTimer.jsx
│       │   │   ├── CodeEditor.jsx
│       │   │   ├── QuestionCard.jsx
│       │   │   └── QuestionNavigation.jsx
│       │   ├── dashboard/
│       │   │   └── AssessmentHistory.jsx
│       │   ├── layout/
│       │   │   ├── Footer.jsx
│       │   │   ├── Navbar.jsx
│       │   │   └── Sidebar.jsx
│       │   ├── results/
│       │   │   ├── ResultSummary.jsx
│       │   │   └── TopicPerformance.jsx
│       │   └── ui/
│       │       ├── Button.jsx
│       │       ├── Checkbox.jsx
│       │       ├── EmptyState.jsx
│       │       ├── ErrorState.jsx
│       │       ├── Input.jsx
│       │       ├── LoadingState.jsx
│       │       ├── Modal.jsx
│       │       ├── RadioGroup.jsx
│       │       └── Select.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   ├── useAssessmentProgress.js
│       │   ├── useAuth.js
│       │   └── useCountdownTimer.js
│       ├── layouts/
│       │   ├── AssessmentLayout.jsx
│       │   ├── DashboardLayout.jsx
│       │   └── MainLayout.jsx
│       ├── pages/
│       │   ├── AssessmentResultsPage.jsx
│       │   ├── AssessmentTestPage.jsx
│       │   ├── ConfigureAssessmentPage.jsx
│       │   ├── DashboardPage.jsx
│       │   ├── HistoryPage.jsx
│       │   ├── LandingPage.jsx
│       │   ├── LoginPage.jsx
│       │   ├── NotFoundPage.jsx
│       │   └── RegisterPage.jsx
│       ├── routes/
│       │   ├── AppRoutes.jsx
│       │   └── ProtectedRoute.jsx
│       ├── services/
│       │   ├── apiClient.js
│       │   ├── assessmentService.js
│       │   ├── authService.js
│       │   └── dashboardService.js
│       ├── utils/
│       │   ├── assessmentCatalog.js
│       │   ├── formatters.js
│       │   └── validation.js
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
├── server/
│   ├── package.json
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js
│   │   │   └── env.js
│   │   ├── controllers/
│   │   │   ├── assessmentController.js
│   │   │   ├── authController.js
│   │   │   └── dashboardController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorMiddleware.js
│   │   │   ├── rateLimitMiddleware.js
│   │   │   └── validateMiddleware.js
│   │   ├── models/
│   │   │   ├── Assessment.js
│   │   │   ├── AssessmentAttempt.js
│   │   │   └── User.js
│   │   ├── prompts/
│   │   │   └── assessmentPrompts.js
│   │   ├── routes/
│   │   │   ├── assessmentRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   └── dashboardRoutes.js
│   │   ├── services/
│   │   │   ├── aiService.js
│   │   │   ├── assessmentGenerationService.js
│   │   │   ├── codeExecutionService.js
│   │   │   ├── dashboardService.js
│   │   │   ├── evaluationService.js
│   │   │   └── repositoryService.js
│   │   ├── utils/
│   │   │   ├── AppError.js
│   │   │   ├── asyncHandler.js
│   │   │   ├── catalog.js
│   │   │   ├── guestSession.js
│   │   │   └── jsonParser.js
│   │   ├── validators/
│   │   │   ├── assessmentSchemaValidator.js
│   │   │   ├── assessmentValidators.js
│   │   │   └── authValidators.js
│   │   ├── app.js
│   │   └── server.js
│   └── tests/
│       └── api.test.js
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 6. Prerequisites

- **Node.js**: `v18.18.0` or newer (`v20+` or `v22+` recommended)
- **npm**: `v9.0.0` or newer
- **MongoDB**: Local MongoDB Community Server (`v6.0+`) or a MongoDB Atlas cluster URI
- **LLM API Key**: An API key from OpenAI, Google Gemini, Anthropic, or an OpenAI-compatible provider (Groq, OpenRouter, or local Ollama)

---

## 7. Installation Instructions

Clone the repository and install dependencies for both backend and frontend:

```bash
git clone <repository-url>
cd JustForStreak
npm run install:all
```

Alternatively, install each package individually:

```bash
cd server && npm install
cd ../client && npm install
```

---

## 8. Environment Configuration

Copy the root `.env.example` template to `server/.env`:

```bash
cp .env.example server/.env
```

Edit `server/.env` with your local configuration values:

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `NODE_ENV` | No | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | No | `5000` | Express server port |
| `HOST` | No | `0.0.0.0` | Express bind address |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Allowed CORS origin(s) in production (comma-separated) |
| `DB_MODE` | No | `mongodb` | `mongodb` for standard MongoDB connection; `local_json` for Mongoose-validated local file persistence when MongoDB is not installed |
| `MONGODB_URI` | Yes (when `DB_MODE=mongodb`) | `mongodb://127.0.0.1:27017/codeassess_ai` | MongoDB connection string |
| `JWT_SECRET` | Yes | Dev fallback | Secret key (32+ random characters) used to sign JWT tokens |
| `JWT_EXPIRES_IN` | No | `7d` | Token lifetime |
| `AI_PROVIDER` | Yes | `openai` | `openai`, `gemini`, `anthropic`, or `openai_compatible` |
| `AI_API_KEY` | Yes | *(empty)* | Server-side API key for the selected AI provider |
| `AI_MODEL` | No | Provider default | e.g., `gpt-4o-mini`, `gemini-2.0-flash`, `claude-3-5-sonnet-latest` |
| `AI_BASE_URL` | Conditional | Provider default | Required when `AI_PROVIDER=openai_compatible` |
| `CODE_EXECUTION_PROVIDER` | No | `piston` | `piston` or `judge0` |
| `CODE_EXECUTION_URL` | No | *(empty)* | Remote sandboxed execution API endpoint |
| `CODE_EXECUTION_API_KEY` | No | *(empty)* | Optional token for the remote code execution service |

---

## 9. MongoDB Setup

### Option A: Local MongoDB Daemon
1. Install and start MongoDB Community Edition (`mongod --dbpath /path/to/data`).
2. Keep `DB_MODE=mongodb` and `MONGODB_URI=mongodb://127.0.0.1:27017/codeassess_ai` in `server/.env`.

### Option B: MongoDB Atlas
1. Create a MongoDB Atlas cluster, database user, and IP access entry.
2. Set `DB_MODE=mongodb` and `MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/codeassess_ai` in `server/.env`.

### Option C: Local Development Without a MongoDB Daemon
If developing in a restricted container without `mongod`, set `DB_MODE=local_json` in `server/.env`. Every document is still validated through the Mongoose `User`, `Assessment`, and `AssessmentAttempt` schemas before persisting to `server/.cache/dev-database.json`.

---

## 10. AI Provider Configuration

Set the following variables in `server/.env` depending on your provider:

### OpenAI
```env
AI_PROVIDER=openai
AI_API_KEY=sk-...
AI_MODEL=gpt-4o-mini
```

### Google Gemini
```env
AI_PROVIDER=gemini
AI_API_KEY=AIza...
AI_MODEL=gemini-2.0-flash
```

### Anthropic
```env
AI_PROVIDER=anthropic
AI_API_KEY=sk-ant-...
AI_MODEL=claude-3-5-sonnet-latest
```

### Groq / OpenRouter / Ollama (`openai_compatible`)
```env
AI_PROVIDER=openai_compatible
AI_BASE_URL=https://api.groq.com/openai/v1/chat/completions
AI_API_KEY=gsk_...
AI_MODEL=llama-3.3-70b-versatile
```

---

## 11. Backend & Frontend Setup and Development Commands

### Start Backend Server (`http://localhost:5000`)
```bash
npm run dev:server
```

### Start Frontend Dev Server (`http://localhost:5173`)
In a second terminal:
```bash
npm run dev:client
```
Vite automatically proxies `/api/*` requests to `http://127.0.0.1:5000`.

### Build Frontend for Production
```bash
npm run build
```

### Run Backend Integration Tests
```bash
npm test
```

---

## 12. API Documentation

All endpoints return JSON in a consistent envelope:
- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": { "code": "...", "message": "...", "details": { ... } } }`

### Authentication
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create user account (`{ name, email, password }`) |
| `POST` | `/api/auth/login` | Public | Authenticate user (`{ email, password }`) |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/me` | Required | Return authenticated user profile |

### Assessments
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/assessments/meta` | Public | Return subject catalog, skill levels, and boolean capability flags |
| `POST` | `/api/assessments/generate` | Optional (Guest/User) | Generate and persist a schema-validated assessment via AI |
| `GET` | `/api/assessments/:id` | Optional (Owner/Guest) | Retrieve candidate-safe assessment (answers & hidden cases redacted) |
| `POST` | `/api/assessments/:id/run-code` | Optional (Owner/Guest) | Run candidate code against visible sample test cases via configured sandbox |
| `POST` | `/api/assessments/:id/submit` | Optional (Owner/Guest) | Grade responses, persist `AssessmentAttempt`, and return full results |
| `GET` | `/api/assessments/:id/result` | Optional (Owner/Guest) | Fetch evaluated results, breakdowns, and explanations |
| `GET` | `/api/assessments/history` | Required | List authenticated user's completed attempts (supports `?subject=&skillLevel=`) |

### Dashboard & System
| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/dashboard/summary` | Required | Total completed, average/highest score, recent attempts, next recommendation |
| `GET` | `/api/dashboard/progress` | Required | Subject-wise accuracy and 7-tier skill progression |
| `GET` | `/api/health` | Public | Server, database connection, and non-sensitive capability check |

---

## 13. Assessment Generation Workflow

1. **Client Validation**: `ConfigureAssessmentPage` validates subject-language compatibility, format compatibility (disabling coding/debugging for non-programming subjects), question count (`1-25`), and duration (`5-180` minutes).
2. **Server Validation**: `validateAssessmentConfigInput` re-validates all parameters on `/api/assessments/generate`.
3. **Structured Prompt Construction**: `assessmentPrompts.js` embeds the selected skill level's learning objective, focus topics, and strict JSON schema rules.
4. **LLM Request & Schema Verification**: `assessmentGenerationService.js` parses the JSON payload and validates every question with `assessmentSchemaValidator.js` (checking count, uniqueness, 4 distinct MCQ options, valid `correctAnswer`, coding test cases, debugging fixes, and explanations).
5. **Safe Retry**: If the first LLM response is malformed or fails schema validation, the engine performs one automatic corrective retry including the validation errors before returning `502 AI_INVALID_OUTPUT`.
6. **Candidate Redaction**: `redactAssessmentForCandidate` removes `correctAnswer`, `explanation`, `referenceSolution`, `correctedSolution`, `identifiedIssue`, `sampleAnswer`, and hidden test cases from `GET /api/assessments/:id`.

---

## 14. Authentication & Guest Mode

- Passwords are validated for minimum length and character composition and hashed with `bcryptjs` (12 salt rounds). `passwordHash` has `select: false` on the Mongoose schema and is stripped in all JSON serializers.
- Sessions use signed JWTs (`jsonwebtoken`) delivered in `httpOnly` cookies (`sameSite: 'lax'`) with `Authorization: Bearer` header support.
- Guest users are assigned an opaque session identifier (`codeassess_guest_id` cookie / `X-Guest-Session-Id` header) so guest assessments and results remain scoped to the originating browser session.

---

## 15. Security Considerations

- **API Key Isolation**: `AI_API_KEY` and `CODE_EXECUTION_API_KEY` exist exclusively in `server/.env` and are never exposed in client bundles or API responses.
- **No Arbitrary Server Code Execution**: Submitted coding answers are never executed via `eval`, `vm`, or `child_process` on the Express server. Code execution occurs strictly over HTTP to an external sandboxed service when `CODE_EXECUTION_URL` is configured.
- **Rate Limiting**: Express rate limiters protect general `/api` routes as well as `/api/assessments/generate`.
- **Duplicate Submission Protection**: Client submission locking combined with server-side `submissionKey` idempotency prevents duplicate attempt records.

---

## 16. Troubleshooting

- **`AI_NOT_CONFIGURED` (HTTP 503)**: Verify `server/.env` exists, `AI_API_KEY` is populated with a valid key for `AI_PROVIDER`, and restart the backend server.
- **`DATABASE_UNAVAILABLE` (HTTP 503)**: Ensure your local `mongod` service is running or verify your Atlas `MONGODB_URI` IP allowlist. For local testing without MongoDB installed, set `DB_MODE=local_json` in `server/.env`.
- **Coding Questions Show "Execution Unavailable"**: This is expected when `CODE_EXECUTION_URL` is unset. Configure a Piston or Judge0 sandbox endpoint in `server/.env` to enable live sample runs and automated test case grading.

---

## 17. Future Improvements

- Configurable multi-language starter templates per algorithmic data structure (linked list / binary tree harnesses).
- Exportable PDF / CSV assessment score reports for candidates.
- Custom rubric weightings per topic in Mixed Assessments.
