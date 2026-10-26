# Product Requirements Document (PRD)

## Project Name: AniList-MCP
**Repository:** `AniList-MCP`  
**Runtime:** Node.js (TypeScript)  
**Protocol:** Model Context Protocol (MCP)  
**Underlying SDK:** `anilist-node` & `@modelcontextprotocol/sdk`  
**Status:** In Active Development (Phase 1)

---

## 1. Executive Summary

AniList-MCP is a Model Context Protocol (MCP) server providing LLM-driven agents (such as Claude Desktop, Cursor, Antigravity IDE, ChatGPT) seamless access to AniList anime, manga, user profile stats, airing schedules, and recommendations.

Built with Node.js and TypeScript, it encapsulates the `anilist-node` library while exposing dual transport mechanisms:
1. **Standard I/O (`stdio`)**: For native local desktop integrations.
2. **Server-Sent Events / Streamable HTTP (`SSE`)**: For containerized deployments, cloud hosting, and microservice orchestration, featuring a dedicated `/health` endpoint.

---

## 2. Goals & Objectives

- **Standardized Context Protocol**: Implement the official Model Context Protocol specifications so any MCP client can discover and execute AniList operations without custom tool glue code.
- **Reusability of `anilist-node`**: Leverage the proven `anilist-node` client for AniList GraphQL interactions, ensuring reliable data extraction and rate-limit compliance.
- **Configurable Authentication**: Support public unauthenticated queries out of the box, with optional authenticated access via the `ANILIST_TOKEN` environment variable for user-specific data.
- **Production-Ready Containerization**: Provide a Dockerfile and docker-compose setup with automated health checking (`/health`), multi-stage lean builds, and non-root execution.
- **Automated CI/CD**: Implement GitHub Actions workflow to build, test, and tag the container image with `latest` upon pushes to the `main` branch.

---

## 3. Scope & Phasing

### Phase 1: MVP Core Features (Current Scope)
1. **Airing Information (`airing_schedule`)**:
   - Query global upcoming anime airing schedules with timestamps, episode numbers, and titles.
   - Query specific anime next-airing episode and full episode schedule by Media ID.
2. **User Profile & Stats (`get_user_profile_stats`)**:
   - Retrieve user profile summary and detailed anime/manga statistics (scores, format breakdown, genre distribution, total count, watch/read time).
3. **Search Anime & Manga (`search_anime`, `search_manga`)**:
   - Text search across anime and manga titles with pagination (`page`, `per_page`).
   - Detailed title data (romaji, english, native, userPreferred), status, format, and IDs.
4. **Recommendations (`get_recommendation`, `list_recommendations`)**:
   - Retrieve a specific recommendation by AniList recommendation ID.
   - Retrieve community recommendations for a given anime or manga Media ID.
5. **Observability & Diagnostics (`/health`)**:
   - HTTP health check route returning server status, uptime, MCP protocol readiness, and AniList authentication status.

### Phase 2: Future Scope (Out of Current Phase)
- User list modifications (add to watching/completed, rating updates).
- Activity feed (status updates, text posts, comments).
- Forum discussions and character/staff lookups.
- Direct OAuth2 token exchange flow.

---

## 4. Technical Architecture

### 4.1 System Components
```
   +-------------------------------------------------------+
   |                      MCP Client                       |
   |           (Claude Desktop, Cursor, Agent)             |
   +-------------------------------------------------------+
                               |
              [ stdio (CLI) ]  |  [ HTTP / SSE (Docker) ]
                               v
   +-------------------------------------------------------+
   |                   AniList-MCP Server                  |
   |                                                       |
   |  +------------------+         +--------------------+  |
   |  |   MCP Registry   |         |    HTTP Router     |  |
   |  |  (Tools Handler) |         |  /health, /sse...  |  |
   |  +------------------+         +--------------------+  |
   |            \                           /              |
   |             v                         v               |
   |      +-----------------------------------------+      |
   |      |          AniList Service Layer          |      |
   |      |         (Wraps anilist-node API)        |      |
   |      +-----------------------------------------+      |
   +-------------------------------------------------------+
                               |
                   [ GraphQL HTTPS Queries ]
                               v
   +-------------------------------------------------------+
   |                  AniList GraphQL API                  |
   |               https://graphql.anilist.co              |
   +-------------------------------------------------------+
```

### 4.2 Core Stack
- **Language**: TypeScript (target: Node.js 20+ ES2022)
- **MCP Framework**: `@modelcontextprotocol/sdk`
- **Schema Validation**: `zod`
- **API Wrapper**: `anilist-node`
- **HTTP/SSE Server**: `express`
- **Testing**: `jest` / `ts-jest` + mocked GraphQL responses
- **Container**: Multi-stage `node:20-alpine`

---

## 5. Security & Environment Configuration

| Variable | Description | Required | Default |
| :--- | :--- | :--- | :--- |
| `ANILIST_TOKEN` | Bearer token for AniList GraphQL API | Optional | `null` (Public access) |
| `PORT` | Port for HTTP / SSE server | Optional | `3000` |
| `HOST` | Bind address for HTTP server | Optional | `0.0.0.0` |
| `TRANSPORT` | Transport mode (`sse` or `stdio`) | Optional | `stdio` (or `sse` in container) |
| `NODE_ENV` | Environment mode (`production`, `development`, `test`) | Optional | `production` |

---

## 6. Verification & Quality Acceptance Criteria

1. **Testing**: All unit tests pass (`npm test`) covering tool handlers, service layers, and `/health` route.
2. **Type Safety**: Zero TypeScript compilation errors (`npm run build`).
3. **Docker Build**: Docker image builds cleanly with non-root security context.
4. **Health Check**: Container responds with HTTP 200 on `/health`.
5. **CI/CD**: GitHub Actions workflow validates builds and tags `latest` on main branch merges and commits.
