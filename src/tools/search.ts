import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AniListService } from "../services/anilist.js";

export function registerSearchTools(server: McpServer, anilist: AniListService) {
  server.registerTool(
    "search_anime",
    {
      description: "Search for anime titles on AniList by title or keywords with pagination",
      inputSchema: {
        query: z.string().min(1).describe("The anime title or keyword to search for"),
        page: z.number().min(1).default(1).describe("Page number (default: 1)"),
        per_page: z
          .number()
          .min(1)
          .max(25)
          .default(10)
          .describe("Number of results to return (default: 10, max: 25)"),
      },
    },
    async (args) => {
      try {
        const result = await anilist.searchAnime(args.query, args.page, args.per_page);
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
              text: `Anime search failed: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );

  server.registerTool(
    "search_manga",
    {
      description:
        "Search for manga, manhwa, or light novels on AniList by title or keywords with pagination",
      inputSchema: {
        query: z.string().min(1).describe("The manga title or keyword to search for"),
        page: z.number().min(1).default(1).describe("Page number (default: 1)"),
        per_page: z
          .number()
          .min(1)
          .max(25)
          .default(10)
          .describe("Number of results to return (default: 10, max: 25)"),
      },
    },
    async (args) => {
      try {
        const result = await anilist.searchManga(args.query, args.page, args.per_page);
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
              text: `Manga search failed: ${error.message || String(error)}`,
            },
          ],
        };
      }
    }
  );
}
