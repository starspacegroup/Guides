import type { Principle, Pattern } from './types';

// In-memory data store (in production, this would be D1 or KV)
let principles: Principle[] = [
	{
		id: '1',
		title: 'Consistency',
		description: 'Maintain visual and functional consistency across the entire application to reduce cognitive load.',
		createdAt: new Date('2024-01-01')
	},
	{
		id: '2',
		title: 'Accessibility',
		description: 'Ensure all users, including those with disabilities, can access and use the application effectively.',
		createdAt: new Date('2024-01-02')
	},
	{
		id: '3',
		title: 'Simplicity',
		description: 'Keep interfaces simple and intuitive, avoiding unnecessary complexity.',
		createdAt: new Date('2024-01-03')
	}
];

let patterns: Pattern[] = [
	{
		id: '1',
		title: 'Navigation Bar',
		description: 'A consistent navigation bar at the top of every page with clear labels and logical grouping.',
		principleIds: ['1', '2'],
		createdAt: new Date('2024-01-04')
	},
	{
		id: '2',
		title: 'Form Validation',
		description: 'Provide clear, immediate feedback for form inputs with accessible error messages.',
		principleIds: ['2', '3'],
		createdAt: new Date('2024-01-05')
	}
];

export function getPrinciples(): Principle[] {
	return [...principles];
}

export function getPrinciple(id: string): Principle | undefined {
	return principles.find(p => p.id === id);
}

export function addPrinciple(principle: Omit<Principle, 'id' | 'createdAt'>): Principle {
	const newPrinciple: Principle = {
		...principle,
		id: String(Date.now()),
		createdAt: new Date()
	};
	principles.push(newPrinciple);
	return newPrinciple;
}

export function getPatterns(): Pattern[] {
	return [...patterns];
}

export function getPattern(id: string): Pattern | undefined {
	return patterns.find(p => p.id === id);
}

export function addPattern(pattern: Omit<Pattern, 'id' | 'createdAt'>): Pattern {
	const newPattern: Pattern = {
		...pattern,
		id: String(Date.now()),
		createdAt: new Date()
	};
	patterns.push(newPattern);
	return newPattern;
}
