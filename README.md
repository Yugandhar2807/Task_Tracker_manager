# Team Task Manager

A production-ready, full-stack team collaboration platform built with Next.js 14, TypeScript, Prisma, and PostgreSQL. Modern SaaS-style UI with role-based access control, real-time activity feed, dashboard analytics, and dark/light themes.

![Stack](https://img.shields.io/badge/Next.js-14-black) ![Stack](https://img.shields.io/badge/TypeScript-5-blue) ![Stack](https://img.shields.io/badge/Prisma-5-2D3748) ![Stack](https://img.shields.io/badge/PostgreSQL-blue) ![Stack](https://img.shields.io/badge/Tailwind-3-38BDF8)

---

## Features

### Core
- **JWT authentication** — signup/login with bcrypt password hashing, HTTP-only secure cookies, and `jose`-based token verification (works in Next.js Edge middleware).
- **RBAC enforced server-side** — `ADMIN` and `MEMBER` roles. Admins can create/delete projects, create/assign/delete tasks, and manage members. Members can only view their tasks and update status.
- **Project management** — create projects, assign team members (M:M), see progress percentages live.
- **Task management** — title, description, assignee, status (`TODO` / `IN_PROGRESS` / `DONE`), priority (`LOW` / `MEDIUM` / `HIGH`), due date.
- **Dashboard analytics** — total / completed / pending / overdue counters, completion percentage, and per-project progress bars.
- **Activity feed** — every project + task action is persisted to the `Activity` table and shown in a live feed.

### UI / UX
- Modern SaaS dashboard with **glassmorphism sidebar** (blur + transparency).
- **Dark / light theme** toggle (persisted via `next-themes`).
- **Framer Motion** page transitions and task animations.
- **Shadcn UI** primitives — Card, Table, Dialog, Dropdown, Select, Tabs, Avatar, Progress, etc.
- **Lucide** icon set.
- Loading skeletons everywhere.
- Priority badges color-coded (HIGH = red, MEDIUM = amber, LOW = emerald).
- Overdue task highlighting (rose ring + label).
- Fully responsive (mobile + desktop).

### Collaboration
- **Status-change with note** — when a member moves a task between TODO / IN_PROGRESS / DONE, a dialog opens for an optional (or required, on DONE) work-log entry. The note is saved as a `Comment` tied to the status transition and shown to the team.
- **Built-in chatbot assistant** — a floating launcher in the bottom-right of every dashboard page. Rule-based (no external LLM, no API keys). Members can ask `"show my tasks"`, `"what's overdue?"`, `"due this week"`, `"my projects"`. Admins can additionally ask `"team summary"`, `"tell me about <member name>"`, `"<name>'s tasks"`, etc. Every query runs server-side through the same RBAC scope as the regular API, so the bot can never reveal data the user wouldn't see in the UI.

### Backend / DB
- **Prisma** with PostgreSQL.
- Relational schema: `User → Tasks` (1:M), `Project → Tasks` (1:M), `Project ↔ Members` (M:M), `Activity` ties to `User` and optional `Project`.
- **Enums** for Role, TaskStatus, Priority.
- **Zod** input validation on every API route.
- Consistent error handling with proper HTTP status codes (400, 401, 403, 404, 409, 500).
- Secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`).

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + Shadcn UI primitives |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | PostgreSQL |
| ORM | Prisma 5 |
| Auth | Custom JWT (`jose`) + bcrypt |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| Deployment | Railway (Nixpacks) — Dockerfile also included |

---

## Project structure

```
.
├─ prisma/
│  ├─ schema.prisma          # User / Project / Task / Activity models
│  └─ seed.ts                # Demo data seed
├─ src/
│  ├─ app/
│  │  ├─ (auth)/             # Login + Signup
│  │  ├─ (dashboard)/        # Protected app
│  │  │  ├─ dashboard/       # Analytics
│  │  │  ├─ projects/        # List + [id] detail
│  │  │  ├─ tasks/           # All-tasks view
│  │  │  └─ members/         # Admin-only
│  │  ├─ api/
│  │  │  ├─ auth/            # signup, login, logout, me
│  │  │  ├─ projects/        # GET/POST + [id]
│  │  │  ├─ tasks/           # GET/POST + [id]
│  │  │  ├─ users/           # GET + [id]
│  │  │  ├─ activities/      # GET
│  │  │  ├─ dashboard/       # GET analytics
│  │  │  └─ health/          # Railway health check
│  │  ├─ layout.tsx
│  │  └─ page.tsx            # Public landing
│  ├─ components/
│  │  ├─ ui/                 # Shadcn primitives
│  │  ├─ layout/             # Sidebar, Topbar, DashboardShell
│  │  ├─ dashboard/          # StatCard, ActivityFeed, ProjectProgressList
│  │  ├─ projects/           # ProjectCard, CreateProjectDialog
│  │  ├─ tasks/              # TaskRow, CreateTaskDialog
│  │  ├─ shared/             # PriorityBadge, StatusBadge, UserAvatar
│  │  ├─ providers/          # SessionProvider
│  │  ├─ theme-provider.tsx
│  │  └─ theme-toggle.tsx
│  ├─ lib/
│  │  ├─ prisma.ts           # Singleton client
│  │  ├─ jwt.ts              # sign/verify (jose, Edge-compatible)
│  │  ├─ auth.ts             # bcrypt + cookie helpers + RBAC guards
│  │  ├─ validations.ts      # Zod schemas
│  │  ├─ activity.ts         # Activity logger
│  │  ├─ api-client.ts       # typed fetch wrapper
│  │  ├─ api-error.ts        # error → response mapper
│  │  └─ utils.ts            # cn, getInitials, formatRelativeTime, isOverdue
│  ├─ types/index.ts
│  └─ middleware.ts          # JWT-aware route gate
├─ Dockerfile
├─ railway.json
├─ next.config.js
├─ tailwind.config.ts
├─ components.json
├─ tsconfig.json
└─ package.json
```

---

## Getting started locally

### 1. Prerequisites
- **Node.js** 18.17+ (or 20.x)
- **PostgreSQL** running locally (or any reachable connection string — Neon, Supabase, Railway, etc.)

### 2. Install
```bash
git clone <your-repo-url>
cd Task_Tracker_Manager
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```

Fill in:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` — generate with `openssl rand -base64 48`

### 4. Set up the database
```bash
# Apply schema (creates tables)
npx prisma migrate dev --name init

# (Optional) Seed demo data
npm run db:seed
```

### 5. Run dev server
```bash
npm run dev
```

Open http://localhost:3000.

**Demo logins after seeding:**
| Role | Email | Password |
| --- | --- | --- |
| ADMIN | admin@example.com | password123 |
| MEMBER | jordan@example.com | password123 |
| MEMBER | sam@example.com | password123 |
| MEMBER | riley@example.com | password123 |

> **First user becomes Admin.** If you skip the seed and sign up via `/signup`, the very first account is automatically promoted to `ADMIN`. Subsequent signups default to `MEMBER`.

---

## API reference

All routes return JSON. Protected routes require either the `ttm_token` HTTP-only cookie (set after login/signup) or an `Authorization: Bearer <token>` header. Errors come back as `{ "error": "..." }` with the appropriate status code.

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | public | Create an account. First user → `ADMIN`. |
| `POST` | `/api/auth/login` | public | Email + password → JWT cookie. |
| `POST` | `/api/auth/logout` | any | Clears the auth cookie. |
| `GET`  | `/api/auth/me` | any | Returns the current user (or null). |
| `GET`  | `/api/projects` | user | List projects (admin: all; member: own + joined). |
| `POST` | `/api/projects` | **admin** | Create a project. |
| `GET`  | `/api/projects/:id` | user | Project detail incl. tasks + members. |
| `PUT`  | `/api/projects/:id` | **admin** | Update name / description / member set. |
| `DELETE` | `/api/projects/:id` | **admin** | Delete a project. Cascades tasks. |
| `GET`  | `/api/tasks` | user | List tasks (admin: all; member: own + project tasks). Query: `projectId`, `assignedToMe`. |
| `POST` | `/api/tasks` | **admin** | Create a task. |
| `GET`  | `/api/tasks/:id` | user | Task detail. |
| `PUT`  | `/api/tasks/:id` | user | Update task. **Members may only change `status`.** |
| `DELETE` | `/api/tasks/:id` | **admin** | Delete a task. |
| `GET`  | `/api/users` | user | List users (used to assign tasks / add to projects). |
| `PUT`  | `/api/users/:id` | **admin** | Update name / role. |
| `DELETE` | `/api/users/:id` | **admin** | Remove a user. Cannot remove yourself. |
| `GET`  | `/api/activities` | user | Recent activity feed (limit ≤ 100). |
| `GET`  | `/api/dashboard` | user | Aggregate stats for the current user's scope. |
| `GET`  | `/api/tasks/:id/comments` | user | List comments on a task (must have task access). |
| `POST` | `/api/tasks/:id/comments` | user | Post a comment on a task (any user with task access). Optional `statusFrom` / `statusTo` link the comment to a status transition. |
| `POST` | `/api/chat` | user | Rule-based chatbot. Body: `{ "message": "..." }`. Returns `{ intent, blocks[], suggestions[] }`. RBAC is enforced — members never see admin-only intents. |
| `GET`  | `/api/health` | public | Health check (used by Railway). |

---

## Deploying to Railway

Railway auto-detects this project as Next.js and uses Nixpacks (already configured in `railway.json`). A `Dockerfile` is also included if you prefer container builds.

### Quick deploy
1. **Push to GitHub.**
2. On Railway → **New Project → Deploy from GitHub repo**.
3. Add the **PostgreSQL** plugin from the Railway dashboard. Railway will inject `DATABASE_URL` into your service automatically.
4. In your service → **Variables**, add:
   - `JWT_SECRET` — paste the output of `openssl rand -base64 48`
   - `JWT_EXPIRES_IN` — `7d` (optional, defaults to 7 days)
   - `NEXT_PUBLIC_APP_URL` — your Railway domain (optional)
5. Trigger a deploy. The build command:
   ```
   npm ci && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
   …runs migrations against the live DB, generates the Prisma client, and builds Next.js.
6. Your `/api/health` endpoint is wired as the Railway health check.

### Switching to Docker on Railway
In the service settings, change the builder from **Nixpacks** to **Dockerfile**. The included `Dockerfile` is a multi-stage build that produces a standalone Next.js server (`output: "standalone"`).

### Post-deploy
- Visit `https://<your-app>.up.railway.app/signup` and create the **first user** — it auto-promotes to ADMIN.
- Or run the seed once: `railway run npm run db:seed`.

---

## Security model

- **Passwords** are hashed with bcrypt (cost factor 12) and never returned by the API.
- **JWTs** are signed with HS256 via `jose`, validated in Edge middleware, and stored in HTTP-only, `SameSite=Lax`, `Secure` (in prod) cookies. Bearer-token requests are also accepted for API clients.
- **RBAC is enforced server-side** in every API route via `requireUser` / `requireAdmin` helpers. The UI only hides admin actions; the backend rejects unauthorized requests regardless of UI state.
- **Member task RBAC**: members can update **only** the `status` of tasks they own/are members of. Any other field change is rejected with 403.
- **Input validation** on every mutating route via Zod. Validation errors return `400` with field-level messages.
- **Cascading deletes** are explicit: deleting a project removes its tasks and project-scoped activities; deleting a user clears `assigneeId` on their tasks (`SetNull`).
- **Headers** set in `next.config.js`: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, restrictive `Permissions-Policy`.

---

## Useful scripts

```bash
npm run dev            # Start Next.js in dev mode
npm run build          # Generate Prisma client, run migrations, build Next.js
npm run start          # Start production server
npm run db:migrate     # prisma migrate dev (create + apply migrations)
npm run db:push        # prisma db push (skip migrations, sync schema)
npm run db:seed        # Run prisma/seed.ts
npm run db:studio      # Open Prisma Studio at :5555
npm run lint           # Next.js / ESLint
```

---

## License

MIT — use freely for evaluation, learning, or as a starter for your own product.
