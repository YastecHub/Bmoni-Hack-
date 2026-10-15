<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { SlidersHorizontalIcon } from '@hugeicons/core-free-icons';

	let { size = 20, class: className = '', strokeWidth = 1.5 }: { size?: number; class?: string; strokeWidth?: number } = $props();
</script>

<HugeiconsIcon icon={SlidersHorizontalIcon} {size} {strokeWidth} class={className} aria-hidden="true" />
