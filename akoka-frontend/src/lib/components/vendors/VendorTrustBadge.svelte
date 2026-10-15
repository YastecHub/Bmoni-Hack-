<script lang="ts">
	import type { VerificationStatus } from '$lib/types/models';
	import { IconShieldCheck, IconAlertCircle, IconUserCheck } from '$lib/components/icons';

	let {
		status,
		showFullDisclaimer = false,
		class: className = ''
	}: {
		status: VerificationStatus;
		showFullDisclaimer?: boolean;
		class?: string;
	} = $props();

	const statusConfig = {
		vendor_confirmed: {
			label: 'Vendor Confirmed',
			badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
			iconColor: 'text-emerald-600',
			icon: IconShieldCheck,
			disclaimer: 'Identity, physical shop and active campus price list confirmed with vendor.'
		},
		campus_audited: {
			label: 'Campus Audited',
			badgeClass: 'bg-sky-50 text-sky-800 border-sky-200',
			iconColor: 'text-sky-600',
			icon: IconUserCheck,
			disclaimer: 'Independently audited by student community ambassadors at UNILAG.'
		},
		unverified: {
			label: 'Unverified Community Profile',
			badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
			iconColor: 'text-amber-600',
			icon: IconAlertCircle,
			disclaimer: 'This provider profile has not been independently verified.'
		}
	};

	const current = $derived(statusConfig[status]);
	const StatusIcon = $derived(current.icon);
</script>

<div class="inline-flex flex-col gap-1 {className}">
	<span
		class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border {current.badgeClass}"
	>
		<StatusIcon size={14} class={current.iconColor} />
		<span>{current.label}</span>
	</span>

	{#if showFullDisclaimer || status === 'unverified'}
		<span class="text-[11px] text-slate-500 italic max-w-xs leading-tight">
			{current.disclaimer}
		</span>
	{/if}
</div>
