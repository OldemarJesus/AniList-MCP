import AniList from "anilist-node";
import { AiringFilterOptions } from "../types/index.js";

export class AniListService {
  private client: any;
  private token?: string;

  constructor(token?: string) {
    this.token = token;
    // anilist-node accepts accessKey and options
    this.client = new (AniList as any)(token || null, { timeout: 15000 });
  }

  public isAuthenticated(): boolean {
    return Boolean(this.token && this.token.length > 0);
  }

  /**
   * Search for anime titles with pagination
   */
  public async searchAnime(query: string, page = 1, perPage = 10) {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(Math.max(1, perPage), 25);
    return await this.client.searchEntry.anime(query.trim(), null, safePage, safePerPage);
  }

  /**
   * Search for manga titles with pagination
   */
  public async searchManga(query: string, page = 1, perPage = 10) {
    if (!query || query.trim().length === 0) {
      throw new Error("Search query cannot be empty");
    }
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(Math.max(1, perPage), 25);
    return await this.client.searchEntry.manga(query.trim(), null, safePage, safePerPage);
  }

  /**
   * Fetch user profile and viewing/reading statistics
   */
  public async getUserProfileStats(user: string | number) {
    if (!user) {
      throw new Error("User identifier (username or user_id) is required");
    }
    const userData = await this.client.user.all(user);
    if (!userData) {
      throw new Error(`User '${user}' not found`);
    }

    return {
      profile: {
        id: userData.id,
        name: userData.name,
        about: userData.about,
        avatar: userData.avatar,
        bannerImage: userData.bannerImage,
        siteUrl: userData.siteUrl,
        updatedAt: userData.updatedAt,
      },
      stats: userData.statistics,
    };
  }

  /**
   * Fetch airing schedule
   */
  public async getAiringSchedule(options: AiringFilterOptions = {}) {
    const { animeId, notYetAired = true, page = 1, perPage = 10, airingAtGreater, airingAtLesser } = options;
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(Math.max(1, perPage), 25);

    // If specific anime ID is queried, fetch media-specific airing info
    if (animeId && typeof animeId === "number") {
      const media = await this.client.media.anime(animeId);
      if (!media) {
        throw new Error(`Anime with ID ${animeId} not found`);
      }
      return {
        animeId: media.id,
        title: media.title,
        status: media.status,
        format: media.format,
        nextAiringEpisode: media.nextAiringEpisode,
        airingSchedule: media.airingSchedule,
      };
    }

    // Otherwise, query AniList's global airing schedule
    const query = `
      query ($page: Int, $perPage: Int, $notYetAired: Boolean, $airingAt_greater: Int, $airingAt_lesser: Int) {
        Page (page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          airingSchedules (
            notYetAired: $notYetAired,
            airingAt_greater: $airingAt_greater,
            airingAt_lesser: $airingAt_lesser,
            sort: TIME
          ) {
            id
            episode
            airingAt
            timeUntilAiring
            mediaId
            media {
              id
              title {
                romaji
                english
                native
                userPreferred
              }
              format
              status
              coverImage {
                medium
                large
              }
            }
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      page: safePage,
      perPage: safePerPage,
      notYetAired,
    };

    if (airingAtGreater !== undefined) {
      variables.airingAt_greater = airingAtGreater;
    }
    if (airingAtLesser !== undefined) {
      variables.airingAt_lesser = airingAtLesser;
    }

    const response = await this.client.__util.send(query, variables);
    return response?.Page || response;
  }

  /**
   * Fetch a single recommendation by its unique ID
   */
  public async getRecommendation(recommendationId: number) {
    if (!recommendationId || typeof recommendationId !== "number") {
      throw new Error("Valid recommendation ID is required");
    }
    const result = await this.client.recommendation.get(recommendationId);
    if (!result) {
      throw new Error(`Recommendation with ID ${recommendationId} not found`);
    }
    return result;
  }

  /**
   * List recommendations for a given media (anime or manga)
   */
  public async listRecommendations(mediaId: number, page = 1, perPage = 10) {
    if (!mediaId || typeof mediaId !== "number") {
      throw new Error("Valid media ID is required");
    }
    const safePage = Math.max(1, page);
    const safePerPage = Math.min(Math.max(1, perPage), 25);
    return await this.client.recommendation.getList(mediaId, safePage, safePerPage);
  }
}
