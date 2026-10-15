<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { fetchCurrentUser } from '$lib/api/auth';
	import { apiClient } from '$lib/api/client';
	import { authStore, setAuthenticatedUser, clearAuthenticatedUser, dashboardPathForRole } from '$lib/stores/authStore';
	import type { UserRole } from '$lib/types/models';

	let { roles, children }: { roles: UserRole[]; children: import('svelte').Snippet } = $props();
	let ready = $state(false);
	let denied = $state(false);

	onMount(async () => {
		if (!apiClient.backendConfigured) {
			denied = true;
			await goto('/sign-in?reason=backend');
			return;
		}
		try {
			const user = await fetchCurrentUser();
			setAuthenticatedUser(user);
			if (!roles.includes(user.role)) {
				denied = true;
				await goto(dashboardPathForRole(user.role));
				return;
			}
			ready = true;
		} catch {
			clearAuthenticatedUser();
			denied = true;
			await goto(`/sign-in?returnTo=${encodeURIComponent(page.url.pathname)}`);
		}
	});
</script>

{#if ready && $authStore && roles.includes($authStore.role)}
	{@render children()}
{:else if !denied}
	<div class="min-h-[45vh] grid place-items-center text-sm text-slate-500" role="status">Checking your account…</div>
{/if}
