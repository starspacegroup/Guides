export interface Principle {
	id: string;
	title: string;
	description: string;
	createdAt: Date;
}

export interface Pattern {
	id: string;
	title: string;
	description: string;
	principleIds: string[];
	createdAt: Date;
}
