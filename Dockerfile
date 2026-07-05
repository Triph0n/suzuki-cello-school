FROM node:22-alpine AS frontend
WORKDIR /app

ARG VITE_DATA_BACKEND=server
ARG VITE_API_BASE_URL=
ARG VITE_MEDIA_BACKEND=cloudflare
ENV VITE_DATA_BACKEND=$VITE_DATA_BACKEND
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MEDIA_BACKEND=$VITE_MEDIA_BACKEND

COPY package*.json ./
RUN npm ci

COPY index.html vite.config.js eslint.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

FROM node:22-alpine AS server_deps
WORKDIR /app/server

COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV FRONTEND_DIST=/app/dist

COPY --from=server_deps /app/server/node_modules ./server/node_modules
COPY server ./server
COPY --from=frontend /app/dist ./dist

EXPOSE 3000
CMD ["node", "server/src/server.js"]
