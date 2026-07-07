# VPS Deployment

## Target

Run the Suzuki Cello portal on a VPS while keeping media on Cloudflare.

## First Setup

1. Install Docker and Docker Compose on the VPS.
2. Point a DNS record such as `app.suzukicello.ch` to the VPS.
3. Copy `.env.vps.example` to `.env` and replace every secret value.
4. Start the stack:

```sh
docker compose up -d --build
```

5. Run database migrations:

```sh
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < server/migrations/001_init.sql
```

6. Create the first teacher admin:

```sh
docker compose exec app sh -lc "cd /app/server && npm run create-admin"
```

7. Check health:

```sh
curl https://app.suzukicello.ch/api/health
```

## Automated Deploy From Windows

Create or reuse an SSH key and add its public key to the Oracle VPS instance. Then run:

```powershell
.\ops\deploy-vps.ps1 -HostName "YOUR_VPS_IP" -SshUser "opc" -AdminEmail "teacher@example.com"
```

Use `-SshUser ubuntu` if the instance runs Ubuntu instead of Oracle Linux.

On the first deploy the script prompts for the teacher admin password (it is
never passed on the command line), generates `POSTGRES_PASSWORD` and
`SESSION_SECRET`, writes `.env` on the VPS, starts Docker Compose, runs the
migration, creates the teacher admin, and checks `/api/health`.

Re-deploys keep the existing `.env` (and therefore all secrets and the
database password) and never touch the `backups/` directory. To reset the
admin password later, run on the VPS:

```sh
sudo docker compose exec -e FORCE_ADMIN_PASSWORD=1 app sh -lc "cd /app/server && npm run create-admin"
```

## Oracle Smoke Test

Before running the deploy script, the Oracle instance needs:

- a public IPv4 address;
- SSH access on port `22` from your computer;
- public ingress rules for TCP ports `80` and `443` in the VCN security list or network security group;
- a DNS `A` record such as `app.suzukicello.ch` pointing to the instance IP if you want HTTPS through Caddy.

For the first test, the deploy script verifies the app from inside the VPS with:

```sh
curl -fsS http://127.0.0.1:3000/api/health
```

After DNS points to the instance, verify publicly:

```sh
curl https://app.suzukicello.ch/api/health
```

The teacher UI is gated by the login screen at `/teacher` (session cookie via `/api/auth/login`). Media under `/api/media/*` is proxied by Caddy to the Cloudflare Pages deployment set in `MEDIA_UPSTREAM`.

## Backups

Run a database dump:

```sh
sh ops/backup-postgres.sh
```

Copy the resulting `.sql.gz` file outside the VPS, for example to Cloudflare R2, another server, or a local machine. Test restore before entering real student data.

## Notes

- Do not put media files on the VPS unless there is a specific reason.
- Keep `SESSION_SECRET`, `POSTGRES_PASSWORD`, and `ADMIN_PASSWORD` private.
- Renewed deploys should use `docker compose up -d --build`.
