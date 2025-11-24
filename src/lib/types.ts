export interface Principle {
	id: string;
	title: string;
	description: string;
	content?: string;
	createdAt: Date;
}

export interface Pattern {
	id: string;
	title: string;
	description: string;
	content?: string;
	principleIds: string[];
	createdAt: Date;
}
