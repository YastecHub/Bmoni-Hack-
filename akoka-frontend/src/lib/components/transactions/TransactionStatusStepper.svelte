<script lang="ts">
	import type { TransactionStatus } from '$lib/types/models';
	import { IconCheckmark, IconAlertCircle } from '$lib/components/icons';

	let { status }: { status: TransactionStatus } = $props();

	const steps: Array<{ key: TransactionStatus; label: string; desc: string }> = [
		{ key: 'draft', label: 'Draft', desc: 'Terms drafted' },
		{ key: 'awaiting_agreement', label: 'Review', desc: 'Awaiting sign-off' },
		{ key: 'agreed', label: 'Agreed', desc: 'Scope locked' },
		{ key: 'in_progress', label: 'In Progress', desc: 'Execution active' },
		{ key: 'awaiting_confirmation', label: 'Verification', desc: 'Drop-off / Inspection' },
		{ key: 'completed', label: 'Completed', desc: 'Both sides signed' }
	];

	function getStepIndex(s: TransactionStatus): number {
		const order: Record<TransactionStatus, number> = {
			draft: 0,
			awaiting_agreement: 1,
			agreed: 2,
			in_progress: 3,
			awaiting_confirmation: 4,
			completed: 5,
			disputed: -1,
			cancelled: -2
		};
		return order[s] ?? 0;
	}

	const currentIndex = $derived(getStepIndex(status));
</script>

{#if status === 'disputed'}
	<div class="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
		<div class="p-1 rounded-full bg-rose-100 text-rose-700 shrink-0 mt-0.5">
			<IconAlertCircle size={18} />
		</div>
		<div>
			<h4 class="text-xs font-bold uppercase tracking-wider text-rose-700">Transaction Disputed</h4>
			<p class="text-xs text-rose-800 mt-0.5 leading-relaxed">
				An issue has been flagged. The transaction is held in the Trust Desk review queue for campus moderation.
			</p>
		</div>
	</div>
{:else if status === 'cancelled'}
	<div class="p-4 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center gap-3">
		<IconAlertCircle size={18} class="text-slate-500" />
		<div>
			<h4 class="text-xs font-bold text-slate-800">Transaction Cancelled</h4>
			<p class="text-xs text-slate-600">The agreed terms were cancelled by mutual agreement.</p>
		</div>
	</div>
{:else}
	<div class="w-full overflow-x-auto pb-2">
		<div class="flex items-center justify-between min-w-[560px]">
			{#each steps as step, idx}
				{@const isPast = idx < currentIndex}
				{@const isCurrent = idx === currentIndex}

				<div class="flex flex-col items-center relative flex-1 text-center">
					<!-- Connector bar -->
					{#if idx > 0}
						<div
							class="absolute top-3.5 -left-1/2 w-full h-0.5 -z-0 {idx <= currentIndex
								? 'bg-emerald-500'
								: 'bg-slate-200'}"
						></div>
					{/if}

					<!-- Node circle -->
					<div
						class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-colors shadow-2xs {isPast
							? 'bg-emerald-600 text-white'
							: isCurrent
								? 'bg-slate-950 text-white ring-4 ring-slate-200'
								: 'bg-white border-2 border-slate-300 text-slate-400'}"
					>
						{#if isPast}
							<IconCheckmark size={14} />
						{:else}
							<span>{idx + 1}</span>
						{/if}
					</div>

					<!-- Label -->
					<span
						class="text-xs font-bold mt-2 {isCurrent
							? 'text-slate-950 font-extrabold'
							: isPast
								? 'text-emerald-700 font-semibold'
								: 'text-slate-600 font-medium'}"
					>
						{step.label}
					</span>
					<span class="text-[10px] text-slate-600 mt-0.5">{step.desc}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}
