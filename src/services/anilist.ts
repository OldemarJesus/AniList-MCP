import AniList from "anilist-node";
import { AiringFilterOptions } from "../types/index.js";
import { getCurrentToken } from "../context.js";

export class AniListService {
  private defaultClient: any;
  private defaultToken?: string;

  constructor(token?: string) {
    this.defaultToken = token;
    this.defaultClient = new (AniList as any)(token || null, { timeout: 15000 });
  }

  public get client(): any {
    return this.getClient();
  }

  public set client(customClient: any) {
    this.defaultClient = customClient;
  }

  public getActiveToken(): string | undefined {
    return getCurrentToken() || this.defaultToken;
  }

  public getClient(): any {
    const contextToken = getCurrentToken();
    if (contextToken) {
      return new (AniList as any)(contextToken, { timeout: 15000 });
    }
    return this.defaultClient;
  }

  public isAuthenticated(): boolean {
    const token = this.getActiveToken();
    return Boolean(token && token.length > 0);
  }

  /**
   * Directly fetch from AniList GraphQL API without passing through anilist-node's
   * internal response interceptor (which throws on Viewer queries).
   */
  public async fetchGraphQL(query: string, variables?: Record<string, any>): Promise<any> {
    const token = this.getActiveToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers,
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });

      const json: any = await response.json();
      if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors.map((e: any) => e.message).join(", "));
      }

      return json.data;
    } finally {
      clearTimeout(timeout);
    }
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
    return await this.getClient().searchEntry.anime(query.trim(), null, safePage, safePerPage);
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
    return await this.getClient().searchEntry.manga(query.trim(), null, safePage, safePerPage);
  }

  /**
   * Fetch user profile and viewing/reading statistics
   */
  public async getUserProfileStats(user: string | number) {
    if (!user) {
      throw new Error("User identifier (username or user_id) is required");
    }
    const userData = await this.getClient().user.all(user);
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
      const media = await this.getClient().media.anime(animeId);
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

    const response = await this.getClient().__util.send(query, variables);
    return response?.Page || response;
  }

  /**
   * Fetch currently authenticated user profile (Viewer)
   */
  public async getViewerProfile() {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required. Please authenticate via OAuth or provide an ANILIST_TOKEN.");
    }

    const query = `
      query {
        Viewer {
          id
          name
          about
          avatar {
            large
            medium
          }
          bannerImage
          siteUrl
          unreadNotificationCount
          donatorTier
          options {
            titleLanguage
            displayAdultContent
          }
          mediaListOptions {
            scoreFormat
          }
          statistics {
            anime {
              count
              meanScore
              standardDeviation
              minutesWatched
              episodesWatched
            }
            manga {
              count
              meanScore
              standardDeviation
              chaptersRead
              volumesRead
            }
          }
        }
      }
    `;

    const response = await this.fetchGraphQL(query);
    return response?.Viewer || response;
  }

  /**
   * Fetch authenticated user's anime or manga list entries
   */
  public async getViewerMediaList(type: "ANIME" | "MANGA" = "ANIME", status?: string) {
    if (!this.isAuthenticated()) {
      throw new Error("Authentication required. Please authenticate via OAuth or provide an ANILIST_TOKEN.");
    }

    const query = `
      query ($userId: Int, $type: MediaType, $status: MediaListStatus) {
        MediaListCollection (userId: $userId, type: $type, status: $status) {
          lists {
            name
            isCustomList
            isCompletedList: status
            entries {
              id
              mediaId
              status
              score
              progress
              progressVolumes
              repeat
              private
              notes
              updatedAt
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
                episodes
                chapters
                coverImage {
                  medium
                  large
                }
              }
            }
          }
        }
      }
    `;

    // First get Viewer ID
    const viewer = await this.getViewerProfile();
    const variables: Record<string, any> = {
      userId: viewer.id,
      type,
    };
    if (status) {
      variables.status = status;
    }

    const response = await this.fetchGraphQL(query, variables);
    return response?.MediaListCollection || response;
  }

  /**
   * Fetch a single recommendation by its unique ID
   */
  public async getRecommendation(recommendationId: number) {
    if (!recommendationId || typeof recommendationId !== "number") {
      throw new Error("Valid recommendation ID is required");
    }
    const result = await this.getClient().recommendation.get(recommendationId);
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
    return await this.getClient().recommendation.getList(mediaId, safePage, safePerPage);
  }
}
