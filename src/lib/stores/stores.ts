import { persisted } from 'svelte-persisted-store';
import type { Viewer } from '$lib/types'
import type { Party } from '$lib/types'

let queue: Viewer[] = [];
let viewerslist: Viewer[] = [];
let partylist: Party = {
	max_size: 3,
	members: []
};

export const viewers = persisted('viewers', viewerslist)
export const qQueue = persisted('queue', queue)
export const count = persisted('count', 0)
export const party = persisted('party', partylist)
