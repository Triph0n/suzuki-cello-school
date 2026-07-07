# Tasks

## Phase 1: VPS portal scaffold (done)

- [x] Task 1: Add planning documents for the VPS portal move.
  - Acceptance: `PRD.md`, `technicaldesign.md`, and `task.md` describe the target portal, data model, deployment, and verification path.
  - Verification: Documents exist and match the current React/Vite plus Cloudflare media architecture.

- [x] Task 2: Add the backend package and database schema.
  - Acceptance: `server/` contains package metadata, environment example, database connection helpers, authentication helpers, and the initial PostgreSQL migration.
  - Verification: Backend source imports cleanly and the schema covers users, sessions, students, material assignments, and lesson notes.

- [x] Task 3: Add authenticated API routes for the MVP portal.
  - Acceptance: Routes exist for health, auth, students, materials, lesson notes, export, import, and reset.
  - Verification: Backend app can be imported without syntax errors.

- [x] Task 4: Add VPS deployment and backup artifacts.
  - Acceptance: Dockerfile, Docker Compose, Caddyfile, and backup script exist with documented environment variables.
  - Verification: Deployment files reference the backend, PostgreSQL, persistent volumes, and HTTPS proxy correctly.

- [x] Task 5: Add a server-ready frontend data adapter without removing local fallback.
  - Acceptance: `src/api.js` can use `/api` when server mode is enabled and keeps the existing localStorage behavior otherwise.
  - Verification: Existing frontend build passes.

## Phase 2: Deploy blockers (must be done before the first Oracle deploy)

- [ ] Task 6: Wire the login screen to the backend.
  - Problem: No client code calls `/api/auth/login`, `/api/auth/me`, or `/api/auth/logout`; `src/pages/TeacherDashboard.jsx:35` hardcodes `isAuthenticated = true`, so every server-mode fetch returns 401 and the UI renders empty lists.
  - Acceptance: A Login page posts to `POST /api/auth/login`; app bootstraps auth state from `GET /api/auth/me`; a logout button calls `POST /api/auth/logout`; `/teacher` routes redirect to login when unauthenticated.
  - Verification: With `VITE_DATA_BACKEND=server`, a full login → create student → assign material → lesson note → logout cycle works in the browser.

- [ ] Task 7: Fix media delivery on the VPS.
  - Problem: `src/mediaConfig.js:7` hardcodes relative `/api/media`; in production Fastify has no media route, so all media 404s. `MEDIA_BASE_URL` from `compose.yaml`/`.env` is read by no code.
  - Acceptance: `/api/media/*` requests reach Cloudflare in production — either a Caddyfile `handle /api/media/*` reverse proxy to the Pages deployment, or the frontend reads `VITE_MEDIA_BASE_URL`.
  - Verification: A PDF and an mp3 load in the deployed app; the unused `MEDIA_BASE_URL` plumbing is either used or removed.

- [ ] Task 8: Make `ops/deploy-vps.ps1` safe to re-run.
  - Problem: `deploy-vps.ps1:31-32` regenerates `POSTGRES_PASSWORD` and `SESSION_SECRET` on every run, but the Postgres volume keeps the old password — the second deploy breaks DB connectivity and invalidates all sessions. `deploy-vps.ps1:59` `rm -rf` also deletes the remote `.env` and any `./backups` directory.
  - Acceptance: Secrets are generated only when no remote `.env` exists; an existing `.env` is preserved across deploys; the extraction step no longer deletes `.env` or backups; `AdminPassword` is prompted via `Read-Host -AsSecureString` instead of a CLI parameter.
  - Verification: Running the script twice in a row leaves a working stack with the same DB password.

- [ ] Task 9: Add login rate limiting and proxy awareness.
  - Problem: `server/src/routes/auth-routes.js:15` accepts unlimited attempts and each one runs blocking synchronous PBKDF2; `server/src/server.js:19` does not set `trustProxy`, so `request.ip` is always Caddy's container IP.
  - Acceptance: `@fastify/rate-limit` limits `/api/auth/login` (e.g. 5/min per IP); Fastify is created with `trustProxy: true`; password hashing uses async `pbkdf2`.
  - Verification: A 6th rapid login attempt returns 429; `request.ip` logs the real client IP behind Caddy.

- [ ] Task 10: Fix export/import so it cannot lose data.
  - Problem: `server/src/routes/admin.js:5-30` exports a subset of columns (drops `internal_notes`, `status`, `homework`, `focus`, `attendance_status`, material keys/urls/metadata), and import deletes all rows before re-inserting that subset. The UI export/import bypasses the server entirely (`src/api.js:309-330`), alerts success before the request resolves, and local `Date.now()` ids crash the UUID columns on import.
  - Acceptance: Export includes every column; import validates the payload (400 before any delete) and maps/regenerates non-UUID ids; the UI uses `GET /api/admin/export` and awaits import, surfacing errors to the user.
  - Verification: export → reset → import round-trips a database with notes, homework, attendance, and material links intact.

## Phase 3: Fix before entering real student data

- [ ] Task 11: Fail fast on missing `SESSION_SECRET` in production (`server/src/auth.js:35` currently falls back to `""`).
- [ ] Task 12: Add graceful shutdown (SIGTERM/SIGINT → `app.close()` + pool close) and a `pool.on("error")` handler so a Postgres restart cannot crash the app (`server/src/server.js:52`, `server/src/db.js:12`). Add `connectionTimeoutMillis` and a statement timeout to the pool.
- [ ] Task 13: Add Fastify route schemas (UUID params, enum/date bodies) and a generic `setErrorHandler` so invalid input returns 400 instead of a 500 leaking pg error text (e.g. `server/src/routes/lesson-notes.js:22-24`, `students.js:61`).
- [ ] Task 14: Protect the Cloudflare media function — `functions/api/media/[[path]].js` currently serves all copyrighted books/recordings publicly. Require a signed token or put Cloudflare Access in front.
- [ ] Task 15: Remove the dead `firebase` dependency and `src/firebase.js` (imported by nothing, placeholder config).
- [ ] Task 16: Resolve the student "private link" story: the `?d=` base64 blob breaks in server mode (`src/api.js:203-207` writes only to in-memory cache). Either implement `student_access_tokens` end-to-end or hide the share feature until it exists.

## Phase 4: Hardening and quality

- [ ] Task 17: Normalize `lesson_date` to `YYYY-MM-DD` in API responses so `<input type="date">` works (`server/src/routes/lesson-notes.js:8`), and make PATCH able to clear fields (replace `|| null` + `COALESCE` with `!== undefined` handling).
- [ ] Task 18: Raise PBKDF2 to 600,000 iterations (OWASP for SHA-256); existing hashes still verify via the stored iteration count. Run `verifyPassword` against a dummy hash when the email is unknown (timing oracle).
- [ ] Task 19: Health endpoint returns 503 when the DB ping fails (`server/src/routes/health.js:12-16`); add an app-container `healthcheck` to `compose.yaml`.
- [ ] Task 20: Purge expired sessions opportunistically on login (`sessions` table currently grows forever).
- [ ] Task 21: Add a minimal startup migration runner (`schema_migrations` table, applies `server/migrations/*.sql` in order) and drop the manual psql step from `DEPLOYMENT.md`.
- [ ] Task 22: Add security headers in the Caddyfile (`X-Content-Type-Options`, `X-Frame-Options`) and Docker log rotation (`max-size: 10m`, `max-file: 3`) to all compose services.

## Phase 5: Oracle VPS operations

- [ ] Task 23: Open VCN ingress for TCP 80/443; if external curl still fails, check the image's local iptables REJECT rules (common on Oracle Ubuntu images).
- [ ] Task 24: Move `BACKUP_DIR` outside the deploy directory, schedule `ops/backup-postgres.sh` via cron, and sync dumps off-VPS (e.g. rclone to Cloudflare R2). Test a full restore before entering real student data.
- [ ] Task 25: Base OS hardening: unattended upgrades (`unattended-upgrades` on Ubuntu / `dnf-automatic` on Oracle Linux), SSH key-only auth, fail2ban on sshd.

## Final Validation

- [ ] `npm run build` and `npm run server:check` pass.
- [ ] Fresh deploy on a clean Oracle instance via `ops/deploy-vps.ps1` succeeds; `https://<domain>/api/health` returns ok.
- [ ] Re-running the deploy script leaves the stack working (Task 8 regression check).
- [ ] Login, student CRUD, material assignment, lesson notes, media playback, export/import round-trip, and backup+restore all verified on the VPS.
