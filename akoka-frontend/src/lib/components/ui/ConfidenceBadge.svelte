<script lang="ts">
	import type { ConfidenceLevel } from '$lib/types/models';
	import { IconShieldCheck, IconAlertCircle, IconInfo } from '$lib/components/icons';

	let {
		level,
		sampleSize = 0,
		reason = '',
		showTooltip = true
	}: {
		level: ConfidenceLevel;
		sampleSize?: number;
		reason?: string;
		showTooltip?: boolean;
	} = $props();

	const config = {
		high: {
			label: 'High Confidence',
			badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
			iconColor: 'text-emerald-600',
			dotColor: 'bg-emerald-500',
			desc: 'Multiple recent, independent & verified campus observations with low variation.'
		},
		moderate: {
			label: 'Moderate Confidence',
			badgeClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
			iconColor: 'text-sky-600',
			dotColor: 'bg-sky-500',
			desc: 'Recent campus observations found, but limited sample size. Check conditions.'
		},
		low: {
			label: 'Low Confidence',
			badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80',
			iconColor: 'text-amber-600',
			dotColor: 'bg-amber-500',
			desc: 'Few or older observations. Informational only; confirm directly with vendor.'
		},
		insufficient_data: {
			label: 'Insufficient Data',
			badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
			iconColor: 'text-slate-500',
			dotColor: 'bg-slate-400',
			desc: 'Not enough recent, comparable observations to estimate a reliable market range yet.'
		}
	};

	let isExpanded = $state(false);
	const active = $derived(config[level]);
</script>

<div class="relative inline-block">
	<button
		type="button"
		onclick={() => (isExpanded = !isExpanded)}
		class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer hover:shadow-xs {active.badgeClass}"
		title="Click to inspect data confidence methodology"
	>
		<span class="w-1.5 h-1.5 rounded-full {active.dotColor}"></span>
		{#if level === 'high'}
			<IconShieldCheck size={14} class={active.iconColor} />
		{:else if level === 'insufficient_data'}
			<IconAlertCircle size={14} class={active.iconColor} />
		{:else}
			<IconInfo size={14} class={active.iconColor} />
		{/if}
		<span>{active.label}</span>
		{#if sampleSize > 0}
			<span class="opacity-70 font-mono text-[11px]">({sampleSize} obs)</span>
		{/if}
	</button>

	{#if isExpanded && showTooltip}
		<div
			class="absolute z-50 left-0 mt-2 w-72 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-800 animate-in fade-in slide-in-from-top-1"
		>
			<div class="flex items-center justify-between pb-1 border-b border-slate-800 font-semibold text-slate-200">
				<span>Confidence Score Indicator</span>
				<button
					type="button"
					onclick={() => (isExpanded = false)}
					class="text-slate-400 hover:text-white p-0.5"
				>
					✕
				</button>
			</div>
			<p class="text-slate-300 leading-relaxed">
				{reason || active.desc}
			</p>
			<p class="text-[11px] text-slate-400 pt-1 border-t border-slate-800 italic">
				Note: A confidence label describes the strength of available data, not a subjective guarantee of vendor quality.
			</p>
		</div>
	{/if}
</div>
