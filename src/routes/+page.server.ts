import type { Member } from '$lib/types'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => {
	const members: Member[] = await locals.pb.collection('members').getList(1, 20)
	console.log(members)

	return {
		members
	}
}
