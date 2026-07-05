# Tasks

## Implementation

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

## Final Validation

- [x] Run backend install or import verification.
- [x] Run frontend build.
- [x] Confirm PRD acceptance criteria are satisfied or document any remaining blocker.
