<script lang="ts">
	import type { PriceInsight } from '$lib/types/models';
	import ConfidenceBadge from '$lib/components/ui/ConfidenceBadge.svelte';
	import { IconTagPrice, IconClock, IconTrendingUp, IconAlertCircle } from '$lib/components/icons';

	let {
		insight,
		class: className = ''
	}: {
		insight: PriceInsight;
		class?: string;
	} = $props();
</script>

<div class="p-6 rounded-2xl bg-white border border-slate-200 shadow-card hover:shadow-subtle transition-shadow {className}">
	<!-- Top: Item Title & Confidence Badge -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
		<div>
			<span class="text-[11px] font-bold uppercase tracking-wider text-akoka-600">
				{insight.category_name}
			</span>
			<h3 class="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
				{insight.item_specification}
			</h3>
		</div>
		<ConfidenceBadge
			level={insight.confidence_level}
			sampleSize={insight.sample_size}
			reason={insight.confidence_reason}
		/>
	</div>

	<!-- Main Metric Display -->
	{#if insight.confidence_level === 'insufficient_data' || insight.median_price === null}
		<!-- Required Insufficient Data State from Section 7 -->
		<div class="py-8 text-center space-y-3">
			<div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 mx-auto flex items-center justify-center">
				<IconAlertCircle size={22} />
			</div>
			<div class="max-w-md mx-auto space-y-1">
				<h4 class="text-sm font-bold text-slate-800">Insufficient Data</h4>
				<p class="text-xs text-slate-500 leading-relaxed">
					Not enough recent, comparable observations to estimate a reliable price range yet. We do not invent artificial averages.
				</p>
			</div>
			<span class="inline-block text-[11px] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
				Submit the first observation for this spec to jumpstart campus transparency
			</span>
		</div>
	{:else}
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-6 py-6">
			<!-- Median Price -->
			<div class="space-y-1">
				<div class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
					<IconTagPrice size={14} class="text-akoka-600" />
					<span>Campus Median Price</span>
				</div>
				<div class="text-3xl font-extrabold text-slate-950 tracking-tight">
					<span class="text-xl text-slate-500 font-medium mr-0.5">₦</span>{insight.median_price.toLocaleString()}
				</div>
				<div class="text-[11px] text-slate-500">
					Derived from {insight.sample_size} verified observations
				</div>
			</div>

			<!-- Price Range (Min to Max) -->
			<div class="space-y-1">
				<div class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
					<IconTrendingUp size={14} class="text-emerald-600" />
					<span>Observed Range</span>
				</div>
				<div class="text-xl font-bold text-slate-800 tracking-tight pt-1">
					<span class="text-sm text-slate-400 font-normal">₦</span>{insight.range_low?.toLocaleString()}
					<span class="text-slate-400 text-sm font-normal mx-1">to</span>
					<span class="text-sm text-slate-400 font-normal">₦</span>{insight.range_high?.toLocaleString()}
				</div>
				<div class="text-[11px] text-slate-500">
					Varies by paper weight & rush urgency
				</div>
			</div>

			<!-- Freshness & Trend -->
			<div class="space-y-1">
				<div class="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
					<IconClock size={14} class="text-slate-500" />
					<span>Data Freshness</span>
				</div>
				<div class="text-base font-bold text-slate-900 pt-1.5">
					{#if insight.freshness_days === 0}
						<span class="text-emerald-700">Confirmed Today</span>
					{:else if insight.freshness_days === 1}
						<span class="text-slate-800">Confirmed Yesterday</span>
					{:else}
						<span class="text-slate-800">{insight.freshness_days} days ago</span>
					{/if}
				</div>
				<div class="text-[11px] text-slate-500 capitalize">
					Campus trend: <strong class="text-slate-700">{insight.recent_trend}</strong>
				</div>
			</div>
		</div>

		<!-- Micro Range Visualizer Bar -->
		{#if insight.range_low !== null && insight.range_high !== null && insight.range_high > insight.range_low}
			<div class="pt-2 pb-1">
				<div class="flex justify-between text-[11px] text-slate-400 mb-1.5 font-mono">
					<span>Min ₦{insight.range_low.toLocaleString()}</span>
					<span class="font-bold text-slate-700">Median ₦{insight.median_price.toLocaleString()}</span>
					<span>Max ₦{insight.range_high.toLocaleString()}</span>
				</div>
				<div class="relative w-full h-2 rounded-full bg-slate-100 overflow-hidden">
					<div
						class="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-400 via-akoka-500 to-amber-500 rounded-full"
						style="left: 0%; right: 0%;"
					></div>
				</div>
			</div>
		{/if}
	{/if}

	<!-- Footnote with rule reminder -->
	<div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
		<span>Units normalized for fair comparison.</span>
		<a href="/compare" class="text-akoka-600 hover:text-akoka-700 font-semibold hover:underline">
			View all observations →
		</a>
	</div>
</div>
