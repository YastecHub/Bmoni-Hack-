<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { registerAccount } from '$lib/api/auth';
	import { setAuthenticatedUser, dashboardPathForRole } from '$lib/stores/authStore';
	import { UNILAG_CAMPUS_ZONES } from '$lib/data/campusZones';
	import Button from '$lib/components/ui/Button.svelte';

	let name = $state('');
	let email = $state('');
	let password = $state('');
	let phone = $state('');
	let role = $state<'student' | 'vendor'>('student');
	let campusZone = $state(UNILAG_CAMPUS_ZONES[0]?.id ?? '');
	let pending = $state(false);
	let errorMessage = $state('');
	const backendMissing = $derived(!apiClient.backendConfigured);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		pending = true;
		errorMessage = '';
		try {
			const user = await registerAccount({ name: name.trim(), email: email.trim(), password, phone: phone.trim(), role, campus_zone: campusZone });
			setAuthenticatedUser(user);
			const returnTo = page.url.searchParams.get('returnTo') || '';
			const safeReturn = returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : dashboardPathForRole(user.role);
			await goto(safeReturn);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not create your account.';
		} finally {
			pending = false;
		}
	}
</script>

<svelte:head><title>Create account • AKOKA</title></svelte:head>

<main class="max-w-6xl mx-auto px-4 py-12 sm:py-16 grid lg:grid-cols-[1fr_480px] gap-10 items-center">
	<section class="max-w-xl space-y-5">
		<p class="text-xs font-bold uppercase tracking-[0.18em] text-akoka-700">Join campus commerce</p>
		<h1 class="text-3xl sm:text-5xl font-black tracking-tight text-slate-950">Create your account.</h1>
		<p class="text-sm leading-relaxed text-slate-600">Choose the account type that fits how you use AKOKA. Moderator accounts are provisioned by the platform team.</p>
		<div class="p-5 rounded-2xl bg-slate-900 text-white">
			<div class="text-xs uppercase tracking-widest text-slate-300">Account security</div>
			<p class="text-sm mt-2 leading-relaxed text-slate-100">Your password is sent only to the configured backend over HTTPS. AKOKA does not store it in browser storage.</p>
		</div>
	</section>

	<section class="rounded-3xl bg-white border border-slate-200 shadow-card p-6 sm:p-8">
		<h2 class="text-xl font-bold text-slate-950">Register</h2>
		{#if backendMissing}
			<div class="mt-4 p-3 rounded-xl border border-amber-200 bg-amber-50 text-xs text-amber-900" role="status">Account registration becomes available when the backend API URL is configured.</div>
		{/if}
		{#if errorMessage}<div class="mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-xs text-rose-800" role="alert">{errorMessage}</div>{/if}
		<form class="mt-5 space-y-3.5" onsubmit={submit}>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="name">Full name</label>
				<input id="name" autocomplete="name" required bind:value={name} class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="email">Email</label>
				<input id="email" type="email" autocomplete="email" required bind:value={email} class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="password">Password</label>
				<input id="password" type="password" autocomplete="new-password" minlength="8" required bind:value={password} class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<div class="grid sm:grid-cols-2 gap-3">
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1" for="role">Account type</label>
					<select id="role" bind:value={role} class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white">
						<option value="student">Student</option><option value="vendor">Service provider</option>
					</select>
				</div>
				<div>
					<label class="block text-xs font-semibold text-slate-700 mb-1" for="zone">Campus area</label>
					<select id="zone" bind:value={campusZone} class="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm bg-white">
						{#each UNILAG_CAMPUS_ZONES as zone}<option value={zone.id}>{zone.shortName}</option>{/each}
					</select>
				</div>
			</div>
			<div>
				<label class="block text-xs font-semibold text-slate-700 mb-1" for="phone">Phone (optional)</label>
				<input id="phone" type="tel" autocomplete="tel" bind:value={phone} class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-akoka-500" />
			</div>
			<Button type="submit" variant="primary" size="md" loading={pending} disabled={backendMissing} class="w-full justify-center">Create account</Button>
		</form>
		<p class="text-xs text-slate-500 mt-5">Already registered? <a href="/sign-in" class="font-semibold text-akoka-700 hover:underline">Sign in</a></p>
	</section>
</main>
