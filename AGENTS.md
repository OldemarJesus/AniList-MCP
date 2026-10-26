# AGENTS.md - Agent Integration & Operational Guidelines

This document provides operational instructions, architectural context, and behavioral guidelines for AI agents (including Claude Desktop, Cursor, Antigravity, and autonomous agent loops) interacting with or maintaining the **AniList-MCP** repository.

---

## 1. System Overview

AniList-MCP exposes AniList capabilities to Model Context Protocol (MCP) clients.
It wraps the `anilist-node` library and AniList's GraphQL API, providing structured JSON output adhering to standard MCP schemas.

### Primary Responsibilities
- Provide accurate and concise anime, manga, user, schedule, and recommendation data.
- Ensure resilient error handling when AniList API rate limits or network issues occur.
- Expose dual transports:
  - `stdio`: Default transport for local execution inside desktop LLM clients.
  - `sse`: HTTP server for Docker containerization with `/sse`, `/messages`, and `/health` endpoints.

---

## 2. Environment Variables

| Variable | Type | Purpose |
| :--- | :--- | :--- |
| `ANILIST_TOKEN` | string | AniList OAuth Bearer token. If omitted, public data is accessed. |
| `TRANSPORT` | `stdio` \| `sse` | Selects MCP communication transport. Default: `stdio`. |
| `PORT` | number | HTTP listen port for SSE server. Default: `3000`. |
| `HOST` | string | Listen interface. Default: `0.0.0.0`. |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` | Output verbosity. In `stdio` mode, application logs MUST be directed to `stderr` to avoid corrupting protocol packets on `stdout`. |

> **Critical Agent Rule for `stdio`**: Never write arbitrary messages to `process.stdout` in `stdio` mode! Only valid MCP JSON-RPC protocol messages are permitted on `stdout`. All diagnostic logs must go to `process.stderr` (e.g. `console.error`).

---

## 3. Tool Reference for AI Agents

When invoking AniList-MCP tools, follow these parameters:

### `airing_schedule`
- **Description**: Query upcoming anime airing schedules or next-episode data.
- **Parameters**:
  - `anime_id` (number, optional): Media ID to get the schedule for a specific anime.
  - `not_yet_aired` (boolean, optional, default: `true`): Only include unreleased future episodes.
  - `page` (number, optional, default: `1`): Pagination page.
  - `per_page` (number, optional, default: `10`, max: `25`): Items per page.
  - `airing_at_greater` (number, optional): Unix timestamp filter for starting range.
  - `airing_at_lesser` (number, optional): Unix timestamp filter for ending range.

### `get_user_profile_stats`
- **Description**: Fetch user profile and watching/reading stats.
- **Parameters**:
  - `username` (string, optional): AniList username.
  - `user_id` (number, optional): AniList user ID.
  *(Provide either `username` or `user_id`)*

### `search_anime`
- **Description**: Search anime titles by keyword.
- **Parameters**:
  - `query` (string, required): Anime title or search term.
  - `page` (number, optional, default: `1`): Result page.
  - `per_page` (number, optional, default: `10`, max: `25`): Results per page.

### `search_manga`
- **Description**: Search manga titles by keyword.
- **Parameters**:
  - `query` (string, required): Manga title or search term.
  - `page` (number, optional, default: `1`): Result page.
  - `per_page` (number, optional, default: `10`, max: `25`): Results per page.

### `get_recommendation`
- **Description**: Retrieve a specific community recommendation by its unique ID.
- **Parameters**:
  - `id` (number, required): AniList Recommendation ID.

### `list_recommendations`
- **Description**: List community recommendations for a given anime or manga media ID.
- **Parameters**:
  - `media_id` (number, required): AniList Media ID.
  - `page` (number, optional, default: `1`): Page number.
  - `per_page` (number, optional, default: `10`, max: `25`): Results per page.

---

## 4. Diagnostics & Health Check

When running in HTTP / SSE mode:
- **`GET /health`**: Returns:
  ```json
  {
    "status": "ok",
    "service": "anilist-mcp",
    "version": "1.0.0",
    "uptime": 124.5,
    "transport": "sse",
    "authenticated": true
  }
  ```
- **`GET /sse`**: MCP SSE connection stream endpoint.
- **`POST /messages`**: MCP client message delivery endpoint.

---

## 5. Development & Contribution Standards

- **Language & Runtime**: TypeScript on Node.js 20+.
- **Packaging**: Containerized with Docker; build verification via Jest unit tests.
- **Library Dependency**: Extends `anilist-node` via typed services.
- **Error Formatting**: Always catch GraphQL and network errors and return user-friendly, structured MCP error payloads with `isError: true` rather than crashing the process.
