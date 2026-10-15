<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { signIn } from '$lib/api/auth';
	import { setAuthenticatedUser, dashboardPathForRole } from '$lib/stores/authStore';
	import Button from '$lib/components/ui/Button.svelte';

	let email = $state('');
	let password = $state('');
	let pending = $state(false);
	let errorMessage = $state('');
	const returnTo = $derived(page.url.searchParams.get('returnTo') || '');
	const backendMissing = $derived(!apiClient.backendConfigured);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		errorMessage = '';
		try {
			const user = await signIn(email.trim(), password);
			setAuthenticatedUser(user);
			const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : dashboardPathForRole(user.role);
			await goto(safeReturn);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Sign-in failed. Please try again.';
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head><title>Sign in • AKOKA</title></svelte:head>

<main class="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid lg:grid-cols-[1fr_440px] gap-10 items-center">
	<section class="max-w-xl space-y-5">
		<p class="text-xs font-bold uppercase tracking-[0.18em] text-akoka-700">Your campus commerce account</p>
		<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">Welcome back.</h1>
		<p class="text-sm sm:text-base leading-relaxed text-slate-600">Sign in to manage your price submissions, provider offers, agreements, and account activity.</p>
		<div class="grid sm:grid-cols-3 gap-3 pt-3">
			{#each [{ title: 'Students', text: 'Compare offers and manage agreements.' }, { title: 'Providers', text: 'Maintain listings and track requests.' }, { title: 'Trust team', text: 'Review submissions and reports.' }] as item}
				<div class="rounded-2xl bg-white border border-slate-200 p-4">
					<h2 class="text-sm font-bold text-slate-900">{item.title}</h2>
					<p class="text-xs text-slate-500 mt-1">{item.text}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="rounded-3xl bg-white border border-slate-200 shadow-card p-6 sm:p-8">
		<h2 class="text-xl font-bold text-slate-950">Sign in</h2>
		<p class="text-sm text-slate-500 mt-1">Use the account registered with AKOKA.</p>
		{#if backendMissing}
			<div class="mt-5 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900" role="status">
				Account sign-in becomes available when the backend API URL is configured.
			</div>
		{/if}
		{#if errorMessage}
			<div class="mt-5 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800" role="alert">{errorMessage}</div>
		{/if}
		<form class="mt-6 space-y-4" onsubmit={submit}>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="email">Email</label>
				<input id="email" type="email" autocomplete="email" required bind:value={email} class="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="password">Password</label>
				<input id="password" type="password" autocomplete="current-password" required bind:value={password} class="w-full rounded-xl border border-slate-300 px-3.5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<Button type="submit" variant="primary" size="md" loading={pending} disabled={backendMissing} class="w-full justify-center">Sign in securely</Button>
		</form>
		<p class="text-xs text-slate-500 mt-5">New to AKOKA? <a href="/register" class="font-semibold text-akoka-700 hover:underline">Create an account</a></p>
		<a href="/" class="inline-block text-xs text-slate-500 hover:text-slate-800 mt-4">Back to campus prices</a>
	</section>
</main>
