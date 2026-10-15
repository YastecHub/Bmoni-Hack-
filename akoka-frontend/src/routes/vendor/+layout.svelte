<script lang="ts">
	import RequireRole from '$lib/components/auth/RequireRole.svelte';
	let { children } = $props();
</script>

<RequireRole roles={['vendor']}>
	{@render children()}
</RequireRole>
