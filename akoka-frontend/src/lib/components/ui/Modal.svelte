<script lang="ts">
	import { IconX } from '$lib/components/icons';

	let {
		isOpen = false,
		title = '',
		subtitle = '',
		size = 'md',
		onclose,
		children
	}: {
		isOpen: boolean;
		title?: string;
		subtitle?: string;
		size?: 'sm' | 'md' | 'lg' | 'xl';
		onclose: () => void;
		children?: any;
	} = $props();

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-lg',
		lg: 'max-w-2xl',
		xl: 'max-w-4xl'
	};

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && isOpen) {
			onclose();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
		role="dialog"
		aria-modal="true"
	>
		<!-- Backdrop -->
		<div
			class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200"
			onclick={onclose}
			role="button"
			tabindex="0"
			onkeydown={(e) => e.key === 'Enter' && onclose()}
			aria-label="Close modal overlay"
		></div>

		<!-- Dialog Panel -->
		<div
			class="relative w-full {sizeClasses[size]} bg-white rounded-2xl shadow-elevated border border-slate-200/90 overflow-hidden transform transition-all z-10 my-8 max-h-[90vh] flex flex-col"
		>
			<!-- Header -->
			<div class="px-6 py-4.5 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
				<div>
					{#if title}
						<h3 class="text-base sm:text-lg font-bold text-slate-900 tracking-tight">{title}</h3>
					{/if}
					{#if subtitle}
						<p class="text-xs text-slate-500 mt-0.5">{subtitle}</p>
					{/if}
				</div>
				<button
					type="button"
					onclick={onclose}
					class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
					aria-label="Close"
				>
					<IconX size={18} />
				</button>
			</div>

			<!-- Body -->
			<div class="p-6 overflow-y-auto flex-1">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
{/if}
