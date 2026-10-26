# API & Tool Reference

This document outlines the endpoints and tools exposed by **AniList-MCP**.

---

## 1. HTTP Endpoints (SSE Mode)

When running with `TRANSPORT=sse`:

### `GET /health`
Returns the operational health and configuration state of the MCP server.

**Response `200 OK`**:
```json
{
  "status": "ok",
  "service": "anilist-mcp",
  "version": "1.0.0",
  "uptime": 240.12,
  "transport": "sse",
  "authenticated": true,
  "timestamp": "2026-10-26T04:25:00.000Z"
}
```

### `GET /sse`
Establishes the Server-Sent Events stream for MCP communication. Clients receive session identifiers and push notifications.

### `POST /messages`
Submits MCP JSON-RPC protocol requests from the client.

---

## 2. MCP Tools Reference

### 2.1 `airing_schedule`
Fetches upcoming anime episodes, air times, and countdown seconds. Can query global upcoming broadcasts or focus on a specific anime ID.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "anime_id": {
      "type": "number",
      "description": "Optional AniList Media ID to get the schedule for a specific anime"
    },
    "not_yet_aired": {
      "type": "boolean",
      "default": true,
      "description": "Only return episodes that have not yet aired"
    },
    "page": {
      "type": "number",
      "default": 1,
      "description": "Page number (1-indexed)"
    },
    "per_page": {
      "type": "number",
      "default": 10,
      "maximum": 25,
      "description": "Number of results per page (max 25)"
    },
    "airing_at_greater": {
      "type": "number",
      "description": "Unix timestamp in seconds for start of airing range"
    },
    "airing_at_lesser": {
      "type": "number",
      "description": "Unix timestamp in seconds for end of airing range"
    }
  }
}
```

**Output Example**:
```json
{
  "pageInfo": { "currentPage": 1, "hasNextPage": true, "total": 120 },
  "schedules": [
    {
      "id": 982143,
      "episode": 5,
      "airingAt": 1793012400,
      "timeUntilAiring": 3600,
      "media": {
        "id": 16498,
        "title": { "romaji": "Sousou no Frieren", "english": "Frieren: Beyond Journey's End" },
        "status": "RELEASING"
      }
    }
  ]
}
```

---

### 2.2 `get_user_profile_stats`
Fetches an AniList user's public profile, anime watching stats, manga reading stats, favorite genres, and score distributions.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "username": {
      "type": "string",
      "description": "AniList username"
    },
    "user_id": {
      "type": "number",
      "description": "AniList user ID"
    }
  }
}
```
*(At least one of `username` or `user_id` must be provided)*

**Output Example**:
```json
{
  "profile": {
    "id": 12345,
    "name": "OtakuMaster",
    "avatar": { "large": "https://..." },
    "bannerImage": "https://...",
    "siteUrl": "https://anilist.co/user/OtakuMaster"
  },
  "stats": {
    "anime": {
      "count": 142,
      "meanScore": 81.5,
      "minutesWatched": 182400,
      "episodesWatched": 7600
    },
    "manga": {
      "count": 55,
      "meanScore": 79.2,
      "chaptersRead": 1200
    }
  }
}
```

---

### 2.3 `search_anime`
Searches anime entries by title or keyword.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Anime title or keyword to search"
    },
    "page": {
      "type": "number",
      "default": 1,
      "description": "Page number"
    },
    "per_page": {
      "type": "number",
      "default": 10,
      "maximum": 25,
      "description": "Number of results (max 25)"
    }
  },
  "required": ["query"]
}
```

---

### 2.4 `search_manga`
Searches manga entries by title or keyword.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Manga title or keyword to search"
    },
    "page": {
      "type": "number",
      "default": 1,
      "description": "Page number"
    },
    "per_page": {
      "type": "number",
      "default": 10,
      "maximum": 25,
      "description": "Number of results (max 25)"
    }
  },
  "required": ["query"]
}
```

---

### 2.5 `get_recommendation`
Fetches a specific recommendation entry using its unique recommendation ID.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "number",
      "description": "AniList Recommendation ID"
    }
  },
  "required": ["id"]
}
```

---

### 2.6 `list_recommendations`
Lists community recommendations for a given media item (anime or manga) ordered by community rating.

**Input Parameters**:
```json
{
  "type": "object",
  "properties": {
    "media_id": {
      "type": "number",
      "description": "AniList Media ID (Anime or Manga ID)"
    },
    "page": {
      "type": "number",
      "default": 1,
      "description": "Page number"
    },
    "per_page": {
      "type": "number",
      "default": 10,
      "maximum": 25,
      "description": "Results per page (max 25)"
    }
  },
  "required": ["media_id"]
}
```
