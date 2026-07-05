# Suzuki Cello School App

This project now has two intentional paths:

- Offline/local app: starts from `start_offline.cmd`, uses browser storage, and reads local media from `src/video`, `src/mp3`, and `src/books`.
- Server/VPS portal: lives in `server/`, Docker, Compose, and `DEPLOYMENT.md`, with PostgreSQL data and Cloudflare media.

## Offline Start

Double-click `start_offline.cmd`.

The app opens at `http://127.0.0.1:5173` and runs without the VPS server. See `OFFLINE.md` for the exact behavior.

## Development

```sh
npm run dev:offline
npm run build
npm run server:check
```

## Server Portal

The online portal work is documented in `PRD.md`, `technicaldesign.md`, `task.md`, and `DEPLOYMENT.md`.
