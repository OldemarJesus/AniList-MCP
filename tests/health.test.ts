import request from "supertest";
import { createHttpApp } from "../src/http.js";
import { createMcpServer } from "../src/server.js";
import { AniListService } from "../src/services/anilist.js";
import { AppConfig } from "../src/types/index.js";

describe("HTTP Endpoints", () => {
  const baseConfig: AppConfig = {
    transport: "sse",
    port: 3000,
    host: "0.0.0.0",
    logLevel: "info",
  };

  describe("GET /health", () => {
    it("should return 200 OK with healthy status and authenticated: false when no token is provided", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = createHttpApp(server, anilistService, baseConfig);

      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: "ok",
        service: "anilist-mcp",
        version: "1.0.0",
        transport: "sse",
        authenticated: false,
      });
      expect(typeof res.body.uptime).toBe("number");
      expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
    });

    it("should return authenticated: true when ANILIST_TOKEN is provided", async () => {
      const configWithToken: AppConfig = {
        ...baseConfig,
        anilistToken: "test-valid-bearer-token",
      };
      const anilistService = new AniListService(configWithToken.anilistToken);
      const { server } = createMcpServer(configWithToken, anilistService);
      const { app } = createHttpApp(server, anilistService, configWithToken);

      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.authenticated).toBe(true);
    });
  });

  describe("POST /messages", () => {
    it("should return 400 when sessionId is missing", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = createHttpApp(server, anilistService, baseConfig);

      const res = await request(app).post("/messages").send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toContain("Missing sessionId");
    });

    it("should return 404 when session is not found", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = createHttpApp(server, anilistService, baseConfig);

      const res = await request(app).post("/messages?sessionId=unknown-session-123").send({});
      expect(res.status).toBe(404);
      expect(res.body.error).toContain("Session not found");
    });
  });
});
