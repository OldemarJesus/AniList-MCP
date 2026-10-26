import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";

export function registerAiringTools(server: McpServer, anilist: AniListService) {
  server.registerTool(
    "airing_schedule",
    {
      description:
        "Query upcoming anime broadcast schedules, episode air dates, countdown timers, or specific anime airing details",
      inputSchema: {
        anime_id: z
          .number()
          .optional()
          .describe("Optional AniList Media ID to get the schedule for a specific anime"),
        not_yet_aired: z
          .boolean()
          .default(true)
          .describe("Only return unreleased episodes (default: true)"),
        page: z.number().min(1).default(1).describe("Page number (default: 1)"),
        per_page: z
          .number()
          .min(1)
          .max(25)
          .default(10)
          .describe("Number of schedules to return (default: 10, max: 25)"),
        airing_at_greater: z
          .number()
          .optional()
          .describe("Filter airing timestamps starting after this unix timestamp (seconds)"),
        airing_at_lesser: z
          .number()
          .optional()
          .describe("Filter airing timestamps ending before this unix timestamp (seconds)"),
      },
    },
    async (args) => {
      try {
        const result = await anilist.getAiringSchedule({
          animeId: args.anime_id,
          notYetAired: args.not_yet_aired,
          page: args.page,
          perPage: args.per_page,
          airingAtGreater: args.airing_at_greater,
          airingAtLesser: args.airing_at_lesser,
        });

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
              text: `Failed to fetch airing schedule: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );
}
