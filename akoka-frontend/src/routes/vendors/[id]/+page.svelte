<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { fetchVendor } from '$lib/api/vendors';
	import { apiClient } from '$lib/api/client';
	import VendorTrustBadge from '$lib/components/vendors/VendorTrustBadge.svelte';
	import ListingCard from '$lib/components/listings/ListingCard.svelte';
	import CreateTransactionModal from '$lib/components/transactions/CreateTransactionModal.svelte';
	import ReportAction from '$lib/components/reports/ReportAction.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		IconMapPin,
		IconClock,
		IconShieldCheck,
		IconCheckmark,
		IconReceipt,
		IconAlertCircle,
		IconArrowRight
	} from '$lib/components/icons';
	import type { Listing, VendorProfile, Review } from '$lib/types/models';

	const vendorId = page.params.id || '';
	let vendor = $state<VendorProfile | undefined>();
	let listings = $state<Listing[]>([]);
	let reviews = $state<Review[]>([]);
	let loadError = $state('');
	onMount(() => { fetchVendor(vendorId).then((result) => { vendor = result.vendor; listings = result.listings; reviews = result.reviews; }).catch((error) => loadError = error instanceof Error ? error.message : 'Could not load provider profile.'); });

	let selectedListingForTx = $state<Listing | undefined>(undefined);
	let isTxModalOpen = $state(false);

	function handleStartTx(listing?: Listing) {
		selectedListingForTx = listing;
		isTxModalOpen = true;
	}
</script>

<svelte:head>
	<title>{vendor ? vendor.business_name : 'Provider Profile'} • AKOKA UNILAG</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
	{#if loadError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}{#if !apiClient.backendConfigured} Configure the AKOKA backend URL to load this provider.{/if}</div>{/if}
	{#if !vendor}
		<div class="py-16 text-center space-y-4">
			<IconAlertCircle size={32} class="text-rose-500 mx-auto" />
			<h2 class="text-lg font-bold text-slate-800">Provider Profile Not Found</h2>
			<p class="text-xs text-slate-500">The requested campus vendor profile does not exist.</p>
			<a href="/listings" class="text-xs font-semibold text-akoka-600 hover:underline">
				← Back to Campus Directory
			</a>
		</div>
	{:else}
		<!-- Breadcrumb -->
		<div class="text-xs text-slate-400 flex items-center gap-2">
			<a href="/listings" class="hover:text-slate-600">Campus Directory</a>
			<span>/</span>
			<span class="text-slate-700 font-semibold">{vendor.business_name}</span>
		</div>

		<!-- Vendor Header Profile Card -->
		<div class="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
				<!-- Avatar & Details -->
				<div class="flex items-start gap-4">
					{#if vendor.avatar_url}
						<img
							src={vendor.avatar_url}
							alt={vendor.business_name}
							class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0"
						/>
					{:else}
						<div
							class="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-900 text-white font-extrabold text-2xl flex items-center justify-center shrink-0"
						>
							{vendor.business_name.substring(0, 2).toUpperCase()}
						</div>
					{/if}

					<div class="space-y-1.5">
						<div class="flex flex-wrap items-center gap-2.5">
							<h1 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
								{vendor.business_name}
							</h1>
							<VendorTrustBadge status={vendor.verification_status} showFullDisclaimer={false} />
						</div>

						<p class="text-xs sm:text-sm text-slate-600 font-medium max-w-xl">
							{vendor.tagline}
						</p>

						<div class="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 pt-1">
							<span class="flex items-center gap-1.5">
								<IconMapPin size={13} class="text-slate-400 shrink-0" />
								<span>{vendor.physical_spot}</span>
							</span>
							<span class="flex items-center gap-1.5">
								<IconClock size={13} class="text-slate-400 shrink-0" />
								<span>{vendor.operational_hours}</span>
							</span>
						</div>
					</div>
				</div>

				<!-- Action CTA -->
				<div class="shrink-0 flex flex-col gap-2">
					<Button variant="primary" size="md" onclick={() => handleStartTx()}>
						<span>Start Documented Agreement</span>
						<IconArrowRight size={15} />
					</Button>
					<ReportAction targetType="vendor" targetId={vendor.id} label="Report provider" />
					<span class="text-[11px] text-slate-400 text-center font-mono">Payment starts after agreement through the backend.</span>
				</div>
			</div>

			<!-- Vendor Performance & Trust Indicators (Section 6 & 7) -->
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
				<!-- Price Integrity Score -->
				<div class="space-y-0.5">
					<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
						Price Integrity Score
					</div>
					<div class="text-xl font-black text-slate-900 font-mono">
						{vendor.price_integrity_score}%
					</div>
					<div class="text-[10px] text-slate-400">
						Observed price consistency
					</div>
				</div>

				<!-- Rating & Reviews -->
				<div class="space-y-0.5">
					<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
						Verified Rating
					</div>
					<div class="text-xl font-black text-slate-900 font-mono flex items-center gap-1">
						<span>★ {vendor.rating.toFixed(1)}</span>
						<span class="text-xs text-slate-400 font-normal">({vendor.review_count})</span>
					</div>
					<div class="text-[10px] text-slate-400">
						Transaction-verified reviews
					</div>
				</div>

				<!-- Completed Transactions -->
				<div class="space-y-0.5">
					<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
						Documented Jobs
					</div>
					<div class="text-xl font-black text-slate-900 font-mono">
						{vendor.completed_transactions_count}+
					</div>
					<div class="text-[10px] text-slate-400">Completed documented agreements</div>
				</div>

				<!-- Contact / Direct Phone -->
				<div class="space-y-0.5">
					<div class="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
						Direct Desk Contact
					</div>
					<div class="text-xs font-bold text-slate-800 font-mono pt-1">
						{vendor.phone}
					</div>
					<div class="text-[10px] text-slate-400">
						WhatsApp enabled
					</div>
				</div>
			</div>

			<!-- Bio / About -->
			<div class="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
				<h4 class="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Provider Overview</h4>
				<p>{vendor.bio}</p>
			</div>
		</div>

		<!-- Active Offerings & Published Listings -->
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-lg font-black text-slate-900 tracking-tight">
						Published Offers & Services
					</h3>
					<p class="text-xs text-slate-500">
						Documented scope and pricing for campus work
					</p>
				</div>
				<span class="text-xs font-mono text-slate-400">{listings.length} active listings</span>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{#each listings as listing (listing.id)}
					<ListingCard {listing} onStartTransaction={() => handleStartTx(listing)} />
				{/each}
			</div>
		</div>

		<!-- Verified Customer Reviews Section (Section 11) -->
		<div class="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
			<div class="flex items-center justify-between pb-3 border-b border-slate-100">
				<div>
					<h3 class="text-base font-bold text-slate-900">
						Verified Transaction Reviews ({reviews.length})
					</h3>
					<p class="text-xs text-slate-500">
						Strict Policy: Only students with completed, qualifying documented transactions may submit reviews.
					</p>
				</div>
				<div class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
					<IconShieldCheck size={14} />
					<span>Transaction-linked reviews</span>
				</div>
			</div>

			{#if reviews.length === 0}
				<p class="text-xs text-slate-400 py-4 italic">No verified reviews recorded yet for this provider.</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
					{#each reviews as rev}
						<div class="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
							<div class="flex items-center justify-between">
								<span class="font-bold text-slate-900">{rev.reviewer_name}</span>
								<span class="text-amber-500 font-mono font-bold">★ {rev.rating}/5</span>
							</div>
							<p class="text-slate-600 leading-relaxed italic">
								"{rev.comment}"
							</p>
							<div class="flex items-center gap-1.5 text-[10px] text-emerald-700 font-medium pt-1">
								<IconCheckmark size={11} />
								<span>Verified completed transaction #{rev.transaction_id}</span>
							</div>
							<div class="flex justify-end border-t border-slate-200 pt-1"><ReportAction targetType="review" targetId={rev.id} label="Report review" /></div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>

<!-- Transaction Draft Modal -->
<CreateTransactionModal
	isOpen={isTxModalOpen}
	initialListing={selectedListingForTx}
	initialVendor={vendor}
	onclose={() => (isTxModalOpen = false)}
	onCreated={(id: string) => {
		window.location.href = `/transactions/${id}`;
	}}
/>
