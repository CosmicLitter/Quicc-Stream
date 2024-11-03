import { json, type RequestEvent } from '@sveltejs/kit'
import { getDestinyService } from '$lib/services/destiny'
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, fetch }) => {
  try {
    const { username } = await request.json()
    const destinyService = getDestinyService({ fetch } as RequestEvent)
    const searchResult = await destinyService.searchUser(username)
    return json(searchResult)
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return json({ error: errorMessage }, { status: 500 })
  }
} 
