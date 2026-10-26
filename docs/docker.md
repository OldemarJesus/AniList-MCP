# Docker Deployment Guide

This guide covers building, running, and configuring **AniList-MCP** using Docker and Docker Compose.

---

## 1. Prerequisites
- Docker Engine 20.10+
- Docker Compose v2+

---

## 2. Docker Architecture

The AniList-MCP Docker image is configured with:
- **Multi-Stage Build**: First stage installs dependencies and builds TypeScript into `dist/`. The final runtime stage only copies the production `node_modules` and compiled JavaScript, minimizing image size and attack surface.
- **Base Image**: `node:20-alpine` (lightweight, secure).
- **Non-Root Execution**: Runs under the unprivileged `node` user (`UID 1000`).
- **Container Health Check**: Evaluates `http://localhost:3000/health` every 30 seconds.

---

## 3. Quick Start with Docker Compose

1. Clone or navigate to the repository:
   ```bash
   cd /path/to/AniList-MCP
   ```

2. Optional: Configure your environment variables in `.env`:
   ```bash
   ANILIST_TOKEN=your_personal_token_here
   PORT=3000
   ```

3. Launch the container in the background:
   ```bash
   docker compose up -d --build
   ```

4. Verify container health:
   ```bash
   docker compose ps
   curl http://localhost:3000/health
   ```

5. View real-time logs:
   ```bash
   docker compose logs -f
   ```

---

## 4. Manual Docker CLI Commands

### Build Image
```bash
docker build -t anilist-mcp:latest .
```

### Run Container
```bash
docker run -d \
  --name anilist-mcp \
  -p 3000:3000 \
  -e TRANSPORT=sse \
  -e PORT=3000 \
  -e ANILIST_TOKEN="optional_token_here" \
  --restart unless-stopped \
  anilist-mcp:latest
```

### Run Container Healthcheck Probe
```bash
docker inspect --format='{{json .State.Health.Status}}' anilist-mcp
```
