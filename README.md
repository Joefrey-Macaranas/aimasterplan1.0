# AI-MasterPlan — from “I don’t know how to code” to independent AI builder

Production-ready, mobile-first learning platform (MVP): complete beginners use AI +
Vibe Coding to plan, build, test, deploy, and maintain real software products.

## Stack (this repo)

- Backend: vanilla **Node.js** — built-in modules only (`http/fs/path/url/crypto/vm`).
- Frontend: vanilla HTML/CSS/JS in `public/` (no framework, no build step).
- Database: file-backed JSON in `data/` (`data/db/*.json` tables + legacy stores).
- Storage: local `data/uploads/` with signed temporary URLs + Range streaming.
- Tests: `node --test` (no dependencies). CI: `.github/workflows/ci.yml`.

> The long-term product direction (React Native + Expo, Supabase, Stripe, Mux,
> PostHog/Sentry, Next.js admin) is **not** in this repo — this MVP proves the
> full product loop on a stack that runs anywhere Node 18+ runs. Native store
> releases (signing, AAB/IPA, Play/App Store review) require developer
> accounts and are tracked as blockers, not code.

## Local setup

```sh
node --version        # >= 18
PORT=8082 node server.js
curl http://localhost:8082/api/health
npm test              # full QA suite (zero dependencies)
```

Production runner: `deploy/start.sh`, `deploy/stop.sh`, `deploy/healthcheck.sh`.
Env template: `deploy/env.example` (`PORT`, `MEDIA_SECRET`).
Backups: `sh deploy/backup.sh [keep]` → timestamped `backups/*.tgz` (verified).

## Architecture overview

```
browser (public/index.html + app.js + styles.css)
   │  Bearer tokens (30-day, scrypt passwords, lockout, RBAC)
   ▼
server.js — flat route chain (≈60 JSON endpoints, all under /api/*)
   ├─ auth (register/login/verify/recover/reset/sessions)
   ├─ curriculum (overview/curriculum/lesson-content w/ signed media)
   ├─ challenges/run (sandboxed vm), ask/plan/onboard (tutor AI)
   ├─ progress (lesson/module/progress, analytics, heatmap)
   ├─ projects (catalog + user-projects/tasks), planner (save/track)
   ├─ community (feed/react/comment/report + posts/comments tables)
   ├─ meetings + attendance + announcements
   ├─ CMS (course/levels/modules/lessons/reorder/draft-publish,
   │        students, moderation, meetings)
   ├─ files/videos (validated upload, signed URLs, Range streaming)
   ├─ notify (triggers + push subscribe/send/inbox), certs + gated claims
   └─ ops (/api/health, /api/metrics, /api/errors, /api/arch)
data/ — users.json, community.json, purchases.json,
        cms/course.json + meetings.json + enrollments.json,
        db/*.json (22 entities), uploads/*, logs/*
```

RBAC: `student < instructor < author < admin`. Students see only their own
scoped data; staff manage content/students/meetings; premium lesson content
and media require enrollment (or staff) — anonymous gets 401, unenrolled 402.

## API documentation (essentials)

| Area | Endpoint | Auth |
|---|---|---|
| Health | `GET /api/health` | public |
| Manifest | `GET /api/arch` | public |
| Auth | `POST /api/auth/register|login|verify|recover|reset`, `GET /api/me` | mixed |
| Curriculum | `GET /api/overview|curriculum|tools|projects|plan|onboard|ask` | public |
| Lesson content | `GET /api/curriculum/lesson/:id` | enrolled |
| Challenge run | `POST /api/challenges/run` | user |
| Progress | `GET|POST /api/lesson-progress`, `/api/module-progress`, `GET /api/progress` | user |
| Analytics | `GET /api/analytics/admin`, `/api/analytics/student` | staff / self |
| Projects | `GET /api/user-projects`, `POST /api/project-tasks`… | user |
| Community | `GET|POST /api/community*`, `/api/comments` | mixed |
| Meetings | `GET /api/meet`, `/api/cms/meetings*`, `/api/meeting-attendance` | mixed/staff |
| CMS | `/api/cms/*`, `/api/courses|levels|modules|lessons|lesson-resources` | staff |
| Media | `POST /api/files|videos`, `GET /api/files/:id|videos/:id`, `POST /api/media/sign` | enrolled/signed |
| Notify/certs | `/api/notify/*`, `/api/certificates|certificates/claim` | mixed |
| Ops | `GET /api/metrics|errors`, `POST /api/errors` | staff / public-beacon |

Full route list: `GET /api/arch`. Unknown `/api/*` → JSON 404 (never SPA).

## Database entities (22)

users, profiles, courses, levels, modules, lessons, lesson_resources,
enrollments, lesson_progress, module_progress, projects, project_tasks,
quizzes, quiz_attempts, achievements, student_achievements, meetings,
meeting_attendance, community_posts, comments, notifications, certificates
(+ files, videos, push_subs for storage/messaging).

Seed: `python3 tests/seed_criteria.py` (18 anchor lessons with tutorials).
Migrations: N/A (JSON tables auto-seed on first read via `seedTables()`).

## Deployment

1. `cp deploy/env.example deploy/.env` and set a 32+ char `MEDIA_SECRET`.
2. `sh deploy/start.sh` → `sh deploy/healthcheck.sh`.
3. Optional macOS daemon: copy `deploy/com.aimasterplan.plist` to
   `~/Library/LaunchAgents` (edit paths first).
4. CDN: put a cache/CDN in front; versioned assets (`?v=`) serve immutable.
5. Backups: schedule `deploy/backup.sh 7` (cron/launchd).

## Feature roadmap

- [x] MVP: auth, onboarding, roadmap L1–10, lesson viewer (video/tutorials/copy),
  challenge runner, tools, projects, planner, assistant, meet, CMS,
  notifications, security, analytics, tests, CI, backups
- [ ] Author the remaining ~90 lesson contents via CMS (19/111 rich today)
- [ ] Captions/transcripts/chapters per video (block fields exist: url/caption)
- [ ] Native mobile (Expo) + Supabase/Stripe/Mux behind accounts
- [ ] Deferred by design: marketplaces, public project directory,
  advanced certificate verification, complex gamification
