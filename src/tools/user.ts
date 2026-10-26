import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";

export function registerUserTools(server: McpServer, anilist: AniListService) {
  server.registerTool(
    "get_user_profile_stats",
    {
      description:
        "Fetch an AniList user's profile information, avatar, banner, and in-depth anime watching / manga reading statistics",
      inputSchema: {
        username: z
          .string()
          .optional()
          .describe("The AniList username (e.g., 'joshjoshjosh')"),
        user_id: z
          .number()
          .optional()
          .describe("The AniList numerical user ID (e.g., 6820382)"),
      },
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

  server.registerTool(
    "get_my_profile",
    {
      description:
        "Fetch the currently authenticated AniList user's profile, unread notification count, and anime/manga stats via OAuth/bearer token",
      inputSchema: {},
    },
    async () => {
      try {
        const result = await anilist.getViewerProfile();
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
              text: `Failed to fetch authenticated user profile: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "get_my_media_list",
    {
      description:
        "Fetch the authenticated user's personal anime or manga list entries (including status, scores, progress, notes, and private entries)",
      inputSchema: {
        type: z
          .enum(["ANIME", "MANGA"])
          .default("ANIME")
          .describe("MediaType: 'ANIME' or 'MANGA' (default: 'ANIME')"),
        status: z
          .enum(["CURRENT", "PLANNING", "COMPLETED", "DROPPED", "PAUSED", "REPEATING"])
          .optional()
          .describe("Filter by list status (e.g., 'CURRENT', 'COMPLETED', 'PLANNING')"),
      },
    },
    async (args) => {
      try {
        const result = await anilist.getViewerMediaList(args.type, args.status);
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
              text: `Failed to fetch authenticated user media list: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );
}
