export interface Viewer {
	id: number;
	viewer: string;
	participation_count: number;
}

export interface Party {
	max_size: number;
	members: Viewer[]
}
