import express, { Request, Response } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "./services/anilist.js";
import { AppConfig, HealthResponse } from "./types/index.js";
import { runWithAuthContext } from "./context.js";

export async function createHttpApp(
  server: McpServer,
  anilist: AniListService,
  config: AppConfig
) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Modern Streamable HTTP Server Transport replacing deprecated SSEServerTransport
  const transport = new StreamableHTTPServerTransport();
  await server.connect(transport);

  /**
   * Health Check Endpoint
   * Used by Docker HEALTHCHECK, Kubernetes probes, and monitoring
   * Uses centralized config.name and config.version
   */
  app.get("/health", (_req: Request, res: Response) => {
    const healthData: HealthResponse = {
      status: "ok",
      service: config.name,
      version: config.version,
      uptime: process.uptime(),
      transport: config.transport,
      authenticated: anilist.isAuthenticated(),
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(healthData);
  });

  /**
   * Streamable HTTP MCP Endpoint
   * Supports standard /mcp as well as backward-compatible /sse and /messages routes.
   * Extracts Bearer token from Authorization header and binds it to the async request context.
   */
  app.all(["/mcp", "/sse", "/messages"], async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.substring(7).trim();
      }

      await runWithAuthContext({ token }, async () => {
        await transport.handleRequest(req, res, req.body);
      });
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to handle transport request" });
      }
    }
  });

  return { app, transport };
}
