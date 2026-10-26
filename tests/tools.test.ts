import { jest } from "@jest/globals";
import { createMcpServer } from "../src/server.js";
import { AniListService } from "../src/services/anilist.js";
import { AppConfig } from "../src/types/index.js";

describe("MCP Tools Registration and Handling", () => {
  const config: AppConfig = {
    name: "anilist-mcp",
    version: "1.0.0",
    transport: "stdio",
    port: 3000,
    host: "0.0.0.0",
    logLevel: "info",
  };

  let anilistMock: any;
  let server: any;

  beforeEach(() => {
    anilistMock = {
      isAuthenticated: jest.fn().mockReturnValue(false),
      searchAnime: jest.fn(),
      searchManga: jest.fn(),
      getUserProfileStats: jest.fn(),
      getAiringSchedule: jest.fn(),
      getRecommendation: jest.fn(),
      listRecommendations: jest.fn(),
    };

    const created = createMcpServer(config, anilistMock as unknown as AniListService);
    server = created.server;
  });

  it("should successfully register all 6 required tools", () => {
    const registered = Object.keys(server._registeredTools);
    expect(registered).toEqual([
      "airing_schedule",
      "get_user_profile_stats",
      "search_anime",
      "search_manga",
      "get_recommendation",
      "list_recommendations",
    ]);
  });

  describe("search_anime", () => {
    it("returns formatted text result on success", async () => {
      const mockResult = { media: [{ id: 1, title: { romaji: "Frieren" } }] };
      anilistMock.searchAnime.mockResolvedValue(mockResult);

      const handler = server._registeredTools["search_anime"].handler;
      const res = await handler({ query: "Frieren", page: 1, per_page: 5 });

      expect(res.content[0].text).toContain("Frieren");
      expect(JSON.parse(res.content[0].text)).toEqual(mockResult);
    });

    it("returns error payload when service throws", async () => {
      anilistMock.searchAnime.mockRejectedValue(new Error("API Down"));

      const handler = server._registeredTools["search_anime"].handler;
      const res = await handler({ query: "Frieren", page: 1, per_page: 5 });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("API Down");
    });
  });

  describe("search_manga", () => {
    it("returns formatted text result on success", async () => {
      const mockResult = { media: [{ id: 2, title: { romaji: "Berserk" } }] };
      anilistMock.searchManga.mockResolvedValue(mockResult);

      const handler = server._registeredTools["search_manga"].handler;
      const res = await handler({ query: "Berserk", page: 1, per_page: 5 });

      expect(JSON.parse(res.content[0].text)).toEqual(mockResult);
    });

    it("returns error payload when service throws", async () => {
      anilistMock.searchManga.mockRejectedValue(new Error("Manga error"));

      const handler = server._registeredTools["search_manga"].handler;
      const res = await handler({ query: "Berserk", page: 1, per_page: 5 });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Manga error");
    });
  });

  describe("airing_schedule", () => {
    it("returns formatted text result on success", async () => {
      const mockResult = { schedules: [{ id: 10, episode: 1 }] };
      anilistMock.getAiringSchedule.mockResolvedValue(mockResult);

      const handler = server._registeredTools["airing_schedule"].handler;
      const res = await handler({ not_yet_aired: true, page: 1, per_page: 10 });

      expect(JSON.parse(res.content[0].text)).toEqual(mockResult);
    });

    it("returns error payload when service throws", async () => {
      anilistMock.getAiringSchedule.mockRejectedValue(new Error("Schedule unavailable"));

      const handler = server._registeredTools["airing_schedule"].handler;
      const res = await handler({ not_yet_aired: true, page: 1, per_page: 10 });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Schedule unavailable");
    });
  });

  describe("get_user_profile_stats", () => {
    it("returns error if neither username nor user_id is given", async () => {
      const handler = server._registeredTools["get_user_profile_stats"].handler;
      const res = await handler({});

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Please provide either 'username' or 'user_id'");
    });

    it("returns formatted stats on success with username", async () => {
      const mockStats = { profile: { id: 1, name: "Otaku" }, stats: {} };
      anilistMock.getUserProfileStats.mockResolvedValue(mockStats);

      const handler = server._registeredTools["get_user_profile_stats"].handler;
      const res = await handler({ username: "Otaku" });

      expect(JSON.parse(res.content[0].text)).toEqual(mockStats);
    });

    it("returns error payload when service throws", async () => {
      anilistMock.getUserProfileStats.mockRejectedValue(new Error("User not found"));

      const handler = server._registeredTools["get_user_profile_stats"].handler;
      const res = await handler({ username: "NonExistent" });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("User not found");
    });
  });

  describe("recommendations", () => {
    it("get_recommendation returns single recommendation details", async () => {
      const mockRec = { id: 999, rating: 120 };
      anilistMock.getRecommendation.mockResolvedValue(mockRec);

      const handler = server._registeredTools["get_recommendation"].handler;
      const res = await handler({ id: 999 });

      expect(JSON.parse(res.content[0].text)).toEqual(mockRec);
    });

    it("get_recommendation returns error when not found", async () => {
      anilistMock.getRecommendation.mockRejectedValue(new Error("Not found"));

      const handler = server._registeredTools["get_recommendation"].handler;
      const res = await handler({ id: 999999 });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Not found");
    });

    it("list_recommendations returns media recommendations", async () => {
      const mockList = { media: { id: 50 }, recommendations: [] };
      anilistMock.listRecommendations.mockResolvedValue(mockList);

      const handler = server._registeredTools["list_recommendations"].handler;
      const res = await handler({ media_id: 50, page: 1, per_page: 5 });

      expect(JSON.parse(res.content[0].text)).toEqual(mockList);
    });

    it("list_recommendations returns error when query fails", async () => {
      anilistMock.listRecommendations.mockRejectedValue(new Error("Failed list"));

      const handler = server._registeredTools["list_recommendations"].handler;
      const res = await handler({ media_id: 50 });

      expect(res.isError).toBe(true);
      expect(res.content[0].text).toContain("Failed list");
    });
  });
});
