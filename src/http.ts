import express, { Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "./services/anilist.js";
import { AppConfig, HealthResponse } from "./types/index.js";
import { runWithAuthContext } from "./context.js";
import { createMcpServer } from "./server.js";

export async function createHttpApp(
  server: McpServer,
  anilist: AniListService,
  config: AppConfig
) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // In-memory registry of active client/user sessions for Streamable HTTP
  const activeSessions = new Map<
    string,
    { transport: StreamableHTTPServerTransport; server: McpServer }
  >();

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
   * Manages per-session transports so multiple users or reconnects do not trigger "Server already initialized".
   */
  app.all(["/mcp", "/sse", "/messages"], async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      let token: string | undefined;

      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.substring(7).trim();
      }

      const sessionIdHeader = req.headers["mcp-session-id"] as string | undefined;

      let session = sessionIdHeader ? activeSessions.get(sessionIdHeader) : undefined;

      if (!session) {
        // Create new transport and server instance for new connection / initialization
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessionclosed: (sessionId: string) => {
            activeSessions.delete(sessionId);
          },
        });

        const instance = createMcpServer(config, anilist);
        await instance.server.connect(transport);

        session = { transport, server: instance.server };
      }

      const { transport } = session;

      await runWithAuthContext({ token }, async () => {
        await transport.handleRequest(req, res, req.body);
      });

      if (transport.sessionId && !activeSessions.has(transport.sessionId)) {
        activeSessions.set(transport.sessionId, session);
      }
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to handle transport request" });
      }
    }
  });

  return { app };
}
