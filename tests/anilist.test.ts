import { jest } from "@jest/globals";
import { AniListService } from "../src/services/anilist.js";

describe("AniListService", () => {
  describe("Authentication", () => {
    it("should return false when no token is set", () => {
      const service = new AniListService();
      expect(service.isAuthenticated()).toBe(false);
    });

    it("should return true when a non-empty token is set", () => {
      const service = new AniListService("sample-anilist-token");
      expect(service.isAuthenticated()).toBe(true);
    });

    it("should return false when an empty token string is set", () => {
      const service = new AniListService("");
      expect(service.isAuthenticated()).toBe(false);
    });
  });

  describe("Validation Errors", () => {
    const service = new AniListService();

    it("should reject empty query for searchAnime", async () => {
      await expect(service.searchAnime("")).rejects.toThrow("Search query cannot be empty");
      await expect(service.searchAnime("   ")).rejects.toThrow("Search query cannot be empty");
    });

    it("should reject empty query for searchManga", async () => {
      await expect(service.searchManga("")).rejects.toThrow("Search query cannot be empty");
    });

    it("should reject missing user identifier for getUserProfileStats", async () => {
      await expect(service.getUserProfileStats("" as any)).rejects.toThrow(
        "User identifier (username or user_id) is required"
      );
    });

    it("should reject invalid recommendation ID", async () => {
      await expect(service.getRecommendation(0)).rejects.toThrow(
        "Valid recommendation ID is required"
      );
    });

    it("should reject invalid media ID for listRecommendations", async () => {
      await expect(service.listRecommendations(0)).rejects.toThrow("Valid media ID is required");
    });
  });

  describe("Mocked API interactions", () => {
    let service: AniListService;
    let mockClient: any;

    beforeEach(() => {
      service = new AniListService();
      mockClient = {
        searchEntry: {
          anime: jest.fn(),
          manga: jest.fn(),
        },
        user: {
          all: jest.fn(),
        },
        media: {
          anime: jest.fn(),
        },
        recommendation: {
          get: jest.fn(),
          getList: jest.fn(),
        },
        __util: {
          send: jest.fn(),
        },
      };
      (service as any).client = mockClient;
    });

    it("searchAnime delegates to client.searchEntry.anime with sanitized pagination", async () => {
      const mockResult = { pageInfo: { total: 1 }, media: [{ id: 1, title: { romaji: "Cowboy Bebop" } }] };
      mockClient.searchEntry.anime.mockResolvedValue(mockResult);

      const result = await service.searchAnime("Bebop", 1, 5);

      expect(mockClient.searchEntry.anime).toHaveBeenCalledWith("Bebop", null, 1, 5);
      expect(result).toEqual(mockResult);
    });

    it("searchManga delegates to client.searchEntry.manga with capped perPage", async () => {
      const mockResult = { pageInfo: { total: 1 }, media: [{ id: 2, title: { romaji: "Berserk" } }] };
      mockClient.searchEntry.manga.mockResolvedValue(mockResult);

      const result = await service.searchManga("Berserk", -1, 100);

      expect(mockClient.searchEntry.manga).toHaveBeenCalledWith("Berserk", null, 1, 25);
      expect(result).toEqual(mockResult);
    });

    it("getUserProfileStats extracts profile and stats", async () => {
      const mockUser = {
        id: 1234,
        name: "TestOtaku",
        about: "Hello world",
        avatar: { large: "avatar.jpg" },
        bannerImage: "banner.jpg",
        siteUrl: "https://anilist.co/user/TestOtaku",
        updatedAt: 12345678,
        statistics: {
          anime: { count: 50, meanScore: 85 },
          manga: { count: 20, meanScore: 80 },
        },
      };
      mockClient.user.all.mockResolvedValue(mockUser);

      const result = await service.getUserProfileStats("TestOtaku");

      expect(mockClient.user.all).toHaveBeenCalledWith("TestOtaku");
      expect(result.profile.name).toBe("TestOtaku");
      expect(result.stats.anime.count).toBe(50);
    });

    it("getAiringSchedule queries media.anime when animeId is provided", async () => {
      const mockMedia = {
        id: 16498,
        title: { romaji: "Attack on Titan" },
        status: "FINISHED",
        format: "TV",
        nextAiringEpisode: null,
        airingSchedule: [],
      };
      mockClient.media.anime.mockResolvedValue(mockMedia);

      const result = await service.getAiringSchedule({ animeId: 16498 });

      expect(mockClient.media.anime).toHaveBeenCalledWith(16498);
      expect(result.title.romaji).toBe("Attack on Titan");
    });

    it("getAiringSchedule queries __util.send when animeId is not provided", async () => {
      const mockPage = {
        pageInfo: { total: 10 },
        airingSchedules: [{ id: 101, episode: 1, airingAt: 1234567 }],
      };
      mockClient.__util.send.mockResolvedValue({ Page: mockPage });

      const result = await service.getAiringSchedule({ notYetAired: true, page: 2, perPage: 15 });

      expect(mockClient.__util.send).toHaveBeenCalled();
      expect(result).toEqual(mockPage);
    });

    it("getRecommendation returns recommendation details", async () => {
      const mockRec = { id: 777, rating: 50, media: { id: 1 }, mediaRecommendation: { id: 2 } };
      mockClient.recommendation.get.mockResolvedValue(mockRec);

      const result = await service.getRecommendation(777);

      expect(mockClient.recommendation.get).toHaveBeenCalledWith(777);
      expect(result).toEqual(mockRec);
    });

    it("listRecommendations returns media recommendations", async () => {
      const mockList = { media: { id: 1 }, recommendations: [] };
      mockClient.recommendation.getList.mockResolvedValue(mockList);

      const result = await service.listRecommendations(1, 1, 10);

      expect(mockClient.recommendation.getList).toHaveBeenCalledWith(1, 1, 10);
      expect(result).toEqual(mockList);
    });
  });
});
