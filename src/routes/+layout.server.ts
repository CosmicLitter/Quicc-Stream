// import { pbError } from '$lib/pocketbase.svelte'
import type { Member } from '$lib/types'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async ({ locals }) => {
	// const members: Member[] = await locals.pb.collection('members').getFullList({
	// 	sort: '-created'
	// })
	let results = {
		user: locals.user ?? null,
		// members
	}
	return results
}
