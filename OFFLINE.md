# Offline Version

Use `start_offline.cmd` for the local offline-friendly app.

This mode:

- stores students, assigned materials, and lesson notes in this browser on this computer;
- does not need the VPS server or a login;
- loads media from the local folders under `src/video`, `src/mp3`, and `src/books`;
- opens at `http://127.0.0.1:5173`.

The first start installs dependencies if `node_modules` is missing.

## Important Difference

Offline data is separate from the future server portal data. Use the app's export/import tools when you need to move records between browsers or machines.

## Server Version

The server/VPS version stays in `server/`, `Dockerfile`, `compose.yaml`, `ops/`, and `DEPLOYMENT.md`. It is the online portal path and should keep using Cloudflare media through `/api/media`.
