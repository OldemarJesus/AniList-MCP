import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";

export function registerUserTools(server: McpServer, anilist: AniListService) {
  server.tool(
    "get_user_profile_stats",
    "Fetch an AniList user's profile information, avatar, banner, and in-depth anime watching / manga reading statistics",
    {
      username: z
        .string()
        .optional()
        .describe("The AniList username (e.g., 'joshjoshjosh')"),
      user_id: z
        .number()
        .optional()
        .describe("The AniList numerical user ID (e.g., 6820382)"),
    },
    async (args) => {
      try {
        const identifier = args.username || args.user_id;
        if (!identifier) {
          return {
            isError: true,
            content: [
              {
                type: "text",
                text: "Please provide either 'username' or 'user_id' parameter.",
              },
            ],
          };
        }

        const result = await anilist.getUserProfileStats(identifier);

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
              text: `Failed to fetch user profile stats: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );
}
