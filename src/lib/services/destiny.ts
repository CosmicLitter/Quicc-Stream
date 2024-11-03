import { PUBLIC_DESTINY_API_KEY } from "$env/static/public";
import type { RequestEvent } from "@sveltejs/kit";

interface DestinyAPIError {
  code: number;
  message: string;
}

interface DestinyMembership {
  membershipType: number;
  membershipId: string;
  crossSaveOverride: number;
  lastPlayed?: string;

}

interface SearchResults {
  bungieNetMembershipId: string;
  bungieGlobalDisplayNameCode: number;
  displayName: string;
  destinyMemberships: DestinyMembership[]
}

interface UserSearchResponse {
  Response: {
    searchResults: SearchResults[]
  };
}


interface ProfileResponse {
  Response: {
    profile: {
      data: {
        dateLastPlayed: string;
      }
    }
  }
}

interface MembershipInfo {
  bungieNetMembershipId: string;
  membershipType: number;
  membershipId: string;
  lastPlayed?: string;
}

export class DestinyService {
  private readonly baseUrl = 'https://www.bungie.net/Platform';
  private readonly headers = {
    'X-API-Key': PUBLIC_DESTINY_API_KEY
  }
  private fetchFn: typeof fetch;
  private requestTimestamps: number[] = [];
  private readonly maxRequestsPerSecond: number = 25;
  private readonly requestWindowMs: number = 1000;

  constructor(fetchFunction: typeof fetch = fetch) {
    this.fetchFn = fetchFunction;
  }

  async searchUser(username: string): Promise<UserSearchResponse> {
    try {
      const response = await this.rateLimitedRequest(`${this.baseUrl}/User/Search/GlobalName/0/`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          displayNamePrefix: username
        })
      });

      if (!response.ok) {
        const error = await response.json() as DestinyAPIError;
        throw new Error(`Destiny API Error: ${error.message}`)
      }

      const data = await response.json();
      console.log(data)

      return data;
    } catch (error) {
      console.error('Error searching for user:', error)
      throw error;
    }
  }

  async getProfile(membershipType: number, membershipId: string): Promise<ProfileResponse> {
    try {
      const response = await this.rateLimitedRequest(`${this.baseUrl}/Destiny2/${membershipType}/Profile/${membershipId}/?components=100`,
        {
          method: 'GET',
          headers: this.headers
        }
      );

      if (!response.ok) {
        const error = await response.json() as DestinyAPIError;
        throw new Error(`Destiny API Error: ${error.message}`)
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  }

  async determineActiveMembership(searchResult: SearchResults): Promise<MembershipInfo> {
    const { destinyMemberships, bungieNetMembershipId } = searchResult;

    // Check if cross save is enabled and that it equals membershipType
    const crossSaveEnabled = destinyMemberships.some((membership: DestinyMembership) =>
      membership.crossSaveOverride !== 0 && membership.crossSaveOverride === membership.membershipType
    );

    if (crossSaveEnabled) {
      const activeMembership = destinyMemberships.find((membership: DestinyMembership) =>
        membership.crossSaveOverride === membership.membershipType
      )

      if (activeMembership) {
        return {
          bungieNetMembershipId,
          membershipType: activeMembership.membershipType,
          membershipId: activeMembership.membershipId
        };
      }
    }

    // If cross save is not enabled, check last played date
    const membershipPromises = destinyMemberships.map(async (membership: DestinyMembership) => {
      try {
        const profile = await this.getProfile(membership.membershipType, membership.membershipId);
        return {
          ...membership,
          lastPlayed: profile.Response.profile.data.dateLastPlayed
        };
      } catch (error) {
        console.warn(`Failed to fetch profile for membership ${membership.membershipId}:`, error)
        return {
          ...membership,
          lastPlayed: '1970-01-01t00:00:00z'
        };
      }
    });

    // Oops, I used any :)
    const membershipsWithDates = await Promise.all(membershipPromises);
    const mostRecentMembership = membershipsWithDates.sort((a: any, b: any) =>
      new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime()
    )[0];

    return {
      bungieNetMembershipId,
      membershipType: mostRecentMembership.membershipType,
      membershipId: mostRecentMembership.membershipId,
      lastPlayed: mostRecentMembership.lastPlayed
    };
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

// export const destinyService = new DestinyService();

