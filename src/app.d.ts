// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			session: {
				user?: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
				};
			} | null;
			theme: 'light' | 'dark' | null;
		}
		interface PageData {
			session: {
				user?: {
					id: string;
					name?: string | null;
					email?: string | null;
					image?: string | null;
				};
			} | null;
		}
		// interface PageState {}
		interface Platform {
			env: {
				AUTH_SECRET: string;
				AUTH_GITHUB_ID: string;
				AUTH_GITHUB_SECRET: string;
				AUTHORIZED_USER_NAME: string;
			};
			context: {
				waitUntil(promise: Promise<any>): void;
			};
			caches: CacheStorage & { default: Cache; };
		}
	}
}

export { };
