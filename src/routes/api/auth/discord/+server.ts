import { startOAuth } from '$lib/server/oauth-flow';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = (event) => startOAuth('discord', event);
