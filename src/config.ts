import dotenv from "dotenv";
import { AppConfig, TransportMode } from "./types/index.js";

// Load environment variables from .env file if available
dotenv.config();

export const DEFAULT_SERVER_NAME = "anilist-mcp";
export const DEFAULT_SERVER_VERSION = "1.0.0";

export function loadConfig(): AppConfig {
  const name = process.env.MCP_SERVER_NAME || DEFAULT_SERVER_NAME;
  const version = process.env.MCP_SERVER_VERSION || DEFAULT_SERVER_VERSION;

  const rawTransport = (process.env.TRANSPORT || "stdio").toLowerCase();
  const transport: TransportMode = rawTransport === "sse" ? "sse" : "stdio";

  const port = parseInt(process.env.PORT || "3000", 10);
  const host = process.env.HOST || "0.0.0.0";
  const anilistToken = process.env.ANILIST_TOKEN?.trim() || undefined;

  const validLogLevels = ["debug", "info", "warn", "error"] as const;
  const rawLogLevel = (process.env.LOG_LEVEL || "info").toLowerCase();
  const logLevel = validLogLevels.includes(rawLogLevel as any)
    ? (rawLogLevel as AppConfig["logLevel"])
    : "info";

  return {
    name,
    version,
    anilistToken,
    transport,
    port: isNaN(port) ? 3000 : port,
    host,
    logLevel,
  };
}

export const config = loadConfig();
