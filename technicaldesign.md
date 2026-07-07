# Suzuki Cello VPS Portal Technical Design

## Current Context

The app is a React/Vite frontend. Student records, teacher materials, and attendance records are currently stored in `localStorage` through `src/api.js`. Media is already abstracted through `/api/media`, with local development proxying that path to the Cloudflare Pages deployment. Existing UI screens can remain mostly unchanged if the data layer keeps the same exported functions.

The repository also contains a Cloudflare Pages function for media access. That function should remain useful for the current Cloudflare-hosted media path.

## Proposed Architecture

Use a small Node/Fastify API and PostgreSQL on the VPS. Caddy terminates HTTPS and proxies traffic to the app container. The Node app serves the built React frontend and exposes `/api/*` routes.

```text
Browser
  -> Caddy HTTPS
  -> Node/Fastify app
  -> PostgreSQL

Cloudflare remains responsible for media files.
```

## Backend

Backend lives under `server/`.

- `server/src/server.js`: Fastify app, route registration, static frontend serving.
- `server/src/db.js`: PostgreSQL pool and query helper.
- `server/src/auth.js`: password hashing, session creation, session lookup.
- `server/src/routes/*.js`: small route modules for health, auth, students, materials, lesson records, and admin export/import.
- `server/migrations/001_init.sql`: schema for the first production database.
- `server/scripts/create-admin.js`: creates the first teacher account from environment variables.

## Data Model

- `users`: teacher, parent, or student login identities.
- `sessions`: hashed session tokens stored server-side.
- `students`: student profile rows owned by the school account.
- `student_access_tokens`: private student links without requiring passwords on day one.
- `materials`: teacher-curated material metadata, usually pointing at Cloudflare paths.
- `student_materials`: ordered assignments from students to material payloads.
- `lesson_notes`: date, lesson note, homework, focus, and attendance status.

The frontend currently uses `assignedVideos` arrays directly on student objects. The API should return students with `assignedVideos` populated so the current UI can adopt the server without a large rewrite.

## API Shape

- `GET /api/health`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/students`
- `POST /api/students`
- `PATCH /api/students/:id`
- `DELETE /api/students/:id`
- `PUT /api/students/:id/materials`
- `GET /api/materials`
- `POST /api/materials`
- `DELETE /api/materials/:id`
- `GET /api/lesson-notes`
- `POST /api/lesson-notes`
- `PATCH /api/lesson-notes/:id`
- `DELETE /api/lesson-notes/:id`
- `GET /api/admin/export`
- `POST /api/admin/import`
- `POST /api/admin/reset`

## Permissions

- Teacher routes require a valid session cookie.
- Student profile routes should use a scoped private token in a later UI step.
- Server validates all ownership and student visibility. The client is not trusted.

## Deployment

Use Docker Compose:

- `app`: Node/Fastify app serving API and built frontend.
- `postgres`: PostgreSQL with a named volume.
- `caddy`: HTTPS reverse proxy with persistent cert volume.

Use `.env` for domain, database credentials, session secret, admin bootstrap credentials, and media base configuration.

## Backup Strategy

Add an ops script that runs `pg_dump` from the PostgreSQL container. Dumps should be copied to external storage such as Cloudflare R2, another server, or a local machine. Retention target:

- 7 daily backups
- 4 weekly backups
- 6 monthly backups

The restore path should be tested before real student data is entered.

## Testing

- Backend syntax/import check.
- Health endpoint smoke test when dependencies are installed.
- Frontend `npm run build`.
- Later: add API integration tests once the first live VPS environment exists.

## Rollout

1. Land backend and deployment scaffold.
2. Start locally with Docker Compose.
3. Create teacher admin account.
4. Add one test student.
5. Wire frontend data calls to server mode.
6. Deploy to staging subdomain.
7. Verify HTTPS, login, student creation, assignment, lesson note, and backup.
8. Add real students only after restore has been tested.

## Gamification Band Builder

### Current Context

Gamification currently lives in `src/gamification.js` and stores local state under `gamify_<studentId>`. The student dashboard renders `GamificationPanel`, which contains the timer, Cellino, balance week, sticker album, and reward modal. Collectibles are defined as `STICKERS`; duplicates become notes.

### Approach

Extend the existing local model rather than adding a parallel system:

- Keep `STICKERS` as the existing collectible musician source for compatibility.
- Add richer `MUSICIANS` metadata with role, instrument, instrument cost, and band participation.
- Add `BANDS` definitions with 2-, 3-, 4-, and 6-player requirements.
- Add `equippedInstruments` to the stored state, defaulting to `{}` for existing students.
- Add one base note per completed practice session, with duplicate rewards continuing to add bonus notes.
- Add an `equipMusician` helper that spends notes and marks a musician ready.
- Replace the flat album view with a `BandWorkshop` component that presents progress, equip actions, and concert playback.

### Files

- `src/gamification.js`: data definitions, state migration defaults, equip helper, band progress selectors.
- `src/components/gamification/GamificationPanel.jsx`: render the band workshop and hold concert modal state.
- `src/components/gamification/BandWorkshop.jsx`: new band UI.
- `src/components/gamification/RewardModal.jsx`: mention the base practice note reward.
- `src/components/gamification/assets.js`: continue using sticker assets for musicians.

### Validation

- Run `npm run build`.
- Run `npm run lint`.
- Verify the code supports existing localStorage states without `equippedInstruments`.
