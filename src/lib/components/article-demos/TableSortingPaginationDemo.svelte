<script lang="ts">
	type SortKey = 'name' | 'seats';
	type SortDirection = 'asc' | 'desc';

	const rows = [
		{ name: 'Atlas', seats: 18 },
		{ name: 'Beacon', seats: 12 },
		{ name: 'Comet', seats: 22 },
		{ name: 'Delta', seats: 9 }
	];

	const pageSize = 2;
	type AriaSort = 'ascending' | 'descending' | 'none';

	function readSearchParam(name: string): string | null {
		if (typeof window === 'undefined') {
			return null;
		}

		return new URLSearchParams(window.location.search).get(name);
	}

	function getInitialSortBy(): SortKey {
		return readSearchParam('sort') === 'seats' ? 'seats' : 'name';
	}

	function getInitialSortDirection(): SortDirection {
		return readSearchParam('direction') === 'desc' ? 'desc' : 'asc';
	}

	function getInitialPage(): number {
		const value = Number(readSearchParam('page'));
		return Number.isInteger(value) && value > 0 ? value : 1;
	}

	let sortBy: SortKey = getInitialSortBy();
	let sortDirection: SortDirection = getInitialSortDirection();
	let page = getInitialPage();

	function toggleSort(column: SortKey) {
		if (sortBy === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = column;
			sortDirection = 'asc';
			page = 1;
		}
	}

	$: sortedRows = [...rows].sort((left, right) => {
		const a = left[sortBy];
		const b = right[sortBy];
		if (a === b) return 0;
		const comparison = a > b ? 1 : -1;
		return sortDirection === 'asc' ? comparison : -comparison;
	});
	$: nameSort = (sortBy === 'name' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') as AriaSort;
	$: seatsSort = (sortBy === 'seats' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none') as AriaSort;
	$: totalPages = Math.ceil(sortedRows.length / pageSize);
	$: page = Math.min(Math.max(page, 1), totalPages);
	$: visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
	$: syncTableState(sortBy, sortDirection, page);

	function syncTableState(activeSort: SortKey, activeDirection: SortDirection, currentPage: number) {
		if (typeof window === 'undefined' || typeof window.history?.replaceState !== 'function') {
			return;
		}

		const nextUrl = new URL(window.location.href);
		nextUrl.searchParams.set('sort', activeSort);
		nextUrl.searchParams.set('direction', activeDirection);
		nextUrl.searchParams.set('page', String(currentPage));
		window.history.replaceState({}, '', nextUrl);
	}
</script>

<section class="table-demo" data-header-demo="table-sorting-pagination">
	<div class="table-demo__frame">
		<p class="table-demo__summary">Sorted by {sortBy} ({sortDirection}), page {page} of {totalPages}.</p>
		<table>
			<thead>
				<tr>
					<th aria-sort={nameSort}>
						<button type="button" aria-label="Sort by name" on:click={() => toggleSort('name')}>
							Name
						</button>
					</th>
					<th aria-sort={seatsSort}>
						<button type="button" aria-label="Sort by seats" on:click={() => toggleSort('seats')}>
							Seats
						</button>
					</th>
				</tr>
			</thead>
			<tbody>
				{#each visibleRows as row}
					<tr>
						<td>{row.name}</td>
						<td>{row.seats}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="table-demo__footer">
			<span>Page {page} of {totalPages}</span>
			<div>
				<button type="button" on:click={() => (page = Math.max(1, page - 1))} disabled={page === 1}>Prev</button>
				<button type="button" on:click={() => (page = Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next</button>
			</div>
		</div>
	</div>
</section>

<style>
	.table-demo__frame {
		display: grid;
		gap: var(--spacing-sm);
		padding: clamp(var(--spacing-sm), 2vw, var(--spacing-md));
		border: 1px solid color-mix(in srgb, var(--color-border) 82%, var(--color-background));
		border-radius: 1.35rem;
		background: color-mix(in srgb, var(--color-surface) 88%, var(--color-background));
		box-shadow: var(--shadow-md);
	}

	.table-demo table {
		width: 100%;
		border-collapse: collapse;
	}

	.table-demo__summary {
		font-size: 0.85rem;
		color: var(--color-text-secondary);
	}

	.table-demo th,
	.table-demo td {
		padding: 0.7rem 0.55rem;
		text-align: left;
		border-bottom: 1px solid color-mix(in srgb, var(--color-border) 78%, var(--color-background));
	}

	.table-demo th button,
	.table-demo__footer button {
		border: 1px solid var(--color-border);
		background: var(--color-background);
		color: var(--color-text);
		border-radius: 0.75rem;
		padding: 0.45rem 0.65rem;
		cursor: pointer;
	}

	.table-demo__footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.75rem;
		font-size: 0.88rem;
		color: var(--color-text-secondary);
	}

	.table-demo__footer div {
		display: flex;
		gap: 0.5rem;
	}
</style>