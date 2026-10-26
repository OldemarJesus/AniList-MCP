import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "./services/anilist.js";
import { registerAllTools } from "./tools/index.js";
import { AppConfig } from "./types/index.js";

export function createMcpServer(config: AppConfig, anilistService?: AniListService): {
  server: McpServer;
  anilist: AniListService;
} {
  const server = new McpServer({
    name: config.name,
    version: config.version,
  });

  const anilist = anilistService || new AniListService(config.anilistToken);

  registerAllTools(server, anilist);

  return { server, anilist };
}
