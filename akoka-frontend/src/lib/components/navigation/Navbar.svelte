<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authStore, clearAuthenticatedUser, dashboardPathForRole } from '$lib/stores/authStore';
	import { signOut } from '$lib/api/auth';
	import { IconPlus } from '$lib/components/icons';

	let { onOpenSubmitModal }: { onOpenSubmitModal?: () => void } = $props();
	let isMobileNavOpen = $state(false);
	const currentUser = authStore;
	const publicNav = [
		{ label: 'Campus Intelligence', href: '/' },
		{ label: 'Price Compare', href: '/compare' },
		{ label: 'Campus Directory', href: '/listings' }
	];
	const portalHref = $derived($currentUser ? dashboardPathForRole($currentUser.role) : '');

	async function handleSignOut() {
		try { await signOut(); } catch { /* Clear the local session even if the network is unavailable. */ }
		clearAuthenticatedUser();
		await goto('/');
	}
</script>

<header class="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-16 gap-4">
			<a href="/" class="flex items-center gap-3 group shrink-0">
				<div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-950 via-slate-900 to-akoka-700 text-white flex items-center justify-center font-black text-lg tracking-wider shadow-sm">A</div>
				<div class="flex flex-col">
					<span class="font-extrabold text-lg text-slate-950 tracking-tight">AKOKA</span>
					<span class="text-[10px] text-slate-500 font-medium -mt-0.5 tracking-tight hidden sm:block">Campus Price Intelligence</span>
				</div>
			</a>

			<nav class="hidden lg:flex items-center gap-1" aria-label="Main navigation">
				{#each publicNav as item}
					{@const active = item.href === '/' ? page.url.pathname === '/' : page.url.pathname.startsWith(item.href)}
					<a href={item.href} class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors {active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}">{item.label}</a>
				{/each}
				{#if $currentUser}
					<a href="/transactions" class="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50">Agreements</a>
					<a href={portalHref} class="px-3.5 py-2 rounded-lg text-xs font-semibold text-akoka-700 hover:bg-sky-50">My portal</a>
				{/if}
			</nav>

			<div class="flex items-center gap-2">
				<button type="button" onclick={onOpenSubmitModal} class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"><IconPlus size={15} /><span class="hidden sm:inline">Submit Price</span></button>
				{#if $currentUser}
					<div class="hidden sm:flex items-center gap-2">
						<a href={portalHref} class="text-xs text-slate-600">{$currentUser.display_name}</a>
						<span class="text-[10px] uppercase font-bold text-slate-500 bg-slate-100 px-1.5 py-1 rounded">{$currentUser.role}</span>
						<button type="button" onclick={handleSignOut} class="text-xs font-semibold text-slate-500 hover:text-rose-700 px-2 py-2">Sign out</button>
					</div>
				{:else}
					<a href="/sign-in" class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">Sign in</a>
				{/if}
				<button type="button" onclick={() => (isMobileNavOpen = !isMobileNavOpen)} class="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100" aria-label="Toggle navigation">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isMobileNavOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} /></svg>
				</button>
			</div>
		</div>
	</div>
	{#if isMobileNavOpen}
		<nav class="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1" aria-label="Mobile navigation">
			{#each publicNav as item}<a href={item.href} onclick={() => (isMobileNavOpen = false)} class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">{item.label}</a>{/each}
			{#if $currentUser}
				<a href="/transactions" class="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50">Agreements</a>
				<a href={portalHref} class="block px-3 py-2 rounded-lg text-sm font-semibold text-akoka-700 hover:bg-sky-50">{$currentUser.role} portal</a>
				<button type="button" onclick={handleSignOut} class="block w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50">Sign out</button>
			{:else}<a href="/sign-in" class="block px-3 py-2 rounded-lg text-sm font-semibold text-akoka-700 hover:bg-sky-50">Sign in</a>{/if}
		</nav>
	{/if}
</header>
