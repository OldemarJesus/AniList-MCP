# Developer Guide

This guide describes local setup, testing, linting, and development workflows for contributing to **AniList-MCP**.

---

## 1. Prerequisites
- Node.js 20.x or higher
- npm 9.x or higher

---

## 2. Local Setup

```bash
# Clone repository
cd AniList-MCP

# Install dependencies
npm install

# Build TypeScript to dist/
npm run build
```

---

## 3. Running the Server

### Stdio Mode (Default for Local LLM Desktop Clients)
```bash
npm start
# or
node dist/index.js
```

### HTTP / SSE Mode (With /health Endpoint)
```bash
TRANSPORT=sse PORT=3000 npm start
```
Test the health endpoint in your browser or curl:
```bash
curl http://localhost:3000/health
```

---

## 4. Running Tests

The test suite validates tool registration, schema validation, `/health` response, and AniList GraphQL queries using mocked data.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## 5. Project Layout

```
AniList-MCP/
├── .github/
│   └── workflows/
│       └── docker-build.yml     # Automated Docker build & push on push to main
├── docs/                        # Project documentation
│   ├── api.md
│   ├── architecture.md
│   ├── development.md
│   └── docker.md
├── src/
│   ├── index.ts                 # CLI & Server Entrypoint
│   ├── server.ts                # MCP Server setup & tool registration
│   ├── http.ts                  # Express server for SSE & /health
│   ├── config.ts                # Environment and configuration
│   ├── services/
│   │   └── anilist.ts           # AniList wrapper around anilist-node
│   ├── tools/
│   │   ├── index.ts
│   │   ├── airing.ts            # Airing schedule tool
│   │   ├── user.ts              # User profile stats tool
│   │   ├── search.ts            # Search anime / manga tools
│   │   └── recommendation.ts    # Recommendations tools
│   └── types/
│       └── index.ts             # Shared interfaces and types
├── tests/
│   ├── health.test.ts           # Tests for /health endpoint
│   ├── tools.test.ts            # Tests for tool registration & execution
│   └── anilist.test.ts          # Tests for service layer
├── Dockerfile                   # Multi-stage production container
├── docker-compose.yml           # Compose specification
├── package.json
├── tsconfig.json
├── README.md
├── PRD.md
├── TLDR.md
└── AGENTS.md
```
