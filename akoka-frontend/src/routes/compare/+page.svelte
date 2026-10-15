<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fetchCategories } from '$lib/api/categories';
	import { fetchObservations, fetchPriceInsights } from '$lib/api/insights';
	import { apiClient } from '$lib/api/client';
	import { UNILAG_CAMPUS_ZONES } from '$lib/data/campusZones';
	import PriceMetricCard from '$lib/components/insights/PriceMetricCard.svelte';
	import ObservationCard from '$lib/components/insights/ObservationCard.svelte';
	import PriceTrendChart from '$lib/components/insights/PriceTrendChart.svelte';
	import SubmitObservationModal from '$lib/components/insights/SubmitObservationModal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		IconTagPrice,
		IconFilter,
		IconScale,
		IconPlus,
		IconMapPin,
		IconCheckmark,
		IconInfo
	} from '$lib/components/icons';
	import type { ObservationSourceType } from '$lib/types/models';

	let categories = $state<import('$lib/types/models').Category[]>([]);
	let observations = $state<import('$lib/types/models').PriceObservation[]>([]);
	let currentInsight = $state<import('$lib/types/models').PriceInsight | null>(null);
	let loading = $state(true);
	let loadError = $state('');

	// Read initial query params if present
	const initialCatParam = page.url.searchParams.get('category');
	let selectedCategoryId = $state(initialCatParam || '');

	let selectedItemSpec = $state('');
	let selectedZone = $state('all');
	let selectedSourceType = $state('all');
	let isSubmitModalOpen = $state(false);

	const activeCategory = $derived(categories.find((c) => c.id === selectedCategoryId));
	const activeSpecs = $derived(activeCategory?.typical_item_specs ?? []);
	onMount(() => { fetchCategories().then((result) => { categories = result; if (!selectedCategoryId) selectedCategoryId = result[0]?.id ?? ''; }).catch((error) => loadError = error.message); });

	// Reset item spec filter when category changes
	$effect(() => {
		if (activeCategory && !activeCategory.typical_item_specs.includes(selectedItemSpec)) {
			selectedItemSpec = '';
		}
	});

	// Calculate live insight based on selected category and item specification
	const trendObservations = $derived(
		observations.filter(
			(observation) => observation.verification_status === 'verified' &&
				(!selectedItemSpec || observation.item_specification === selectedItemSpec)
		)
	);

	// Filter observations
	const filteredObservations = $derived.by(() => {
		let list = observations;

		if (selectedItemSpec) {
			list = list.filter((o) => o.item_specification === selectedItemSpec);
		}
		if (selectedZone !== 'all') {
			list = list.filter((o) => o.campus_zone === selectedZone);
		}
		if (selectedSourceType !== 'all') {
			list = list.filter((o) => o.source_type === selectedSourceType);
		}

		return list;
	});
	$effect(() => {
		if (!selectedCategoryId) return;
		let cancelled = false;
		loading = true;
		Promise.all([fetchObservations(selectedCategoryId), fetchPriceInsights({ category: selectedCategoryId, itemSpec: selectedItemSpec || undefined })])
			.then(([items, insight]) => { if (!cancelled) { observations = items; currentInsight = insight; loadError = ''; } })
			.catch((error) => { if (!cancelled) loadError = error instanceof Error ? error.message : 'Could not load price data.'; })
			.finally(() => { if (!cancelled) loading = false; });
		return () => { cancelled = true; };
	});
</script>

<svelte:head>
	<title>Price Intelligence & Comparison • AKOKA UNILAG</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
	{#if loadError}<div role="alert" class="rounded-xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800">{loadError}{#if !apiClient.backendConfigured} Configure the AKOKA backend URL to load live price data.{/if}</div>{/if}
	<!-- Page Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
		<div>
			<div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
				<IconTagPrice size={13} />
				<span>Price Intelligence Engine</span>
			</div>
			<h1 class="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
				Compare Campus Prices (Like-for-Like)
			</h1>
			<p class="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
				Compare verified quotes, view median price benchmarks, and assess data confidence across UNILAG commercial hubs.
			</p>
		</div>

		<Button variant="primary" size="md" onclick={() => (isSubmitModalOpen = true)}>
			<IconPlus size={16} />
			<span>Submit Price Observation</span>
		</Button>
	</div>

	<!-- Category Navigation Bar -->
	<div class="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
		{#each categories as cat}
			<button
				type="button"
				onclick={() => {
					selectedCategoryId = cat.id;
					selectedItemSpec = '';
				}}
				class="px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer {selectedCategoryId ===
				cat.id
					? 'bg-slate-900 text-white shadow-sm'
					: 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'}"
			>
				{cat.name}
			</button>
		{/each}
	</div>

	<!-- Price Intelligence Spotlight Metric Card -->
	{#if currentInsight}<PriceMetricCard insight={currentInsight} />{/if}
	<PriceTrendChart observations={trendObservations} />

	<!-- Category Normalization & Rules Card (Section 7) -->
	{#if activeCategory}<div class="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
		<div class="flex items-center gap-2">
			<IconScale size={18} class="text-slate-700" />
			<h4 class="text-xs font-bold uppercase tracking-wider text-slate-800">
				Comparability Guidelines for {activeCategory.name}
			</h4>
		</div>
		<p class="text-xs text-slate-600 leading-relaxed">
			To avoid misleading comparisons, AKOKA groups observations by explicit service scopes and unit baselines ({activeCategory.unit_definition}).
		</p>
		<div class="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
			{#each activeCategory.comparison_rules as rule}
				<div class="flex items-start gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700">
					<IconCheckmark size={14} class="text-emerald-600 shrink-0 mt-0.5" />
					<span class="leading-snug">{rule}</span>
				</div>
			{/each}
		</div>
	</div>{/if}

	<!-- Interactive Filtering & Exploration Bar -->
	<div class="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
				<IconFilter size={15} />
				<span>Filter Observations</span>
			</div>
			<span class="text-xs font-mono text-slate-400">
				Showing {filteredObservations.length} observations
			</span>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
			<!-- Item Spec Filter -->
			<div>
				<label for="filter-spec" class="block text-[11px] font-semibold text-slate-600 mb-1">
					Item Specification
				</label>
				<select
					id="filter-spec"
					bind:value={selectedItemSpec}
					class="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					<option value="">All Specifications</option>
					{#each activeSpecs as spec}
						<option value={spec}>{spec}</option>
					{/each}
				</select>
			</div>

			<!-- Campus Zone Filter -->
			<div>
				<label for="filter-zone" class="block text-[11px] font-semibold text-slate-600 mb-1">
					UNILAG Zone
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

			<!-- Source Type Filter -->
			<div>
				<label for="filter-source" class="block text-[11px] font-semibold text-slate-600 mb-1">
					Verification Source Type
				</label>
				<select
					id="filter-source"
					bind:value={selectedSourceType}
					class="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					<option value="all">All Sources</option>
					<option value="vendor_confirmed">Vendor Confirmed</option>
					<option value="student_submitted">Student Submitted</option>
					<option value="receipt_supported">Receipt Supported</option>
					<option value="transaction_linked">Transaction-Linked</option>
				</select>
			</div>
		</div>
	</div>

	<!-- Observations Grid -->
	{#if loading}<div class="py-12 text-center rounded-2xl bg-white border border-slate-200 text-sm text-slate-500">Loading verified observations…</div>
	{:else if filteredObservations.length === 0}
		<div class="py-12 text-center p-8 rounded-2xl bg-white border border-slate-200 space-y-3">
			<IconInfo size={28} class="text-slate-400 mx-auto" />
			<h3 class="text-sm font-bold text-slate-800">No Matching Observations Found</h3>
			<p class="text-xs text-slate-500 max-w-sm mx-auto">
				No recorded prices match your specific filters. Try loosening the filter criteria or submit a new observation.
			</p>
			<Button variant="outline" size="sm" onclick={() => (isSubmitModalOpen = true)}>
				Submit Price for This Filter
			</Button>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
			{#each filteredObservations as obs (obs.id)}
				<ObservationCard observation={obs} categoryName={categories.find((category) => category.id === obs.category_id)?.name} />
			{/each}
		</div>
	{/if}
</div>

<!-- Submit Price Modal -->
<SubmitObservationModal
	isOpen={isSubmitModalOpen}
	onclose={() => (isSubmitModalOpen = false)}
/>
