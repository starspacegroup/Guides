<script lang="ts">
	type SortKey = 'name' | 'seats';
	type SortDirection = 'asc' | 'desc';

	const rows = [
		{ name: 'Atlas', seats: 18 },
		{ name: 'Beacon', seats: 12 },
		{ name: 'Comet', seats: 22 },
		{ name: 'Delta', seats: 9 }
	];

	let sortBy: SortKey = 'name';
	let sortDirection: SortDirection = 'asc';
	let page = 1;
	const pageSize = 2;
	type AriaSort = 'ascending' | 'descending' | 'none';

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
	$: visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize);
</script>

<section class="table-demo" data-header-demo="table-sorting-pagination">
	<div class="table-demo__frame">
		<table>
			<thead>
				<tr>
					<th aria-sort={nameSort}>
						<button type="button" on:click={() => toggleSort('name')}>
							Name
						</button>
					</th>
					<th aria-sort={seatsSort}>
						<button type="button" on:click={() => toggleSort('seats')}>
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