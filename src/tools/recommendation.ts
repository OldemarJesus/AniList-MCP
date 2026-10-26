import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";

export function registerRecommendationTools(server: McpServer, anilist: AniListService) {
  server.tool(
    "get_recommendation",
    "Fetch a specific AniList recommendation entry by its unique recommendation ID",
    {
      id: z.number().describe("The unique AniList recommendation ID"),
    },
    async (args) => {
      try {
        const result = await anilist.getRecommendation(args.id);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to fetch recommendation: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.tool(
    "list_recommendations",
    "List community recommendations and suggested media for a given anime or manga",
    {
      media_id: z
        .number()
        .describe("The AniList Media ID (Anime or Manga ID) to find recommendations for"),
      page: z.number().min(1).default(1).describe("Page number (default: 1)"),
      per_page: z
        .number()
        .min(1)
        .max(25)
        .default(10)
        .describe("Number of recommendations to return (default: 10, max: 25)"),
    },
    async (args) => {
      try {
        const result = await anilist.listRecommendations(args.media_id, args.page, args.per_page);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Failed to list recommendations: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );
}
