<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fetchListings } from '$lib/api/listings';
	import { fetchCategories } from '$lib/api/categories';
	import { apiClient } from '$lib/api/client';
	import { UNILAG_CAMPUS_ZONES } from '$lib/data/campusZones';
	import ListingCard from '$lib/components/listings/ListingCard.svelte';
	import CreateTransactionModal from '$lib/components/transactions/CreateTransactionModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { IconSearch, IconFilter, IconStore, IconSliders } from '$lib/components/icons';
	import type { Listing } from '$lib/types/models';

	let categories = $state<import('$lib/types/models').Category[]>([]);
	let listings = $state<Listing[]>([]);
	let loading = $state(true);
	let loadError = $state('');

	let searchQuery = $state('');
	let selectedCategory = $state('all');
	let selectedZone = $state('all');
	let maxPrice = $state<number | ''>('');

	let selectedListingForTx = $state<Listing | undefined>(undefined);
	let isTxModalOpen = $state(false);

	const filteredListings = $derived(listings);
	onMount(() => { fetchCategories().then((result) => categories = result).catch((error) => loadError = error.message); });
	$effect(() => {
		const filters = {
			category: selectedCategory !== 'all' ? selectedCategory : undefined,
			area: selectedZone !== 'all' ? selectedZone : undefined,
			maxPrice: maxPrice ? Number(maxPrice) : undefined,
			search: searchQuery.trim() || undefined
		};
		let cancelled = false;
		loading = true;
		fetchListings(filters).then((result) => { if (!cancelled) { listings = result; loadError = ''; } }).catch((error) => { if (!cancelled) loadError = error instanceof Error ? error.message : 'Could not load listings.'; }).finally(() => { if (!cancelled) loading = false; });
		return () => { cancelled = true; };
	});

	function handleStartTransaction(listing: Listing) {
		selectedListingForTx = listing;
		isTxModalOpen = true;
	}
</script>

<svelte:head>
	<title>Campus Service Directory • AKOKA UNILAG</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
	<!-- Page Header -->
	<div class="space-y-2 pb-6 border-b border-slate-200">
		<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
			<IconStore size={13} />
			<span>Verified Providers & Offers</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
			Campus Service Directory (UNILAG)
		</h1>
		<p class="text-xs sm:text-sm text-slate-500 max-w-2xl">
			Discover vetted campus businesses across New Hall, CITS, Science & Bariga Gate with documented scopes, turnaround times, and verified prices.
		</p>
	</div>

	<!-- Search & Filter Controls -->
	<div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
		<!-- Search Input -->
		<div class="relative">
			<IconSearch size={18} class="absolute left-3.5 top-3 text-slate-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search by service, e.g. thesis binding, laptop hinge welding, blazer alteration..."
				class="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-10 pr-4 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500 placeholder:text-slate-400"
			/>
		</div>

		<!-- Filter Dropdowns -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<!-- Category -->
			<div>
				<label for="filter-cat" class="block text-[11px] font-semibold text-slate-600 mb-1">
					Service Category
				</label>
				<select
					id="filter-cat"
					bind:value={selectedCategory}
					class="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					<option value="all">All Categories</option>
					{#each categories as cat}
						<option value={cat.id}>{cat.name}</option>
					{/each}
				</select>
			</div>

			<!-- Campus Zone -->
			<div>
				<label for="filter-zone" class="block text-[11px] font-semibold text-slate-600 mb-1">
					UNILAG Campus Zone
				</label>
				<select
					id="filter-zone"
					bind:value={selectedZone}
					class="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					<option value="all">All Campus Zones</option>
					{#each UNILAG_CAMPUS_ZONES as zone}
						<option value={zone.id}>{zone.name}</option>
					{/each}
				</select>
			</div>

			<!-- Max Price Filter -->
			<div>
				<label for="filter-price" class="block text-[11px] font-semibold text-slate-600 mb-1">
					Max Budget (₦ Naira)
				</label>
				<input
					id="filter-price"
					type="number"
					bind:value={maxPrice}
					placeholder="e.g. 15000"
					min="0"
					class="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				/>
			</div>
		</div>
	</div>

	{#if loadError}<div role="alert" class="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">{loadError}{#if !apiClient.backendConfigured} Configure the AKOKA backend URL to load live listings.{/if}</div>{/if}
	<!-- Listings Count -->
	<div class="flex items-center justify-between text-xs text-slate-500">
		<span>Showing <strong>{filteredListings.length}</strong> active campus offerings</span>
		{#if searchQuery || selectedCategory !== 'all' || selectedZone !== 'all' || maxPrice}
			<button
				type="button"
				onclick={() => {
					searchQuery = '';
					selectedCategory = 'all';
					selectedZone = 'all';
					maxPrice = '';
				}}
				class="text-akoka-600 font-semibold hover:underline cursor-pointer"
			>
				Clear all filters
			</button>
		{/if}
	</div>

	<!-- Listings Grid -->
	{#if loading}<div class="py-16 text-center rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">Loading campus listings…</div>
	{:else if filteredListings.length === 0}
		<div class="py-16 text-center p-8 rounded-2xl bg-white border border-slate-200 space-y-3">
			<IconStore size={32} class="text-slate-400 mx-auto" />
			<h3 class="text-sm font-bold text-slate-800">No Services Found</h3>
			<p class="text-xs text-slate-500 max-w-sm mx-auto">
				We couldn't find any provider offers matching your search criteria. Try modifying your filters.
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{#each filteredListings as listing (listing.id)}
				<ListingCard {listing} onStartTransaction={handleStartTransaction} />
			{/each}
		</div>
	{/if}
</div>

<!-- Transaction Draft Modal -->
<CreateTransactionModal
	isOpen={isTxModalOpen}
	initialListing={selectedListingForTx}
	onclose={() => (isTxModalOpen = false)}
	onCreated={(id: string) => {
		window.location.href = `/transactions/${id}`;
	}}
/>
