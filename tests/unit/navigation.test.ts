import { fireEvent, render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';

const { page } = vi.hoisted(() => ({
	page: (() => {
		let value = {
			url: new URL('http://localhost:4255/admin'),
			params: {},
			route: { id: '/' },
			status: 200,
			error: null,
			data: {},
			form: undefined
		};
		const subscribers = new Set<(value: typeof value) => void>();

		return {
			subscribe(callback: (value: typeof value) => void) {
				subscribers.add(callback);
				callback(value);
				return () => subscribers.delete(callback);
			},
			set(nextValue: typeof value) {
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

vi.mock('../../src/lib/components/ThemeSwitcher.svelte', () => ({
	default: class ThemeSwitcher {}
}));

vi.mock('../../src/lib/components/ThemeToggle.svelte', () => ({
	default: class ThemeToggle {}
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

		expect(document.querySelector('.nav-shell')).toBeTruthy();
		expect(document.querySelector('.nav .container')).toBeNull();
		expect(document.querySelector('.nav-links.open')).toBeTruthy();
		expect(document.querySelector('.nav-link-item')).toBeTruthy();
		expect(document.querySelector('.nav-link')).toBeTruthy();
		expect(screen.getByRole('link', { name: /admin/i })).toHaveClass('nav-link');
	});
});