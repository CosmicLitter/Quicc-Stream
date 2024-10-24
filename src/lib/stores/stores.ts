import { persisted } from 'svelte-persisted-store';
import type { Viewer, Member, Party, FireTeam, Dueller } from '$lib/types'

let queue: Viewer[] = [];
let viewerslist: Viewer[] = [];
let partylist: Party = {
	max_size: 3,
	members: []
};


// let duellist: Viewer[] = [];
let duellist: Dueller[] = [];

let members: Member[] = [];
let group: FireTeam = {
	max_size: 3,
	members: []
}
let queue_list: Member[] = [];

export const clan = persisted('clan', members)
export const viewers = persisted('viewers', viewerslist)
export const qQueue = persisted('queue', queue)
export const count = persisted('count', 0)
export const next_id = persisted('next_id', 0);
export const duel_id = persisted('duel_id', 0);
export const party = persisted('party', partylist)
export const duels = persisted('duels', duellist)
export const fire_team = persisted('fire_team', group)
export const q_queue = persisted('q_queue', queue_list)
