import { PUBLIC_POCKETBASE_URL } from '$env/static/public'
import Pocketbase, { type UnsubscribeFunc } from 'pocketbase'
import type { Member, UnlinkedDuellers, QueueConfig, QueueEntry, SelectionChance, ViewerWeights } from '$lib/types'

const pb = new Pocketbase(PUBLIC_POCKETBASE_URL)

class Roster {
	private members: Member[] = $state([])
	private membersCleanup: UnsubscribeFunc | undefined = undefined;


	Destroy() {
		if (this.membersCleanup)
			this.membersCleanup()
	}

	async FetchMembers() {
		this.members = await pb.collection('members').getFullList({ sort: '-created' }) as Member[]

		this.membersCleanup = await pb.collection('members').subscribe('*', async () => {
			this.members = await pb.collection('members').getFullList({ sort: '-created' });
		})
	}

	GetMembers() {
		return this.members
	}


}


// TODO : Title Dibs Queue with current content. Update bot response with title

export class QQueue {
	private queue: QueueEntry[] = $state([]);
	private nextId: number = 0;
	probabilityView: SelectionChance[] = $derived.by(() => {
		this.UpdateWeights()

		const totalWeight = this.queue.reduce((sum, entry) => sum + entry.weight, 0);
		return this.queue.map(entry => ({
			destinyUsername: entry.destinyUsername,
			destinyId: entry.destinyId,
			probability: Number((entry.weight / totalWeight * 100).toFixed(2))
		}))
	})
	#open = $state(false);

	config: QueueConfig = $state({
		baseWeight: 100,
		sessionFactor: 10,
		waitPeriod: 5,
		timeFactor: 2,
		maxTimeBonus: 200,
		maxAbsences: 3,
		absenceFactor: 10,
		pityFactor: 20,
		minimumWeight: 1
	})

	constructor(initialQueue: QueueEntry[] = []) {
		this.queue = initialQueue;
	}

	AddViewer(destinyUsername: string, destinyId: string, sessionCount: number, twitchUsername?: string, youtubeUsername?: string) {
		this.queue.push({
			id: this.nextId++,
			destinyUsername,
			destinyId,
			sessionCount,
			twitchUsername,
			youtubeUsername,
			weight: this.config.baseWeight,
			absences: 0,
			pityCount: 0,
			queueJoined: new Date()
		})
	}

	private CalculateWeight(entry: QueueEntry): number {
		const sessionPenalty = entry.sessionCount * this.config.sessionFactor;
		const absencePenalty = entry.absences * this.config.absenceFactor;
		const timeInQueue = (new Date().getTime() - new Date(entry.queueJoined).getTime()) / (1000 * 60 * this.config.waitPeriod);
		const timeBonus = Math.min(timeInQueue * this.config.timeFactor, this.config.maxTimeBonus)
		const pityBonus = entry.pityCount * this.config.pityFactor;
		return Math.max(this.config.minimumWeight, this.config.baseWeight - sessionPenalty - absencePenalty + timeBonus + pityBonus)
	}

	UpdateWeights() {
		this.queue = this.queue.map(entry => ({
			...entry,
			weight: this.CalculateWeight(entry)
		}));
	}

	SelectNextPlayer(): QueueEntry | null {
		if (this.queue.length === 0) return null;
		this.UpdateWeights();

		const totalWeight = this.queue.reduce((sum, entry) => sum + entry.weight, 0);
		const randomValue = Math.random() * totalWeight;

		let currentSum = 0;
		let selectedEntry: QueueEntry | null = null;

		this.queue = this.queue.map(entry => {
			currentSum += entry.weight;

			if (!selectedEntry && randomValue <= currentSum) {
				selectedEntry = { ...entry };
				return {
					...entry,
					pityCount: 0
				};
			} else if (!selectedEntry) {
				return {
					...entry,
					pityCount: entry.pityCount + 1
				};
			}
			return entry
		})
		return selectedEntry;
	}

	RemoveFromQueue(player: QueueEntry) {
		this.queue = this.queue.filter(entry => entry.id != player.id)
	}

	AbsentPlayer(player: QueueEntry) {
		this.queue = this.queue.map(entry => {
			if (entry.id === player.id) {
				const newAbsences = entry.absences + 1;
				if (newAbsences >= this.config.maxAbsences) {
					return null;
				}
				return {
					...entry,
					absences: entry.absences + 1
				};
			}
			return entry;
		}).filter((entry): entry is QueueEntry => entry !== null);
	}

	GetQueue() {
		return this.queue
	}

	DebugSelection() {
		if (this.queue.length === 0) {
			console.log("Queue is empty");
			return;
		}

		this.UpdateWeights();
		// $inspect(this.queue);
		const totalWeight = this.queue.reduce((sum, entry) => sum + entry.weight, 0);

		console.log("Selection Debug Info:");
		console.log("Total Weight:", totalWeight);

		let currentSum = 0;
		this.queue.forEach(entry => {
			const previousSum = currentSum;
			currentSum += entry.weight;
			console.log(`${entry.destinyUsername}#${entry.destinyId}:
	Weight:  ${entry.weight}
	Selection Range: ${previousSum} - ${currentSum}
	Chance: ${((entry.weight / totalWeight) * 100).toFixed(2)}%`)
		});
	}

	GetSelectionProbabilities(): SelectionChance[] {
		this.UpdateWeights();

		const totalWeight = this.queue.reduce((sum, entry) => sum + entry.weight, 0);

		return this.queue.map(entry => ({
			destinyUsername: entry.destinyUsername,
			destinyId: entry.destinyId,
			twitchUsername: entry.twitchUsername,
			youtubeUsername: entry.youtubeUsername,
			absences: entry.absences,
			sessionCount: entry.sessionCount,
			probability: Number((entry.weight / totalWeight * 100).toFixed(2))
		}));

	}

	GetWeights(): ViewerWeights[] {
		this.UpdateWeights();
		return this.queue.map(entry => ({
			destinyUsername: entry.destinyUsername,
			destinyId: entry.destinyId,
			weight: entry.weight,
			queueTime: `${((new Date().getTime() - entry.queueJoined.getTime()) / (1000 * 60)).toFixed(2)} minutes`
		}));
	}
	get open(): boolean {
		return this.#open
	}

	set open(value) {
		this.#open = value
	}

	ClearQueue() {
		this.queue = [];
	}
}

export const roster = new Roster;
export const qQueue = new QQueue;
