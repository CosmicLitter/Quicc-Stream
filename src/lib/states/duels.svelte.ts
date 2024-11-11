import type { Member, UnlinkedDuellers } from "$lib/types";
import { roster } from "./global.svelte";
import { persistedState } from "./persistedState.svelte";
import { toast } from 'svelte-sonner';

export const duelList = persistedState<UnlinkedDuellers[]>('duels', [])
export const nextDuelId = persistedState('duel_id', 0)

interface Dueller {
	d2Username: string;
	d2Id: string;
	twitchUsername: string
	id: number;
}

interface Duels {
	unlinkedRequests: UnlinkedDuellers[],
	nextUnlinkedId: 0
	matches: Dueller[]
	nextMatchId: 0
}

const initialState: Duels = {
	unlinkedRequests: [],
	nextUnlinkedId: 0,
	matches: [],
	nextMatchId: 0
}

// export const duels= $state(initialState) as Duels

export class Duel {
	duels = $state(initialState) as Duels

	constructor() {
		$effect.root(() => {
			$effect(() => {
				const item = localStorage.getItem('duelslist')
				if (item) this.duels = JSON.parse(item)
			})

			$effect(() => {
				localStorage.setItem('duelslist', JSON.stringify(this.duels))
			})
		})
	}

	Add = (name: string) => {
		const existingMember = roster.FindTwitchViewer(name.toLowerCase());
		if (existingMember && existingMember.twitchUsername) {
			this.duels.matches.push({
				d2Username: existingMember.d2Username,
				d2Id: existingMember.d2Id,
				twitchUsername: existingMember.twitchUsername,
				id: this.duels.nextMatchId
			})
			this.duels.nextMatchId++
			toast.success(
				`${name} from twitch has requested a duel. ${existingMember.d2Username} has been added to the duels list`
			);
		} else {
			if (this.duels.unlinkedRequests.find(item => item.username === name.toLowerCase())) return
			toast.warning(`${name} from twitch has requested a duel, but they have not linked their D2 account yet`, { action: { label: 'Link Viewer', onClick: () => console.log('link viweer') } });
			this.duels.unlinkedRequests.push({ id: this.duels.nextUnlinkedId++, username: name.toLowerCase() });
		}
	}

	Remove = (id: number) => {
		this.duels.matches = this.duels.matches.filter(item => item.id !== id)
	}

	RemoveUnlinked = (id: number) => {
		this.duels.unlinkedRequests = this.duels.unlinkedRequests.filter(item => item.id !== id)
	}
}

export const duels = new Duel()
