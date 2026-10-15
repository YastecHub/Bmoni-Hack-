<script lang="ts">
	import { onMount } from 'svelte';
	import { fetchListings } from '$lib/api/listings';
	import { fetchCategories } from '$lib/api/categories';
	import { fetchObservations, fetchPriceInsights } from '$lib/api/insights';
	import { apiClient } from '$lib/api/client';
	import { UNILAG_CAMPUS_ZONES } from '$lib/data/campusZones';
	import PriceMetricCard from '$lib/components/insights/PriceMetricCard.svelte';
	import ObservationCard from '$lib/components/insights/ObservationCard.svelte';
	import ListingCard from '$lib/components/listings/ListingCard.svelte';
	import CreateTransactionModal from '$lib/components/transactions/CreateTransactionModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		IconSearch,
		IconTagPrice,
		IconShieldCheck,
		IconScale,
		IconArrowRight,
		IconMapPin,
		IconReceipt,
		IconCheckmark,
		IconFileText
	} from '$lib/components/icons';
	import type { Listing } from '$lib/types/models';

	let categories = $state<import('$lib/types/models').Category[]>([]);
	let observations = $state<import('$lib/types/models').PriceObservation[]>([]);
	let listings = $state<Listing[]>([]);
	let activeInsight = $state<import('$lib/types/models').PriceInsight | null>(null);
	let backendError = $state('');
	let selectedCategoryId = $state('');
	let activeZoneFilter = $state<string | null>(null);

	// Active Category object
	const activeCategory = $derived(categories.find((c) => c.id === selectedCategoryId));

	// Calculate live insight for active category
	const recentObservations = $derived(observations.slice(0, 4));

	// Featured listings
	const featuredListings = $derived(listings.filter((item) => !activeZoneFilter || item.vendor?.campus_zone === activeZoneFilter).slice(0, 3));
	onMount(async () => {
		try {
			const [categoryData, observationData, listingData] = await Promise.all([fetchCategories(), fetchObservations(), fetchListings()]);
			categories = categoryData;
			observations = observationData.filter((item) => item.verification_status === 'verified');
			listings = listingData;
			selectedCategoryId = categoryData[0]?.id ?? '';
		} catch (error) { backendError = error instanceof Error ? error.message : 'Could not load campus data.'; }
	});
	$effect(() => {
		if (!selectedCategoryId) return;
		fetchPriceInsights({ category: selectedCategoryId }).then((value) => activeInsight = value).catch((error) => backendError = error.message);
	});

	// Transaction draft modal state
	let selectedListingForTx = $state<Listing | undefined>(undefined);
	let isTxModalOpen = $state(false);

	function handleStartAgreement(listing: Listing) {
		selectedListingForTx = listing;
		isTxModalOpen = true;
	}
</script>

<svelte:head>
	<title>AKOKA • Campus Price Intelligence & Protected Commerce (UNILAG)</title>
</svelte:head>

<!-- Hero Section -->
<section class="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white overflow-hidden py-16 sm:py-24 border-b border-slate-800">
	<!-- Background subtle grid pattern -->
	<div
		class="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"
	></div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
		{#if backendError}<div class="mb-6 rounded-xl bg-rose-950/70 border border-rose-700 p-4 text-sm text-rose-100" role="alert">{backendError}{#if !apiClient.backendConfigured} Add the AKOKA backend URL to load campus data.{/if}</div>{/if}
		<div class="max-w-3xl space-y-6">
			<!-- Main Headline -->
			<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-white leading-[1.15]">
				The Intelligence Layer for <span class="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">Campus Commerce</span>.
			</h1>

			<!-- Subtitle (Grounding in Section 1 & 3 of spec) -->
			<p class="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl font-normal">
				Understand what services typically cost around UNILAG before you pay. Compare verified provider quotes, check data confidence, and document agreed terms before work begins.
			</p>

			<!-- Quick Actions -->
			<div class="flex flex-wrap items-center gap-3 pt-2">
				<a
					href="/compare"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-akoka-500 hover:bg-akoka-600 active:bg-akoka-700 text-white text-sm font-bold shadow-elevated transition-all"
				>
					<IconTagPrice size={16} />
					<span>Explore Price Intelligence</span>
					<IconArrowRight size={16} />
				</a>

				<a
					href="/listings"
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 hover:text-white text-sm font-semibold border border-slate-700 transition-all"
				>
					<IconSearch size={16} />
					<span>Browse Campus Directory</span>
				</a>
			</div>
		</div>

		<!-- UNILAG Campus Zones Bar -->
		<div class="mt-12 pt-8 border-t border-slate-800/80">
			<div class="flex items-center justify-between text-xs text-slate-400 mb-3 font-semibold uppercase tracking-wider">
				<span class="flex items-center gap-1.5">
					<IconMapPin size={13} class="text-emerald-400" />
					<span>Active Campus Zones (UNILAG Axis)</span>
				</span>
				<span class="text-[11px] font-mono text-slate-500 hidden sm:inline">Normalized Data Sets</span>
			</div>

			<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
				{#each UNILAG_CAMPUS_ZONES as zone}
					<button
						type="button"
						onclick={() => (activeZoneFilter = activeZoneFilter === zone.id ? null : zone.id)}
						class="shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer {activeZoneFilter ===
						zone.id
							? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
							: 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'}"
					>
						<span>{zone.shortName}</span>
					</button>
				{/each}
			</div>
		</div>
		{#if activeZoneFilter && featuredListings.length === 0}
			<p class="mt-3 text-xs text-slate-400">No featured providers are listed in this zone yet.</p>
		{/if}
	</div>
</section>

<!-- Main Container -->
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
	<!-- Section 1: Live Campus Price Intelligence Spotlight -->
	<section class="space-y-6">
		<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
			<div>
				<span class="text-xs font-bold text-akoka-600 uppercase tracking-wider">
					Data-Informed Benchmark
				</span>
				<h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
					Live Campus Price Intelligence
				</h2>
				<p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
					Calculated from verified student receipts and vendor-confirmed price boards. We compare like with like and state assumptions explicitly.
				</p>
			</div>

			<!-- Category Tabs -->
			<div class="flex items-center gap-1.5 overflow-x-auto pb-1">
				{#each categories as cat}
					<button
						type="button"
						onclick={() => (selectedCategoryId = cat.id)}
						class="px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer {selectedCategoryId ===
						cat.id
							? 'bg-slate-950 text-white shadow-xs'
							: 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'}"
					>
						{cat.name.split('&')[0]}
					</button>
				{/each}
			</div>
		</div>

		<!-- Metric Spotlight Card -->
		{#if activeInsight}<PriceMetricCard insight={activeInsight} />{/if}

		<!-- Comparison Rules Banner (Section 7: "Compare like with like") -->
		{#if activeCategory}<div class="p-4 rounded-xl bg-slate-100/80 border border-slate-200/80 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="flex items-start sm:items-center gap-2.5">
				<IconScale size={16} class="text-slate-500 shrink-0 mt-0.5 sm:mt-0" />
				<div>
					<span class="font-bold text-slate-900">Comparability Rules for {activeCategory.name}:</span>
					<span class="text-slate-600 ml-1">
						{activeCategory.comparison_rules[0]}
					</span>
				</div>
			</div>
			<a
				href="/compare?category={selectedCategoryId}"
				class="text-xs font-bold text-akoka-600 hover:text-akoka-700 whitespace-nowrap"
			>
				Full Category Rules →
			</a>
		</div>{/if}
	</section>

	<!-- Section 2: How AKOKA Works (Section 3 Product Loop) -->
	<section class="py-8 border-y border-slate-200">
		<div class="text-center max-w-2xl mx-auto space-y-2 mb-10">
			<span class="text-xs font-bold text-emerald-600 uppercase tracking-wider">
				The Campus Product Loop
			</span>
			<h2 class="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
				Transparent, Comparable, and Accountable
			</h2>
			<p class="text-xs sm:text-sm text-slate-500">
				How AKOKA bridges price discovery and transaction confidence across UNILAG.
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			<!-- Step 1 -->
			<div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
				<div class="w-10 h-10 rounded-xl bg-sky-50 text-akoka-600 flex items-center justify-center font-bold">
					<IconTagPrice size={20} />
				</div>
				<h3 class="text-sm font-bold text-slate-900">1. Compare Verified Prices</h3>
				<p class="text-xs text-slate-600 leading-relaxed">
					View recent, like-for-like campus observations with confidence indicators. We flag insufficient data rather than making misleading claims.
				</p>
			</div>

			<!-- Step 2 -->
			<div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
				<div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
					<IconShieldCheck size={20} />
				</div>
				<h3 class="text-sm font-bold text-slate-900">2. Inspect Provider Track Record</h3>
				<p class="text-xs text-slate-600 leading-relaxed">
					Review verified reviews tied strictly to completed transactions, price integrity scores, and transparent verification status labels.
				</p>
			</div>

			<!-- Step 3 -->
			<div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
				<div class="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
					<IconFileText size={20} />
				</div>
				<h3 class="text-sm font-bold text-slate-900">3. Document Terms & Milestones</h3>
				<p class="text-xs text-slate-600 leading-relaxed">
					Lock agreed price, exact scope, deliverables, and deadlines in a documented agreement before work begins. Payments are initiated through the connected backend.
				</p>
			</div>
		</div>
	</section>

	<!-- Section 3: Recent Verified Campus Observations Feed -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-black text-slate-900 tracking-tight">
					Recent Campus Price Observations
				</h3>
				<p class="text-xs text-slate-500 mt-0.5">
					Latest submissions confirmed across UNILAG commercial spots
				</p>
			</div>
			<a
				href="/compare"
				class="text-xs font-bold text-akoka-600 hover:text-akoka-700 hover:underline"
			>
				View all observations →
			</a>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			{#each recentObservations as obs}
				<ObservationCard observation={obs} categoryName={categories.find((category) => category.id === obs.category_id)?.name} />
			{/each}
		</div>
	</section>

	<!-- Section 4: Featured Campus Providers & Offers -->
	<section class="space-y-6">
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-black text-slate-900 tracking-tight">
					Verified Campus Providers
				</h3>
				<p class="text-xs text-slate-500 mt-0.5">
					Active listings with clear turnaround expectations and documented scopes
				</p>
			</div>
			<a
				href="/listings"
				class="text-xs font-bold text-akoka-600 hover:text-akoka-700 hover:underline"
			>
				Browse full directory →
			</a>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
			{#each featuredListings as listing}
				<ListingCard {listing} onStartTransaction={handleStartAgreement} />
			{/each}
		</div>
	</section>

</div>

<!-- Transaction Draft Modal -->
<CreateTransactionModal
	isOpen={isTxModalOpen}
	initialListing={selectedListingForTx}
	onclose={() => (isTxModalOpen = false)}
	onCreated={(id) => {
		window.location.href = `/transactions/${id}`;
	}}
/>
