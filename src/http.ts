import express, { Request, Response } from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "./services/anilist.js";
import { AppConfig, HealthResponse } from "./types/index.js";

export function createHttpApp(
  server: McpServer,
  anilist: AniListService,
  config: AppConfig
) {
  const app = express();
  app.use(cors());

  // In-memory active SSE transports mapped by session ID
  const activeTransports = new Map<string, SSEServerTransport>();

  /**
   * Health Check Endpoint
   * Used by Docker HEALTHCHECK, Kubernetes probes, and monitoring
   */
  app.get("/health", (_req: Request, res: Response) => {
    const healthData: HealthResponse = {
      status: "ok",
      service: "anilist-mcp",
      version: "1.0.0",
      uptime: process.uptime(),
      transport: config.transport,
      authenticated: anilist.isAuthenticated(),
      timestamp: new Date().toISOString(),
    };
    res.status(200).json(healthData);
  });

  /**
   * Server-Sent Events (SSE) Stream
   */
  app.get("/sse", async (req: Request, res: Response) => {
    try {
      const transport = new SSEServerTransport("/messages", res);
      const sessionId = transport.sessionId;

      activeTransports.set(sessionId, transport);

      req.on("close", () => {
        activeTransports.delete(sessionId);
      });

      await server.connect(transport);
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to establish SSE stream" });
      }
    }
  });

  /**
   * Client Inbound JSON-RPC Message Receiver
   */
  app.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).json({ error: "Missing sessionId query parameter" });
      return;
    }

    const transport = activeTransports.get(sessionId);
    if (!transport) {
      res.status(404).json({ error: `Session not found: ${sessionId}` });
      return;
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to handle message" });
      }
    }
  });

  return { app, activeTransports };
}
