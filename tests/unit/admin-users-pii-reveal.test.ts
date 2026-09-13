import { fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UsersPage from '../../src/routes/admin/users/+page.svelte';

const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

const owner = { id: '1', isOwner: true, isAdmin: true };
const admin = { id: '2', isOwner: false, isAdmin: true };

const pageData = (user: typeof owner, piiRevealed = false) => ({
	user: { ...user, login: 'someone', email: 'someone@example.com' },
	hasAIProviders: false,
	guideCollections: [],
	users: [
		{
			id: 'user-uuid-1',
			name: 'M***** O**',
			email: 'm*****@example.com',
			github_login: 'me******ne',
			is_admin: 0,
			created_at: '2026-01-01'
		}
	],
	piiRevealed
});

describe('Admin users PII reveal', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('offers the reveal control to the owner', () => {
		render(UsersPage, { props: { data: pageData(owner) } });
		expect(screen.getByRole('button', { name: /reveal personal data/i })).toBeTruthy();
	});

	it('hides the reveal control from a non-owner admin', () => {
		render(UsersPage, { props: { data: pageData(admin) } });
		expect(screen.queryByRole('button', { name: /reveal personal data/i })).toBeNull();
	});

	it('labels the control for hiding once PII is revealed', () => {
		render(UsersPage, { props: { data: pageData(owner, true) } });
		expect(screen.getByRole('button', { name: /hide personal data/i })).toBeTruthy();
	});

	it('sets the reveal flag and reloads the list', async () => {
		mockFetch
			.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: true }) })
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					users: [
						{
							id: 'user-uuid-1',
							name: 'Member One',
							email: 'member@example.com',
							is_admin: 0,
							created_at: '2026-01-01'
						}
					]
				})
			});

		render(UsersPage, { props: { data: pageData(owner) } });
		await fireEvent.click(screen.getByRole('button', { name: /reveal personal data/i }));

		await waitFor(() => {
			expect(mockFetch).toHaveBeenCalledWith(
				'/api/admin/pii-reveal',
				expect.objectContaining({ method: 'POST', body: JSON.stringify({ reveal: true }) })
			);
			expect(mockFetch).toHaveBeenCalledWith('/api/admin/users');
		});
		await waitFor(() => expect(screen.getByText('Member One')).toBeTruthy());
	});

	it('leaves the list untouched when the reveal request fails', async () => {
		mockFetch.mockResolvedValueOnce({ ok: false, json: async () => ({}) });
		render(UsersPage, { props: { data: pageData(owner) } });
		await fireEvent.click(screen.getByRole('button', { name: /reveal personal data/i }));
		await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
		expect(screen.getByRole('button', { name: /reveal personal data/i })).toBeTruthy();
	});
});

describe('Admin users page load', () => {
	beforeEach(() => {
		vi.resetModules();
	});

	it('reports the current reveal state to the page', async () => {
		const { load } = await import('../../src/routes/admin/users/+page.server');
		const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ users: [] }) });

		const revealed = await load({
			fetch,
			cookies: { get: vi.fn().mockReturnValue('1') }
		} as any);
		expect(revealed).toMatchObject({ piiRevealed: true });

		const masked = await load({
			fetch,
			cookies: { get: vi.fn().mockReturnValue(undefined) }
		} as any);
		expect(masked).toMatchObject({ piiRevealed: false });
	});

	it('reports a masked state when the user list cannot be loaded', async () => {
		const { load } = await import('../../src/routes/admin/users/+page.server');
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const result = await load({
			fetch: vi.fn().mockRejectedValue(new Error('offline')),
			cookies: { get: vi.fn().mockReturnValue('1') }
		} as any);
		expect(result).toEqual({ users: [], piiRevealed: false });
	});
});
