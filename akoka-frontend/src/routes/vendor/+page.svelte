<script lang="ts">
	import { onMount } from 'svelte';
	import { authStore } from '$lib/stores/authStore';
	import { apiClient } from '$lib/api/client';
	import { createListing, fetchListings, updateListing, type ListingInput } from '$lib/api/listings';
	import { fetchCategories } from '$lib/api/categories';
	import { fetchVendors } from '$lib/api/vendors';
	import { fetchTransactions } from '$lib/api/transactions';
	import { toast } from '$lib/stores/notificationStore';
	import Button from '$lib/components/ui/Button.svelte';
	import { IconStore, IconFileText, IconArrowRight } from '$lib/components/icons';
	import type { Category, Listing, Transaction, VendorProfile } from '$lib/types/models';

	const user = authStore;
	let vendor = $state<VendorProfile | undefined>();
	let listings = $state<Listing[]>([]);
	let transactions = $state<Transaction[]>([]);
	let categories = $state<Category[]>([]);
	let loadError = $state('');
	let saving = $state(false);
	let editingId = $state<string | undefined>();
	let categoryId = $state('');
	let title = $state('');
	let description = $state('');
	let price = $state<number | ''>('');
	let unit = $state('per item');
	let turnaround = $state('');
	let inclusionsText = $state('');
	let exclusionsText = $state('');
	let availability = $state<Listing['availability']>('available');
	const openTransactions = $derived(transactions.filter((item) => !['completed', 'cancelled'].includes(item.status)).length);

	async function loadPortal() {
		const [vendorData, offers, agreements, categoryData] = await Promise.all([fetchVendors(), fetchListings(), fetchTransactions(), fetchCategories()]);
		vendor = vendorData.find((item) => item.user_id === $user?.id);
		listings = offers.filter((item) => item.vendor_id === vendor?.id);
		transactions = agreements.filter((item) => item.vendor?.user_id === $user?.id);
		categories = categoryData;
		if (!categoryId) categoryId = categoryData[0]?.id ?? '';
	}
	onMount(() => { loadPortal().catch((error) => loadError = error instanceof Error ? error.message : 'Could not load vendor account.'); });

	function editListing(listing: Listing) {
		editingId = listing.id; categoryId = listing.category_id; title = listing.title; description = listing.description;
		price = listing.price; unit = listing.unit; turnaround = listing.turnaround_time;
		inclusionsText = listing.inclusions.join('\n'); exclusionsText = listing.exclusions.join('\n'); availability = listing.availability;
		document.getElementById('listing-editor')?.scrollIntoView({ behavior: 'smooth' });
	}
	function resetForm() { editingId = undefined; title = ''; description = ''; price = ''; unit = 'per item'; turnaround = ''; inclusionsText = ''; exclusionsText = ''; availability = 'available'; }
	function lines(value: string) { return value.split('\n').map((entry) => entry.trim()).filter(Boolean); }
	async function submitListing(event: SubmitEvent) {
		event.preventDefault();
		if (!$user || $user.role !== 'vendor' || !vendor) return;
		if (!categoryId || !title.trim() || !description.trim() || Number(price) <= 0 || !unit.trim()) return;
		saving = true; loadError = '';
		const isEditing = Boolean(editingId);
		const input: ListingInput = { category_id: categoryId, title: title.trim(), description: description.trim(), price: Number(price), unit: unit.trim(), turnaround_time: turnaround.trim(), inclusions: lines(inclusionsText), exclusions: lines(exclusionsText), availability };
		try {
			if (editingId) await updateListing(editingId, input); else await createListing(input);
			await loadPortal(); resetForm(); toast.show({ title: isEditing ? 'Listing updated' : 'Listing created', message: 'Your offer was saved.', type: 'success' });
		} catch (error) { loadError = error instanceof Error ? error.message : 'Could not save listing.'; toast.show({ title: 'Could not save listing', message: loadError, type: 'error' }); }
		finally { saving = false; }
	}
</script>

<svelte:head><title>Vendor dashboard • AKOKA</title></svelte:head>
<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-7">
	<div><p class="text-xs font-semibold uppercase tracking-wider text-akoka-700">Vendor portal</p><h1 class="text-3xl font-black text-slate-950 mt-1">{vendor?.business_name ?? `Welcome, ${$user?.display_name}`}</h1><p class="text-sm text-slate-500 mt-2">Manage your campus offers and respond to documented agreements.</p></div>
	{#if loadError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{loadError}{#if !apiClient.backendConfigured} Configure the AKOKA backend to load your portal data.{/if}</div>{/if}
	{#if !vendor && apiClient.backendConfigured}<div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your account is not linked to a vendor profile yet. Ask the backend team to provision one for this account.</div>{/if}
	<div class="grid sm:grid-cols-3 gap-4">
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconStore size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Your listings</p><p class="text-2xl font-black">{listings.length}</p></div>
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconFileText size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Agreements</p><p class="text-2xl font-black">{transactions.length}</p></div>
		<div class="rounded-2xl bg-white border border-slate-200 p-5"><IconFileText size={20} class="text-akoka-700"/><p class="text-xs text-slate-500 mt-4">Needs attention</p><p class="text-2xl font-black">{openTransactions}</p></div>
	</div>
	<div class="flex items-center justify-between"><h2 class="text-xl font-bold">Your listings</h2><span class="text-sm text-slate-500">{listings.length} offers</span></div>
	{#if listings.length}<div class="grid md:grid-cols-2 gap-3">{#each listings as listing (listing.id)}<article class="rounded-2xl border border-slate-200 bg-white p-5 flex items-start justify-between gap-3"><div><h3 class="font-bold">{listing.title}</h3><p class="text-sm text-slate-500 mt-1">₦{listing.price.toLocaleString()} / {listing.unit} · {listing.availability}</p><p class="text-xs text-slate-500 mt-2">{listing.description}</p></div><Button variant="outline" size="sm" onclick={() => editListing(listing)}>Edit</Button></article>{/each}</div>{:else}<p class="rounded-xl bg-white border border-slate-200 p-5 text-sm text-slate-500">You haven’t published an offer yet.</p>{/if}
	{#if vendor}
	<section id="listing-editor" class="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
		<div><h2 class="text-lg font-bold">{editingId ? 'Edit listing' : 'Add a listing'}</h2><p class="text-sm text-slate-500">Describe the offer, price unit, turnaround, inclusions, and exclusions.</p></div>
		<form class="grid md:grid-cols-2 gap-4" onsubmit={submitListing}>
			<label class="text-xs font-semibold text-slate-700">Category<select required bind:value={categoryId} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white">{#each categories as category}<option value={category.id}>{category.name}</option>{/each}</select></label>
			<label class="text-xs font-semibold text-slate-700">Listing title<input required maxlength="100" bind:value={title} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
			<label class="text-xs font-semibold text-slate-700">Price (₦)<input required type="number" min="1" step="1" bind:value={price} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
			<label class="text-xs font-semibold text-slate-700">Price unit<input required maxlength="60" bind:value={unit} placeholder="per page, per item, per job" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
			<label class="text-xs font-semibold text-slate-700">Turnaround<input maxlength="120" bind:value={turnaround} placeholder="e.g. 24 hours" class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" /></label>
			<label class="text-xs font-semibold text-slate-700">Availability<select bind:value={availability} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 bg-white"><option value="available">Available</option><option value="busy">Busy</option><option value="closed">Closed</option></select></label>
			<label class="md:col-span-2 text-xs font-semibold text-slate-700">Description<textarea required maxlength="1000" rows="3" bind:value={description} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"></textarea></label>
			<label class="text-xs font-semibold text-slate-700">Inclusions (one per line)<textarea rows="3" bind:value={inclusionsText} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"></textarea></label>
			<label class="text-xs font-semibold text-slate-700">Exclusions (one per line)<textarea rows="3" bind:value={exclusionsText} class="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"></textarea></label>
			<div class="md:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onclick={resetForm}>Clear</Button><Button type="submit" variant="primary" size="sm" loading={saving} disabled={!apiClient.backendConfigured || saving}>{editingId ? 'Save changes' : 'Publish listing'}</Button></div>
		</form>
	</section>{/if}
	<a href="/transactions" class="inline-flex items-center gap-2 rounded-xl bg-slate-950 text-white px-4 py-3 text-sm font-semibold">Open agreements <IconArrowRight size={16}/></a>
</main>
