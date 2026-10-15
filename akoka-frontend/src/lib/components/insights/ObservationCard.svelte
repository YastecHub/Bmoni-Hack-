<script lang="ts">
	import type { PriceObservation } from '$lib/types/models';
	import {
		IconMapPin,
		IconClock,
		IconShieldCheck,
		IconReceipt,
		IconUserCheck,
		IconCheckmark,
		IconAlertCircle
	} from '$lib/components/icons';
	import Badge from '$lib/components/ui/Badge.svelte';
	import ReportAction from '$lib/components/reports/ReportAction.svelte';

	let {
		observation,
	categoryName = 'Campus service',
		class: className = ''
	}: {
		observation: PriceObservation;
		categoryName?: string;
		class?: string;
	} = $props();

	const sourceLabels: Record<
		PriceObservation['source_type'],
		{ label: string; icon: any; color: string }
	> = {
		student_submitted: {
			label: 'Student Submitted',
			icon: IconUserCheck,
			color: 'bg-sky-50 text-sky-700 border-sky-200'
		},
		vendor_confirmed: {
			label: 'Vendor Confirmed',
			icon: IconShieldCheck,
			color: 'bg-emerald-50 text-emerald-800 border-emerald-200'
		},
		receipt_supported: {
			label: 'Receipt Supported',
			icon: IconReceipt,
			color: 'bg-purple-50 text-purple-700 border-purple-200'
		},
		transaction_linked: {
			label: 'Transaction-Linked',
			icon: IconCheckmark,
			color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
		}
	};

	const sourceInfo = $derived(sourceLabels[observation.source_type]);
	const SourceIcon = $derived(sourceInfo.icon);
	function formatDate(dateStr: string) {
		const d = new Date(dateStr);
		return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
	}
</script>

<div
	class="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-card hover:border-slate-300 transition-all space-y-3 {className}"
>
	<!-- Top Bar: Source Badge & Verification -->
	<div class="flex items-center justify-between gap-2">
		<span
			class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border {sourceInfo.color}"
		>
			<SourceIcon size={12} />
			<span>{sourceInfo.label}</span>
		</span>

		<div class="flex items-center gap-1.5">
			{#if observation.verification_status === 'verified'}
				<span
					class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
				>
					<IconCheckmark size={12} />
					<span>Verified</span>
				</span>
			{:else if observation.verification_status === 'pending'}
				<span
					class="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
				>
					<IconAlertCircle size={12} />
					<span>Pending Review</span>
				</span>
			{:else if observation.verification_status === 'flagged'}
				<span class="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
					<IconAlertCircle size={12} />
					<span>Flagged</span>
				</span>
			{:else}
				<span class="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
					<IconAlertCircle size={12} />
					<span>Rejected</span>
				</span>
			{/if}
		</div>
	</div>

	<!-- Item Spec & Amount -->
	<div>
		<div class="text-[10px] text-slate-400 mb-0.5">{categoryName}</div>
		<h4 class="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
			{observation.item_specification}
		</h4>
		<div class="flex items-baseline gap-1.5 mt-1.5">
			<span class="text-xl font-extrabold text-slate-950 font-mono tracking-tight">
				₦{observation.amount.toLocaleString()}
			</span>
			<span class="text-xs text-slate-500 font-medium">/{observation.unit}</span>
		</div>
	</div>

	<!-- Location & Notes -->
	<div class="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
		<div class="flex items-center gap-1.5">
			<IconMapPin size={13} class="text-slate-400 shrink-0" />
			<span class="truncate font-medium text-slate-700">{observation.area}</span>
		</div>

		{#if observation.notes}
			<p class="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
				"{observation.notes}"
			</p>
		{/if}
	</div>

	<!-- Timestamps -->
	<div class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
		<span class="flex items-center gap-1">
			<IconClock size={12} />
			<span>Observed: {formatDate(observation.observed_at)}</span>
		</span>
		{#if observation.vendor_name}
			<span class="font-medium text-slate-600 truncate max-w-[140px]">
				{observation.vendor_name}
			</span>
		{/if}
	</div>
	<div class="flex justify-end border-t border-slate-100 pt-2">
		<ReportAction targetType="price_observation" targetId={observation.id} label="Report price" />
	</div>
</div>
