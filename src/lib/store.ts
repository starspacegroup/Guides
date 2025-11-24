import type { Principle, Pattern } from './types';

// In-memory data store (in production, this would be D1 or KV)
let principles: Principle[] = [
	{
		id: '1',
		title: 'Consistency',
		description: 'Maintain visual and functional consistency across the entire application to reduce cognitive load.',
		content: '<p>Consistency is a fundamental principle in design that helps users build mental models of how your application works.</p><h2>Key Points</h2><ul><li>Visual consistency across components</li><li>Functional consistency in interactions</li><li>Terminology consistency throughout</li></ul>',
		createdAt: new Date('2024-01-01')
	},
	{
		id: '2',
		title: 'Accessibility',
		description: 'Ensure all users, including those with disabilities, can access and use the application effectively.',
		content: '<p>Accessibility ensures that everyone, regardless of ability, can use your application.</p><h2>Best Practices</h2><ul><li>Use semantic HTML</li><li>Provide keyboard navigation</li><li>Include ARIA labels where needed</li><li>Ensure sufficient color contrast</li></ul>',
		createdAt: new Date('2024-01-02')
	},
	{
		id: '3',
		title: 'Simplicity',
		description: 'Keep interfaces simple and intuitive, avoiding unnecessary complexity.',
		content: '<p>Simplicity means reducing cognitive load by presenting only what users need, when they need it.</p><h2>Guidelines</h2><ul><li>Remove unnecessary elements</li><li>Use clear, simple language</li><li>Progressive disclosure of complexity</li></ul>',
		createdAt: new Date('2024-01-03')
	}
];

let patterns: Pattern[] = [
	{
		id: '1',
		title: 'Navigation Bar',
		description: 'A consistent navigation bar at the top of every page with clear labels and logical grouping.',
		content: '<p>The navigation bar is a critical component that helps users understand where they are and where they can go.</p><h2>Implementation</h2><ul><li>Always place at the top of the page</li><li>Use clear, descriptive labels</li><li>Highlight the current page</li><li>Make it accessible via keyboard</li></ul><h2>Example Code</h2><pre><code>&lt;nav&gt;\n  &lt;a href="/"&gt;Home&lt;/a&gt;\n  &lt;a href="/about"&gt;About&lt;/a&gt;\n&lt;/nav&gt;</code></pre>',
		principleIds: ['1', '2'],
		createdAt: new Date('2024-01-04')
	},
	{
		id: '2',
		title: 'Form Validation',
		description: 'Provide clear, immediate feedback for form inputs with accessible error messages.',
		content: '<p>Form validation helps users understand and correct errors before submission.</p><h2>Best Practices</h2><ul><li>Validate on blur or submit, not on every keystroke</li><li>Show clear error messages near the field</li><li>Use color AND text/icons for errors</li><li>Announce errors to screen readers</li></ul><h2>Error Message Guidelines</h2><p>Error messages should be:</p><ul><li>Specific and actionable</li><li>Written in plain language</li><li>Positioned near the relevant field</li></ul>',
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

export function updatePrinciple(id: string, updates: Partial<Omit<Principle, 'id' | 'createdAt'>>): Principle | undefined {
	const index = principles.findIndex(p => p.id === id);
	if (index === -1) return undefined;

	principles[index] = {
		...principles[index],
		...updates
	};
	return principles[index];
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

export function updatePattern(id: string, updates: Partial<Omit<Pattern, 'id' | 'createdAt'>>): Pattern | undefined {
	const index = patterns.findIndex(p => p.id === id);
	if (index === -1) return undefined;

	patterns[index] = {
		...patterns[index],
		...updates
	};
	return patterns[index];
}
