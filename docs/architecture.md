# System Architecture & Design

This document details the architectural design, protocol flows, and integration patterns of **AniList-MCP**.

---

## 1. Architectural Overview

AniList-MCP serves as a bridge between AI agent orchestrators (MCP Clients) and the AniList GraphQL platform. It is structured into distinct modular layers to maximize testability, code isolation, and portability across hosting environments.

```
+-------------------------------------------------------------------+
|                        MCP Clients                                |
|  - Claude Desktop (stdio)                                         |
|  - Cursor / Antigravity IDE (stdio or SSE)                         |
|  - Container Orchestrator / Remote Agent (SSE/HTTP)               |
+-------------------------------------------------------------------+
                               |
                               | (JSON-RPC 2.0 / MCP Protocol)
                               v
+-------------------------------------------------------------------+
|                       Transport Layer                             |
|                                                                   |
|   +--------------------------+     +--------------------------+   |
|   |      StdioTransport      |     |       SSEServerTransport |   |
|   |     (Process Streams)    |     |   Express: /sse & /msgs  |   |
|   +--------------------------+     +--------------------------+   |
|                                    |    /health HTTP route    |   |
|                                    +--------------------------+   |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                     MCP Server Controller                         |
|              (@modelcontextprotocol/sdk Server)                   |
|                                                                   |
|   - Tool Registration (`tools/list`)                              |
|   - Call Routing (`tools/call`)                                   |
|   - Input Schema Validation (Zod)                                 |
|   - Unified Error Serialization                                   |
+-------------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------------+
|                      AniList Service Layer                        |
|                                                                   |
|   - `AniListService`: Wrapper around `anilist-node`               |
|   - Direct GraphQL extensions for advanced filters & schedules    |
|   - Token lifecycle & Auth header management (`ANILIST_TOKEN`)    |
|   - Response normalization & fallback sanitization                |
+-------------------------------------------------------------------+
                               |
                               | (GraphQL over HTTPS)
                               v
+-------------------------------------------------------------------+
|                  AniList GraphQL API (Remote)                     |
|                   https://graphql.anilist.co                      |
+-------------------------------------------------------------------+
```

---

## 2. Transport Layer Details

### 2.1 Stdio Transport
In `stdio` mode:
- The server communicates directly via standard input and standard output streams (`process.stdin` / `process.stdout`) using the standard MCP JSON-RPC format.
- Diagnostics, runtime logs, and debug traces are strictly piped to `process.stderr` to prevent corrupting the JSON-RPC message framing.
- Best suited for desktop-local LLM agents (Claude Desktop, Cursor).

### 2.2 Server-Sent Events (SSE) & HTTP Transport
In `sse` mode (ideal for Docker containers and cloud hosting):
- An Express HTTP server listens on `PORT` (default `3000`).
- `GET /sse`: Establishes the unidirectional event stream from server to client.
- `POST /messages`: Accepts inbound JSON-RPC client messages associated with the active session.
- `GET /health`: Independent health check endpoint for container probes (Docker, Kubernetes liveness/readiness, AWS ECS, GCP Cloud Run).

---

## 3. AniList Integration & `anilist-node` Reuse

Rather than building an AniList client from scratch, AniList-MCP reuses and builds upon the `anilist-node` package:
1. **High-Level API Wrappers**: Utilizes `anilist.user`, `anilist.searchEntry`, `anilist.media`, and `anilist.recommendation`.
2. **Custom Query Extension**: Reuses `anilist-node`'s internal HTTP dispatch engine (`util.send`) for queries not exposed by default in high-level classes (e.g. global `airingSchedules` range queries).
3. **Authentication**: If `ANILIST_TOKEN` is supplied in the environment, requests include `Authorization: Bearer <token>`, unlocking access to user-specific statistics and private lists.

---

## 4. Error Handling & Resilience

All MCP tool executions are wrapped in defensive try-catch handlers:
- **Network / API Failures**: Returns `{ isError: true, content: [{ type: "text", text: "..." }] }` instead of crashing the server process.
- **Input Validation**: Handled by Zod schemas at runtime; invalid arguments produce clear parameter validation errors.
- **Graceful Termination**: Intercepts `SIGINT` and `SIGTERM` signals, closes active HTTP/SSE connections cleanly, and releases resources.
