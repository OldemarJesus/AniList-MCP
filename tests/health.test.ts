import request from "supertest";
import { createHttpApp } from "../src/http.js";
import { createMcpServer } from "../src/server.js";
import { AniListService } from "../src/services/anilist.js";
import { AppConfig } from "../src/types/index.js";

describe("HTTP Endpoints & Health Check", () => {
  const baseConfig: AppConfig = {
    name: "test-anilist-mcp",
    version: "2.1.0",
    transport: "sse",
    port: 3000,
    host: "0.0.0.0",
    logLevel: "info",
  };

  describe("GET /health", () => {
    it("should return 200 OK with dynamically configured service name and version", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = await createHttpApp(server, anilistService, baseConfig);

      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: "ok",
        service: baseConfig.name,
        version: baseConfig.version,
        transport: baseConfig.transport,
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
      const { app } = await createHttpApp(server, anilistService, configWithToken);

      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.service).toBe(configWithToken.name);
      expect(res.body.version).toBe(configWithToken.version);
      expect(res.body.authenticated).toBe(true);
    });
  });

  describe("Streamable HTTP MCP Endpoints", () => {
    it("should process Streamable HTTP initialize request on /mcp with proper Accept header", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = await createHttpApp(server, anilistService, baseConfig);

      const res = await request(app)
        .post("/mcp")
        .set("Accept", "application/json, text/event-stream")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          id: 1,
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "test-client", version: "1.0.0" },
          },
        });

      expect(res.status).toBe(200);
    });

    it("should accept Authorization Bearer header without error on /mcp", async () => {
      const anilistService = new AniListService();
      const { server } = createMcpServer(baseConfig, anilistService);
      const { app } = await createHttpApp(server, anilistService, baseConfig);

      const res = await request(app)
        .post("/mcp")
        .set("Authorization", "Bearer user-oauth-access-token")
        .set("Accept", "application/json, text/event-stream")
        .send({
          jsonrpc: "2.0",
          method: "initialize",
          id: 2,
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "librechat-client", version: "1.0.0" },
          },
        });

      expect(res.status).toBe(200);
    });
  });
});

