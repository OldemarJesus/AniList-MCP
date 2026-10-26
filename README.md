# AniList-MCP 🚀

[![CI/CD Docker Build](https://github.com/oldemar/AniList-MCP/actions/workflows/docker-build.yml/badge.svg)](https://github.com/oldemar/AniList-MCP/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![MCP Specification](https://img.shields.io/badge/MCP-Standard-purple.svg)](https://modelcontextprotocol.io/)

A production-grade [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for **AniList**, written in Node.js & TypeScript, reusing the proven **[`anilist-node`](https://github.com/AurelicButter/Anilist-Node)** library.

Connects your AI agents (Claude Desktop, Cursor, Antigravity IDE, etc.) directly to AniList to discover anime schedules, query user profile stats, search titles, and retrieve recommendations.

---

## ✨ Features (Phase 1 MVP)

- 📺 **Airing Schedules**: Real-time broadcast schedules, countdown timers, and next-episode trackers.
- 👤 **User Profile & Stats**: In-depth statistics (episodes watched, minutes spent, chapters read, average scores, genres).
- 🔍 **Search Anime & Manga**: Fast title lookups with rich metadata (synonyms, romanized/English titles, cover images).
- 💡 **Recommendations**: Discover related works based on community ratings or fetch individual recommendation threads.
- 🔐 **Flexible Auth**: Works out-of-the-box for public queries; accepts `ANILIST_TOKEN` for authenticated/private data.
- 🐳 **Docker-Ready with `/health`**: Dual transport support (`stdio` for local tools, `sse` for remote containers) with an HTTP `/health` probe.

---

## 📋 Table of Contents
- [Quick Start](#-quick-start)
- [Configuration](#-configuration)
- [Client Integration](#-client-integration)
- [MCP Tools Reference](#-mcp-tools-reference)
- [Docker Deployment](#-docker-deployment)
- [Testing](#-testing)
- [Documentation](#-documentation)
- [License](#-license)

---

## ⚡ Quick Start

### Option A: Run via Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/oldemar/AniList-MCP.git
cd AniList-MCP

# Start with Docker Compose
docker compose up -d --build

# Verify health status
curl http://localhost:3000/health
```

### Option B: Run Locally with Node.js

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in Stdio mode (Default)
npm start

# Or run in SSE/HTTP mode with /health endpoint
TRANSPORT=sse PORT=3000 npm start
```

---

## ⚙️ Configuration

AniList-MCP is configured via environment variables or a `.env` file:

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `ANILIST_TOKEN` | String | `""` | Optional AniList OAuth token for authenticated queries. |
| `TRANSPORT` | String | `stdio` | Transport type: `stdio` (CLI/Desktop) or `sse` (HTTP/Docker). |
| `PORT` | Number | `3000` | Port for the HTTP / SSE server. |
| `HOST` | String | `0.0.0.0` | Listen host for the HTTP server. |
| `LOG_LEVEL` | String | `info` | Logging verbosity (`debug`, `info`, `warn`, `error`). |

---

## 🔌 Client Integration

### 1. Claude Desktop (`claude_desktop_config.json`)

#### Stdio Mode (Direct Node execution):
```json
{
  "mcpServers": {
    "anilist": {
      "command": "node",
      "args": ["/absolute/path/to/AniList-MCP/dist/index.js"],
      "env": {
        "ANILIST_TOKEN": "your_optional_token"
      }
    }
  }
}
```

#### Docker Mode:
```json
{
  "mcpServers": {
    "anilist": {
      "command": "docker",
      "args": ["run", "-i", "--rm", "-e", "TRANSPORT=stdio", "anilist-mcp:latest"]
    }
  }
}
```

### 2. Cursor / Antigravity IDE (SSE Mode)
When running the Docker container with `TRANSPORT=sse`:
- URL: `http://localhost:3000/sse`

---

## 🛠️ MCP Tools Reference

| Tool Name | Parameters | Description |
| :--- | :--- | :--- |
| `airing_schedule` | `anime_id?`, `not_yet_aired?`, `page?`, `per_page?`, `airing_at_greater?`, `airing_at_lesser?` | Returns upcoming anime broadcast schedule and countdowns. |
| `get_user_profile_stats` | `username?`, `user_id?` | Returns user bio, favorites, and detailed anime/manga stats. |
| `search_anime` | `query`, `page?`, `per_page?` | Searches anime by title/keyword. |
| `search_manga` | `query`, `page?`, `per_page?` | Searches manga by title/keyword. |
| `get_recommendation` | `id` | Retrieves a specific recommendation by AniList ID. |
| `list_recommendations` | `media_id`, `page?`, `per_page?` | Lists recommendations for an anime or manga. |

See [docs/api.md](docs/api.md) for full parameter schemas and response formats.

---

## 🩺 Health Check Endpoint

In `sse` mode, the server serves an HTTP `/health` endpoint:

```bash
curl http://localhost:3000/health
```

```json
{
  "status": "ok",
  "service": "anilist-mcp",
  "version": "1.0.0",
  "uptime": 128.45,
  "transport": "sse",
  "authenticated": false,
  "timestamp": "2026-10-26T04:26:00.000Z"
}
```

---

## 🧪 Testing

AniList-MCP includes automated tests verifying tool execution, input schemas, and health checks:

```bash
# Run unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 📚 Documentation

Detailed documentation is available in the [`docs/`](docs/) directory:
- [PRD (Product Requirements Document)](PRD.md)
- [TL;DR Summary](TLDR.md)
- [Agent Integration Guidelines](AGENTS.md)
- [System Architecture](docs/architecture.md)
- [API Reference](docs/api.md)
- [Docker Guide](docs/docker.md)
- [Developer Guide](docs/development.md)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
