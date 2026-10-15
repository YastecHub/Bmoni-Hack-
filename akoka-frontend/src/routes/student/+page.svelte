<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { fetchTransactions } from '$lib/api/transactions';
	import { fetchObservations } from '$lib/api/insights';
	import { apiClient } from '$lib/api/client';
	import { IconFileText, IconTagPrice, IconMapPin, IconArrowRight } from '$lib/components/icons';
	const user = authStore;
	let transactions = $state<import('$lib/types/models').Transaction[]>([]);
	let verifiedPrices = $state(0);
	let loadError = $state('');
	onMount(async () => { try { const [tx, observations] = await Promise.all([fetchTransactions(), fetchObservations()]); transactions = tx; verifiedPrices = observations.filter((item) => item.verification_status === 'verified').length; } catch (error) { loadError = error instanceof Error ? error.message : 'Could not load account data.'; } });
	const active = $derived(transactions.filter((item) => !['completed', 'cancelled'].includes(item.status)).length);
</script>

<svelte:head><title>Student dashboard • AKOKA</title></svelte:head>
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
	<div><p class="text-xs font-semibold uppercase tracking-wider text-akoka-700">Student portal</p><h1 class="text-3xl font-black text-slate-950 mt-1">Welcome, {$user?.display_name}</h1><p class="text-sm text-slate-500 mt-2">Compare campus prices, manage your agreements, and follow your activity.</p></div>
	{#if loadError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}{#if !apiClient.backendConfigured} Configure the AKOKA backend to load your portal data.{/if}</div>{/if}
	<div class="grid sm:grid-cols-3 gap-4">
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconFileText size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Your agreements</p><p class="text-2xl font-black">{transactions.length}</p></div>
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconTagPrice size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Active agreements</p><p class="text-2xl font-black">{active}</p></div>
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconMapPin size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Verified price observations</p><p class="text-2xl font-black">{verifiedPrices}</p></div>
	</div>
	<div class="grid md:grid-cols-2 gap-4">
		<a href="/compare" class="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300"><h2 class="font-bold">Compare campus prices</h2><p class="text-sm text-slate-500 mt-2">Review comparable prices, confidence levels, and recent trends.</p><span class="inline-flex items-center gap-2 text-sm font-semibold text-akoka-700 mt-5">Open comparison <IconArrowRight size={16}/></span></a>
		<a href="/transactions" class="group rounded-2xl bg-white border border-slate-200 p-6 hover:border-slate-300"><h2 class="font-bold">Your agreements</h2><p class="text-sm text-slate-500 mt-2">Review documented scope, milestones, and payment status.</p><span class="inline-flex items-center gap-2 text-sm font-semibold text-akoka-700 mt-5">View agreements <IconArrowRight size={16}/></span></a>
	</div>
</main>
