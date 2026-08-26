import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { clear_loops } from 'svelte/internal';
import { writable } from 'svelte/store';
import { afterEach, beforeEach, vi } from 'vitest';

// Provide a default $app/stores mock so components using $page (e.g. SharingMeta) work in tests.
// Individual test files can override this with their own vi.mock('$app/stores', ...).
vi.mock('$app/stores', () => ({
	page: writable({
		url: new URL('http://localhost'),
		params: {},
		status: 200,
		error: null
	}),
	navigating: writable(null),
	updated: { check: () => Promise.resolve(false), subscribe: writable(false).subscribe }
}));

// Cleanup after each test
afterEach(() => {
	cleanup();
	// Svelte 4 keeps a module-level rAF-driven task queue (svelte/internal/loop.js)
	// that drives `in:`/`out:` transitions and svelte/motion stores. If a test renders
	// a component with an unfinished transition (e.g. a 400ms `in:fly`) and the test ends
	// before that transition completes, cleanup()'s $destroy() does not necessarily abort
	// the pending loop task. Because svelte/internal/environment.js resolves `raf`/`now`
	// via an unbound, unprefixed `requestAnimationFrame`/`performance.now()` lookup at each
	// call (not a reference captured once), a real timer left over from this file can later
	// fire against a DIFFERENT test file's active requestAnimationFrame (including a
	// vi.useFakeTimers() fake one), which can spin runAllTimersAsync into an infinite loop.
	// Clearing the queue after every test closes the leak at its source.
	clear_loops();
});

function ensureLocalStorageApi() {
	const hasCompleteApi =
		typeof globalThis.localStorage !== 'undefined' &&
		typeof globalThis.localStorage.getItem === 'function' &&
		typeof globalThis.localStorage.setItem === 'function' &&
		typeof globalThis.localStorage.removeItem === 'function' &&
		typeof globalThis.localStorage.clear === 'function';

	if (hasCompleteApi) {
		return;
	}

	let store: Record<string, string> = {};
	Object.defineProperty(globalThis, 'localStorage', {
		value: {
			getItem(key: string) {
				return store[key] ?? null;
			},
			setItem(key: string, value: string) {
				store[key] = String(value);
			},
			removeItem(key: string) {
				delete store[key];
			},
			clear() {
				store = {};
			}
		},
		writable: true,
		configurable: true
	});
}

beforeEach(() => {
	ensureLocalStorageApi();
});

// Setup global test utilities
globalThis.ResizeObserver = class ResizeObserver {
	observe() {}
	unobserve() {}
	disconnect() {}
};

// Mock IntersectionObserver
globalThis.IntersectionObserver = class IntersectionObserver {
	constructor() {}
	observe() {}
	unobserve() {}
	disconnect() {}
} as any;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => true
	})
});
