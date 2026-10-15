<script lang="ts">
	import type { Listing } from '$lib/types/models';
	import VendorTrustBadge from '$lib/components/vendors/VendorTrustBadge.svelte';
	import { IconClock, IconMapPin, IconArrowRight, IconCheckmark, IconX } from '$lib/components/icons';
	import Button from '$lib/components/ui/Button.svelte';
	import ReportAction from '$lib/components/reports/ReportAction.svelte';

	let {
		listing,
		onStartTransaction,
		class: className = ''
	}: {
		listing: Listing;
		onStartTransaction?: (listing: Listing) => void;
		class?: string;
	} = $props();

	const vendor = $derived(listing.vendor);
</script>

<div
	class="flex flex-col justify-between p-5 rounded-2xl bg-white border border-slate-200/90 shadow-card hover:shadow-subtle hover:border-slate-300 transition-all duration-200 {className}"
>
	<!-- Top: Vendor Info & Trust Badge -->
	<div class="space-y-3">
		{#if vendor}
			<div class="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
				<a href="/vendors/{vendor.id}" class="flex items-center gap-2.5 group">
					{#if vendor.avatar_url}
						<img
							src={vendor.avatar_url}
							alt={vendor.business_name}
							class="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
						/>
					{:else}
						<div class="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center shrink-0">
							{vendor.business_name.substring(0, 2).toUpperCase()}
						</div>
					{/if}
					<div>
						<h4 class="text-xs font-bold text-slate-900 group-hover:text-akoka-600 transition-colors">
							{vendor.business_name}
						</h4>
						<span class="text-[11px] text-slate-500 flex items-center gap-1">
							<IconMapPin size={11} />
							<span>{vendor.physical_spot.split('(')[0]}</span>
						</span>
					</div>
				</a>

				<VendorTrustBadge status={vendor.verification_status} />
			</div>
		{/if}

		<!-- Title & Price -->
		<div>
			<h3 class="text-sm sm:text-base font-bold text-slate-900 leading-snug">
				{listing.title}
			</h3>
			<p class="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
				{listing.description}
			</p>
		</div>

		<!-- Transparent Normalized Price -->
		<div class="flex items-baseline gap-1.5 py-1">
			<span class="text-2xl font-black text-slate-950 font-mono tracking-tight">
				₦{listing.price.toLocaleString()}
			</span>
			<span class="text-xs text-slate-500 font-medium">/{listing.unit}</span>
		</div>

		<!-- Turnaround Time -->
		<div class="flex items-center gap-1.5 text-xs text-slate-600 font-medium bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
			<IconClock size={14} class="text-slate-400 shrink-0" />
			<span>Turnaround: <strong class="text-slate-800">{listing.turnaround_time}</strong></span>
		</div>

		<!-- Explicit Inclusions & Exclusions (Section 2 & 7: "Compare like with like") -->
		<div class="space-y-1.5 text-[11px] pt-1">
			<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope Clarity</div>
			{#if listing.inclusions.length > 0}
				<div class="space-y-0.5">
					{#each listing.inclusions.slice(0, 2) as inc}
						<div class="flex items-center gap-1.5 text-emerald-800">
							<IconCheckmark size={12} class="text-emerald-600 shrink-0" />
							<span class="truncate">{inc}</span>
						</div>
					{/each}
				</div>
			{/if}
			{#if listing.exclusions.length > 0}
				<div class="space-y-0.5">
					{#each listing.exclusions.slice(0, 1) as exc}
						<div class="flex items-center gap-1.5 text-slate-500">
							<IconX size={12} class="text-slate-400 shrink-0" />
							<span class="truncate">Excludes: {exc}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Bottom Actions: Start Documented Agreement -->
	<div class="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
		{#if vendor}
			<a
				href="/vendors/{vendor.id}"
				class="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
			>
				Store Details
			</a>
		{/if}
		<div class="flex items-center gap-1">
			<ReportAction targetType="listing" targetId={listing.id} />
		<Button
			variant="primary"
			size="sm"
			onclick={() => onStartTransaction?.(listing)}
			class="shadow-xs font-semibold"
		>
			<span>Start Agreement</span>
			<IconArrowRight size={14} />
		</Button>
		</div>
	</div>
</div>
