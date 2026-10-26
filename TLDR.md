# TL;DR - AniList-MCP

## What is this?
**AniList-MCP** is an official Model Context Protocol (MCP) server written in Node.js / TypeScript that allows AI agents to query AniList for:
- 📺 **Airing Schedules** (Global timeline & anime-specific countdowns)
- 📊 **User Profile & Stats** (Watched minutes, chapter counts, favorite genres & scores)
- 🔍 **Search** (Anime and Manga with titles, cover art, and IDs)
- 💡 **Recommendations** (Media recommendations & single recommendation lookups)
- 🩺 **/health Endpoint** (Live diagnostics and health checking)

It leverages the **`anilist-node`** package with full TypeScript support, dual transport (`stdio` for local LLMs, `SSE` / HTTP for Docker / remote deployments), and token authentication via `ANILIST_TOKEN`.

---

## Quick Start (Docker)

```bash
# 1. Build and run via Docker Compose
docker compose up -d --build

# 2. Check health
curl http://localhost:3000/health

# 3. Connect MCP client
# SSE endpoint: http://localhost:3000/sse
```

---

## Quick Start (Local Node.js)

```bash
# 1. Install dependencies & build
npm install
npm run build

# 2. Run in stdio mode (Claude Desktop / Cursor)
node dist/index.js

# 3. Or run in HTTP/SSE mode with /health endpoint
TRANSPORT=sse PORT=3000 node dist/index.js
```

---

## Environment Variables

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `ANILIST_TOKEN` | `""` (unauthenticated) | AniList OAuth token for private/authenticated data |
| `TRANSPORT` | `stdio` | Transport mode: `stdio` or `sse` |
| `PORT` | `3000` | HTTP port when `TRANSPORT=sse` |
| `HOST` | `0.0.0.0` | Bind host when `TRANSPORT=sse` |

---

## Implemented Tools

1. `airing_schedule`: Get upcoming anime episodes or media-specific countdowns.
2. `get_user_profile_stats`: Fetch AniList user profile details and viewing statistics.
3. `search_anime`: Search anime by title with pagination.
4. `search_manga`: Search manga by title with pagination.
5. `get_recommendation`: Retrieve a recommendation by its AniList ID.
6. `list_recommendations`: List community recommendations for a given anime or manga.
