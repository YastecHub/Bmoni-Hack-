<script lang="ts">
	import type { TransactionEvent } from '$lib/types/models';
	import {
		IconClock,
		IconCheckmark,
		IconAlertCircle,
		IconFileText,
		IconReceipt
	} from '$lib/components/icons';

	let { events }: { events: TransactionEvent[] } = $props();

	function getEventIcon(type: TransactionEvent['event_type']) {
		switch (type) {
			case 'created':
			case 'agreement_proposed':
				return IconFileText;
			case 'agreement_accepted':
			case 'completion_confirmed':
				return IconCheckmark;
			case 'deliverable_submitted':
			case 'milestone_completed':
				return IconReceipt;
			case 'issue_flagged':
				return IconAlertCircle;
			default:
				return IconClock;
		}
	}

	function formatTime(isoStr: string) {
		const d = new Date(isoStr);
		return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
	}
</script>

<div class="space-y-4">
	<div class="flex items-center justify-between pb-2 border-b border-slate-100">
		<h4 class="text-xs font-bold uppercase tracking-wider text-slate-500">
			Audit & Event Trail
		</h4>
		<span class="text-[11px] font-mono text-slate-400">{events.length} events logged</span>
	</div>

	<div class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
		{#each events as evt}
			{@const EvtIcon = getEventIcon(evt.event_type)}
			<div class="relative group">
				<!-- Bullet -->
				<div
					class="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-slate-400 group-hover:border-akoka-600 flex items-center justify-center text-slate-600 transition-colors shadow-2xs"
				>
					<EvtIcon size={11} />
				</div>

				<!-- Event Content -->
				<div class="space-y-0.5 text-xs">
					<div class="flex items-center gap-2">
						<span class="font-bold text-slate-900">{evt.actor_name}</span>
						<span class="text-[10px] font-mono uppercase px-1 py-0.2 bg-slate-100 text-slate-500 rounded">
							{evt.actor_role}
						</span>
						<span class="text-[11px] text-slate-400 font-mono ml-auto">
							{formatTime(evt.created_at)}
						</span>
					</div>
					<p class="text-slate-600 leading-relaxed text-xs">
						{evt.details}
					</p>
				</div>
			</div>
		{/each}
	</div>
</div>
