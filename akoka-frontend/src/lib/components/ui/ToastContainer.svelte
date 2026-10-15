<script lang="ts">
	import { toast } from '$lib/stores/notificationStore';
	import { IconCheckmark, IconAlertCircle, IconInfo, IconX } from '$lib/components/icons';

	const toasts = toast;
</script>

<div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
	{#each $toasts as item (item.id)}
		<div
			class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-elevated border bg-white transition-all transform animate-in slide-in-from-bottom-2 duration-200 {item.type ===
			'success'
				? 'border-emerald-200 text-slate-800'
				: item.type === 'error'
					? 'border-rose-200 text-slate-800'
					: item.type === 'warning'
						? 'border-amber-200 text-slate-800'
						: 'border-slate-200 text-slate-800'}"
		>
			<div class="shrink-0 mt-0.5">
				{#if item.type === 'success'}
					<span class="inline-flex p-1 rounded-full bg-emerald-100 text-emerald-700">
						<IconCheckmark size={14} />
					</span>
				{:else if item.type === 'error'}
					<span class="inline-flex p-1 rounded-full bg-rose-100 text-rose-700">
						<IconAlertCircle size={14} />
					</span>
				{:else if item.type === 'warning'}
					<span class="inline-flex p-1 rounded-full bg-amber-100 text-amber-700">
						<IconAlertCircle size={14} />
					</span>
				{:else}
					<span class="inline-flex p-1 rounded-full bg-akoka-100 text-akoka-700">
						<IconInfo size={14} />
					</span>
				{/if}
			</div>

			<div class="flex-1 min-w-0">
				{#if item.title}
					<h4 class="text-xs font-semibold text-slate-900 leading-tight">{item.title}</h4>
				{/if}
				<p class="text-xs text-slate-600 mt-0.5 leading-relaxed">{item.message}</p>
			</div>

			<button
				type="button"
				onclick={() => toast.dismiss(item.id)}
				class="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
				aria-label="Dismiss toast"
			>
				<IconX size={14} />
			</button>
		</div>
	{/each}
</div>
