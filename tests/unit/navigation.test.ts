import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

type MockPageState = {
	url: URL;
	params: Record<string, string>;
	route: { id: string };
	status: number;
	error: unknown;
	data: Record<string, unknown>;
	form: undefined;
};

const { page } = vi.hoisted(() => ({
	page: (() => {
		let value: MockPageState = {
			url: new URL('http://localhost:4255/admin'),
			params: {},
			route: { id: '/' },
			status: 200,
			error: null,
			data: {},
			form: undefined
		};
		const subscribers = new Set<(value: MockPageState) => void>();

		return {
			subscribe(callback: (value: MockPageState) => void) {
				subscribers.add(callback);
				callback(value);
				return () => subscribers.delete(callback);
			},
			set(nextValue: MockPageState) {
				value = nextValue;
				for (const subscriber of subscribers) {
					subscriber(value);
				}
			}
		};
	})()
}));

vi.mock('$app/stores', () => ({
	page
}));

import Navigation from '../../src/lib/components/Navigation.svelte';

describe('Navigation', () => {
	it('renders menu links inside full-width nav items on mobile', async () => {
		render(Navigation, {
			props: {
				user: {
					id: 'u1',
					login: 'monag',
					email: 'monag@example.com',
					name: 'Monag',
					isOwner: true,
					isAdmin: true,
					avatarUrl: ''
				}
			}
		});

		await fireEvent.click(screen.getByRole('button', { name: /toggle menu/i }));

		expect(document.querySelector('.nav .container.nav-container')).toBeTruthy();
		expect(document.querySelector('.nav-links.open')).toBeTruthy();
		expect(document.querySelector('.mobile-menu-items a[href="/admin"]')).toBeTruthy();
		expect(screen.getByRole('link', { name: /admin/i })).toHaveClass('active');
	});
});
