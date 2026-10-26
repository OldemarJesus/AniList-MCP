import dotenv from "dotenv";
import { AppConfig, TransportMode } from "./types/index.js";

// Load environment variables from .env file if available
dotenv.config();

export function loadConfig(): AppConfig {
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
    anilistToken,
    transport,
    port: isNaN(port) ? 3000 : port,
    host,
    logLevel,
  };
}

export const config = loadConfig();
