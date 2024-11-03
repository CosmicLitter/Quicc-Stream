import PocketBase, { RecordService } from 'pocketbase'
export type { AuthModel, ClientResponseError } from 'pocketbase'

type DuelResult = 'win' | 'loss'

export interface User {
	avatar: string;
	collectionId: string;
	collectionName: string;
	created: string;
	email?: string;
	emailVisibility: boolean;
	id: string;
	name?: string;
	updated: string;
	username: string;
	verified: boolean;
}

export interface Member {
	id?: string;
	d2Username: string;
	d2Id: string;
	bungieNetMembershipId: string;
	membershipType: number;
	membershipId: string;
	twitchUsername?: string;
	youtubeUsername?: string;
	roleId?: string;
	sessionCount: number;
	isActive: boolean;
	lastPlayed?: string;
	created?: string;
	updated?: string;
}

export interface Role {
	id: string;
	name: string;
	description?: string;
	created: string;
	updated: string;
}

export interface Note {
	id: string;
	member: string;
	content: string;
	created: string;
	updated: string;
}

export interface Duel {
	id: string
	member: string
	opponent: string
	result: DuelResult
}

export interface TypedPocketBase extends PocketBase {
	collection(idOrName: 'users'): RecordService<User>
	collection(idOrName: 'members'): RecordService<Member>
	collection(idOrName: 'roles'): RecordService<Role>
	collection(idOrName: 'notes'): RecordService<Note>
	collection(idOrName: 'duels'): RecordService<Duel>
}

export interface LocalMember {
	id: number;
	d2_username: string;
	d2_id: string;
	youtube_username?: string;
	twitch_username?: string;
	participation_count: number;
	win_count: number;
	loss_count: number;
	notes?: string[];
}

export interface QueueEntry {
	id: number;
	destinyUsername: string;
	destinyId: string;
	twitchUsername?: string;
	youtubeUsername?: string;
	queueJoined: Date;
	sessionCount: number;
	absences: number;
	pityCount: number;
	weight: number;
}

export interface QueueConfig {
	baseWeight: number;
	sessionFactor: number;
	waitPeriod: number;
	timeFactor: number;
	maxTimeBonus: number;
	maxAbsences: number;
	absenceFactor: number;
	pityFactor: number;
	minimumWeight: number;
}

export interface SelectionChance {
	destinyUsername: string;
	destinyId: string;
	probability: number;
}

export interface ViewerWeights {
	destinyUsername: string;
	destinyId: string;
	weight: number;
	queueTime: string;
}

export interface UnlinkedDuellers {
	id: number
	username: string
}

