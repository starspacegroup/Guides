import { PII_REVEAL_COOKIE, PII_REVEAL_MAX_AGE } from '$lib/server/pii-mask';
import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
	if (!locals.user?.isOwner) throw error(403, 'Forbidden');
	const { reveal } = (await request.json()) as { reveal?: boolean };
	if (reveal)
		cookies.set(PII_REVEAL_COOKIE, '1', {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			maxAge: PII_REVEAL_MAX_AGE
		});
	else cookies.delete(PII_REVEAL_COOKIE, { path: '/' });
	return json({ ok: true });
};
