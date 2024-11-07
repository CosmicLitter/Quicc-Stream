import { PUBLIC_DESTINY_API_KEY } from '$env/static/public';
import type { RequestEvent } from '@sveltejs/kit';

interface DestinyAPIError {
  code: number;
  message: string;
}

interface SearchResults {
  bungieNetMembershipId?: string;
  bungieGlobalDisplayNameCode: string;
  bungieGlobalDisplayName: string;
  membershipType: number;
  membershipId: number;
  crossSaveOverride: number;
}

interface UserSearchResponse {
  Response: SearchResults[];
}

interface ProfileData {
  data: {
    dateLastPlayed: string;
    userInfo: {
      crossSaveOverride: number;
      membershipId: string;
      bungieGlobalDisplayName: string;
      bungieGlobalDisplayNameCode: string;
    }
  }
}


interface DestinyProfileResponse {
  Response: {
    profile: ProfileData
  };
}

interface ActiveProfile {
  bungieGlobalDisplayName: string;
  bungieGlobalDisplayNameCode: string;
  membershipType: number;
  membershipId: number;
  dateLastPlayed: string;
}

export class DestinyService {
  private readonly baseUrl = 'https://www.bungie.net/Platform';
  private readonly headers = {
    'X-API-Key': PUBLIC_DESTINY_API_KEY
  }

  private fetchFn: typeof fetch;
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerSecond = 25;
  private readonly requestWindowMs = 1000;

  constructor(fetchFunction: typeof fetch = fetch) {
    this.fetchFn = fetchFunction
  }

  async getActiveProfile(username: string, code: string): Promise<ActiveProfile | null> {
    try {
      const searchResults = await this.exactSearchUser(username, code);
      console.log("Search Results In getActiveProfile", searchResults)

      if (!searchResults || searchResults.length === 0) {
        return null;
      }

      if (searchResults.length === 1 || searchResults[0].crossSaveOverride !== 0) {
        const profile = await this.getUserProfile(searchResults[0].membershipType, searchResults[0].membershipId);
        console.log("Search results length of 1, or cross save enabled", profile)
        if (!profile) return null;

        return {
          bungieGlobalDisplayName: searchResults[0].bungieGlobalDisplayName,
          bungieGlobalDisplayNameCode: searchResults[0].bungieGlobalDisplayNameCode,
          membershipType: searchResults[0].membershipType,
          membershipId: searchResults[0].membershipId,
          dateLastPlayed: profile.Response.profile.data.dateLastPlayed
        };
      }

      const profilePromises = searchResults.map(result => this.getUserProfile(result.membershipType, result.membershipId));
      const profiles = await Promise.all(profilePromises);
      console.log("profiles:", profiles)

      let mostRecentProfile: ActiveProfile | null = null;
      let mostRecentDate = new Date(0);

      profiles.forEach((profile, index) => {
        if (!profile) return;
        const dateLastPlayed = new Date(profile.Response.profile.data.dateLastPlayed);
        if (dateLastPlayed > mostRecentDate) {
          mostRecentDate = dateLastPlayed;
          mostRecentProfile = {
            bungieGlobalDisplayName: searchResults[index].bungieGlobalDisplayName,
            bungieGlobalDisplayNameCode: searchResults[index].bungieGlobalDisplayNameCode,
            membershipType: searchResults[index].membershipType,
            membershipId: searchResults[index].membershipId,
            dateLastPlayed: profile.Response.profile.data.dateLastPlayed
          };
        }
      });

      return mostRecentProfile;
    } catch (error) {
      console.error('Error getting active profile:', error);
      throw error;
    }
  }

  async exactSearchUser(username: string, code: string): Promise<SearchResults[] | null> {
    try {
      const searchResponse = await this.rateLimitedRequest(`${this.baseUrl}/Destiny2/SearchDestinyPlayerByBungieName/all/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          displayName: username,
          displayNameCode: code
        })
      });

      if (!searchResponse.ok) {
        const error = await searchResponse.json() as DestinyAPIError;
        throw new Error(`Destiny API Error: ${error.message}`)
      }

      const { Response: searchResults }: UserSearchResponse = await searchResponse.json();
      console.log(searchResults)

      const profile = await this.getUserProfile(searchResults[0].membershipType, searchResults[0].membershipId)
      console.log(profile)

      return searchResults;
    } catch (error) {
      console.error('Error searching for user:', error)
      throw error;
    }
  }

  async getUserProfile(membershipType: number, membershipId: number): Promise<DestinyProfileResponse | null> {
    try {

      const response = await this.rateLimitedRequest(`${this.baseUrl}/Destiny2/${membershipType}/Profile/${membershipId}?components=100`, {
        headers: this.headers
      })

      if (!response.ok) {
        const error = await response.json() as DestinyAPIError;
        throw new Error(`Destiny API Error: ${error.message}`)
      }

      return response.json();

    } catch (error) {
      console.error(`Error fetching profile for membership type ${membershipType} and id ${membershipId}`, error)
      return null;
    }
  }

  private async rateLimitedRequest(url: string, options: RequestInit): Promise<Response> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < this.requestWindowMs
    );

    if (this.requestTimestamps.length >= this.maxRequestsPerSecond) {
      const oldestRequestTime = this.requestTimestamps[0];
      const waitTime = this.requestWindowMs - (now - oldestRequestTime);

      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestTimestamps.push(now);

    return this.fetchFn(url, options);
  }

}

export const getDestinyService = (event?: RequestEvent) => {
  return new DestinyService(event?.fetch ?? fetch);
}
