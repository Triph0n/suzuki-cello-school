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
