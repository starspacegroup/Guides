// `svelte/internal` ships no public type declarations (it's an internal-only
// module). Declare just the one export tests/setup.ts actually uses, rather
// than blanket-typing the whole module as `any`.
declare module 'svelte/internal' {
	export function clear_loops(): void;
}
