export type TransportMode = "stdio" | "sse";

export interface AppConfig {
  name: string;
  version: string;
  anilistToken?: string;
  transport: TransportMode;
  port: number;
  host: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  service: string;
  version: string;
  uptime: number;
  transport: TransportMode;
  authenticated: boolean;
  timestamp: string;
}

export interface AiringFilterOptions {
  animeId?: number;
  notYetAired?: boolean;
  page?: number;
  perPage?: number;
  airingAtGreater?: number;
  airingAtLesser?: number;
}
