import { render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
			route: { id: '/admin' },
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

import AdminLayout from '../../src/routes/admin/+layout.svelte';

describe('Admin layout shell', () => {
	beforeEach(() => {
		page.set({
			url: new URL('http://localhost:4255/admin'),
			params: {},
			route: { id: '/admin' },
			status: 200,
			error: null,
			data: {},
			form: undefined
		});
	});

	it('keeps standard admin pages in the constrained content column', () => {
		const { container } = render(AdminLayout);

		expect(container.querySelector('.admin-content')?.className).not.toContain('admin-content--full-bleed');
	});

	it('switches CMS item editor routes into full-bleed mode', () => {
		page.set({
			url: new URL('http://localhost:4255/admin/cms/ui-patterns/seed-item-theme-toggle-action-icons'),
			params: { type: 'ui-patterns', item: 'seed-item-theme-toggle-action-icons' },
			route: { id: '/admin/cms/[type]/[item]' },
			status: 200,
			error: null,
			data: {},
			form: undefined
		});

		const { container } = render(AdminLayout);

		expect(container.querySelector('.admin-content')?.className).toContain('admin-content--full-bleed');
		expect(container.querySelector('.admin-sidebar')).toBeNull();
	});
});