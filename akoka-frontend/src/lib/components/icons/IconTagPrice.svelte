<script lang="ts">
	import { HugeiconsIcon } from '@hugeicons/svelte';
	import { Tag01Icon } from '@hugeicons/core-free-icons';

	let { size = 20, class: className = '', strokeWidth = 1.5 }: { size?: number; class?: string; strokeWidth?: number } = $props();
</script>

<HugeiconsIcon icon={Tag01Icon} {size} {strokeWidth} class={className} aria-hidden="true" />
