# Suzuki Cello VPS Portal PRD

## Goal

Move the Suzuki Cello app from browser-local student data to a VPS-backed portal with a real database, while keeping large media files on Cloudflare.

## User Value

- The teacher can manage students from any device without losing data when a browser changes.
- Students or parents can access only their own assigned materials and lesson notes.
- Media delivery remains fast and cheap because Cloudflare continues to serve videos, audio, PDFs, and static media.
- The app can grow into a durable school portal without a later high-risk migration.

## Scope

- Add a production-ready backend foundation for the VPS.
- Add a PostgreSQL schema for users, students, materials, assignments, and lesson records.
- Add authenticated teacher API routes for student and lesson management.
- Add a student access model suitable for private links or later parent accounts.
- Add deployment files for Docker Compose on a VPS.
- Keep the existing React UI and media library intact during the first move.

## Non-Goals

- Moving Cloudflare media objects onto the VPS.
- Building a full payment, scheduling, or messaging system.
- Migrating existing student records, because there are no real student records yet.
- Replacing the visual design of the current app.

## Key Workflows

- Teacher signs in and manages students.
- Teacher creates a student profile.
- Teacher assigns Cloudflare-hosted media to a student.
- Teacher records lesson notes, homework, and attendance.
- Student or parent opens a private profile and sees assigned materials.
- Teacher exports or backs up the database.

## Functional Requirements

- Store student, material, assignment, and lesson data in PostgreSQL.
- Authenticate teacher requests before allowing write operations.
- Keep student profile access scoped to a single student.
- Preserve the existing assigned media shape used by the frontend: `type`, `title`, and `videoId`.
- Support export/import/reset flows for administration.
- Provide a health endpoint for deployment monitoring.
- Keep local browser storage available as a fallback until the VPS backend is fully wired into the UI.

## Acceptance Criteria

- A backend app can start locally and answer `/api/health`.
- Database migrations create the tables needed for the MVP portal.
- Teacher API routes support CRUD for students, materials, assignments, and lesson notes.
- Deployment files define app, database, reverse proxy, persistent storage, and environment variables.
- Backup instructions or scripts exist and store PostgreSQL dumps outside normal app runtime.
- Existing frontend build still succeeds.

## Risks and Assumptions

- The VPS will run Linux, preferably Ubuntu LTS.
- The public domain or subdomain will be configured later.
- Cloudflare remains the source for media delivery.
- Backups must leave the VPS; a local VPS dump alone is not enough.
- Child/student data should stay minimal and private.

## Gamification Band Builder Add-on

### Goal

Turn the existing Animal Orchestra sticker album into a more active band-building loop: a child collects musicians, equips them with instruments, completes bands of different sizes, and plays a short concert when a band is ready.

### User Value

- Children get a clearer reason to keep practicing: every session can move a band closer to playing.
- Parents and teachers still see a healthy practice loop that rewards rhythm and consistency instead of excessive minutes.
- The existing sticker, note, chest, and localStorage gamification work remains useful instead of being replaced.

### Scope

- Add multiple band definitions with different sizes.
- Reuse the existing collectible musician artwork.
- Add instrument-equipping using the existing notes currency.
- Add a concert state for completed bands with a short visual and audio reward.
- Keep the feature local-first for now, matching the current gamification storage.

### Non-Goals

- Real-money purchases, ads, or paid unlocks.
- Public leaderboards.
- Backend migration for gamification data in this pass.
- Full generated music or recorded backing tracks.

### Acceptance Criteria

- The student dashboard shows band progress, not only a flat sticker album.
- Each band shows required musicians, missing players, equipped players, and readiness.
- A collected musician can be equipped with an instrument when the child has enough notes.
- Completed bands expose a play action that opens a concert celebration.
- Existing practice reward behavior still works and the frontend build succeeds.
