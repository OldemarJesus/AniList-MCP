import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";
import { registerAiringTools } from "./airing.js";
import { registerUserTools } from "./user.js";
import { registerSearchTools } from "./search.js";
import { registerRecommendationTools } from "./recommendation.js";

export function registerAllTools(server: McpServer, anilist: AniListService) {
  registerAiringTools(server, anilist);
  registerUserTools(server, anilist);
  registerSearchTools(server, anilist);
  registerRecommendationTools(server, anilist);
}
