export interface Viewer {
	id: number;
	viewer: string;
	participation_count: number;
}

export interface Party {
	max_size: number;
	members: Viewer[]
}

export interface FireTeam {
	max_size: number;
	members: Member[]
}

export interface Dueller {
	id: number;
	name: string;
}

export interface Member {
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
