<script lang="ts">
	import Modal from '$lib/components/ui/Modal.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/client';
	import { UNILAG_CAMPUS_ZONES } from '$lib/data/campusZones';
	import { fetchCategories } from '$lib/api/categories';
	import { submitPriceObservation } from '$lib/api/insights';
	import { toast } from '$lib/stores/notificationStore';
	import { authStore } from '$lib/stores/authStore';
	import type { ObservationSourceType } from '$lib/types/models';

	let {
		isOpen = false,
		onclose
	}: {
		isOpen: boolean;
		onclose: () => void;
	} = $props();

	let categories = $state<import('$lib/types/models').Category[]>([]);
	const currentUser = authStore;

	let categoryId = $state('');
	let itemSpecification = $state('');
	let amount = $state<number | ''>('');
	let unit = $state('per page');
	let campusZone = $state('new_hall');
	let areaDetail = $state('');
	let sourceType = $state<ObservationSourceType>('student_submitted');
	let notes = $state('');
	let isSubmitting = $state(false);
	let categoryLoadError = $state('');
	onMount(() => { fetchCategories().then((items) => { categories = items; categoryId = items[0]?.id ?? ''; }).catch((error) => categoryLoadError = error.message); });

	const activeCategory = $derived(categories.find((c) => c.id === categoryId));
	$effect(() => { sourceType = $currentUser?.role === 'vendor' ? 'vendor_confirmed' : 'student_submitted'; });

	// Update default item specification based on chosen category
	$effect(() => {
		const currentCat = categories.find((c) => c.id === categoryId);
		if (currentCat && currentCat.typical_item_specs.length > 0) {
			if (!itemSpecification) {
				itemSpecification = currentCat.typical_item_specs[0];
				unit = currentCat.unit_definition.split('/')[0].trim();
			}
		}
	});

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!$currentUser) {
			toast.show({ title: 'Sign in required', message: 'Sign in before submitting a price observation.', type: 'error' });
			return;
		}
		if (!amount || Number(amount) <= 0) {
			toast.show({
				title: 'Invalid Amount',
				message: 'Please provide a valid price in Naira (₦)',
				type: 'error'
			});
			return;
		}

		if (!itemSpecification.trim()) {
			toast.show({
				title: 'Specification Required',
				message: 'Please describe the specific item or service.',
				type: 'error'
			});
			return;
		}

		isSubmitting = true;

		try {
			const selectedZone = UNILAG_CAMPUS_ZONES.find((z) => z.id === campusZone);
			const areaText = areaDetail.trim()
				? `${selectedZone?.shortName}: ${areaDetail.trim()}`
				: selectedZone?.name || 'UNILAG Akoka';

			await submitPriceObservation({
				category_id: categoryId,
				item_specification: itemSpecification.trim(),
				amount: Number(amount),
				unit: unit.trim() || 'job',
				area: areaText,
				campus_zone: campusZone,
				source_type: sourceType,
				notes: notes.trim() || undefined
			});

			toast.show({
				title: 'Price Observation Logged',
				message: 'Thank you! Your observation has been queued for verification on the Trust Desk.',
				type: 'success'
			});

			// Reset form
			amount = '';
			notes = '';
			isSubmitting = false;
			onclose();
		} catch (err: any) {
			isSubmitting = false;
			toast.show({
				title: 'Submission Failed',
				message: err?.message || 'Could not save observation.',
				type: 'error'
			});
		}
	}
</script>

<Modal
	{isOpen}
	{onclose}
	title="Submit Recent Campus Price"
	subtitle="Help fellow UNILAG students compare transparent prices across Akoka"
	size="lg"
>
	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Category Selector -->
		<div>
			<label for="cat-select" class="block text-xs font-semibold text-slate-700 mb-1">
				Campus Service Category
			</label>
			<select
				id="cat-select"
				bind:value={categoryId}
				class="w-full text-xs font-medium rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
			>
				{#each categories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>

		<!-- Item Specification / Like-for-Like Detail -->
		<div>
			<div class="flex items-center justify-between mb-1">
				<label for="item-spec" class="block text-xs font-semibold text-slate-700">
					Item Specification & Standard Conditions
				</label>
				<span class="text-[11px] text-slate-400">Must be like-for-like</span>
			</div>
			<input
				id="item-spec"
				type="text"
				bind:value={itemSpecification}
				placeholder="e.g. B&W Printing A4 (80gsm, Single-sided)"
				class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				required
			/>
			<!-- Quick Presets -->
			{#if activeCategory && activeCategory.typical_item_specs.length > 0}
				<div class="flex flex-wrap gap-1.5 mt-2">
					<span class="text-[10px] text-slate-400 self-center">Presets:</span>
					{#each activeCategory.typical_item_specs as spec}
						<button
							type="button"
							onclick={() => (itemSpecification = spec)}
							class="text-[11px] px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
						>
							{spec}
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Price & Unit -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<div>
				<label for="price-input" class="block text-xs font-semibold text-slate-700 mb-1">
					Observed Price (₦ Naira)
				</label>
				<div class="relative">
					<span class="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₦</span>
					<input
						id="price-input"
						type="number"
						bind:value={amount}
						placeholder="35"
						min="1"
						class="w-full text-xs font-semibold rounded-xl border border-slate-300 pl-7 pr-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
						required
					/>
				</div>
			</div>

			<div>
				<label for="unit-input" class="block text-xs font-semibold text-slate-700 mb-1">
					Unit / Quantity Baseline
				</label>
				<input
					id="unit-input"
					type="text"
					bind:value={unit}
					placeholder="per page / per bag / per job"
					class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
					required
				/>
			</div>
		</div>

		<!-- Campus Zone & Exact Spot -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
			<div>
				<label for="zone-select" class="block text-xs font-semibold text-slate-700 mb-1">
					UNILAG Campus Zone
				</label>
				<select
					id="zone-select"
					bind:value={campusZone}
					class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					{#each UNILAG_CAMPUS_ZONES as zone}
						<option value={zone.id}>{zone.name} ({zone.shortName})</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="area-detail" class="block text-xs font-semibold text-slate-700 mb-1">
					Shop / Landmark Location
				</label>
				<input
					id="area-detail"
					type="text"
					bind:value={areaDetail}
					placeholder="e.g. Shop 4 CITS Annex / New Hall Car Park"
					class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				/>
			</div>
		</div>

		<!-- Observation source -->
		<div class="pt-1">
			<div>
				<label for="source-select" class="block text-xs font-semibold text-slate-700 mb-1">
					Observation Source Type
				</label>
				<select
					id="source-select"
					bind:value={sourceType}
					class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				>
					{#if $currentUser?.role === 'vendor'}
						<option value="vendor_confirmed">Vendor Confirmed (Direct Price List)</option>
					{:else}
						<option value="student_submitted">Student Submitted (Self-report)</option>
					{/if}
				</select>
			</div>
		</div>
		<p class="text-[11px] text-slate-500">Receipt uploads are not enabled yet. Transaction-linked sources are recorded from completed agreements.</p>

		<!-- Notes / Scope details -->
		<div>
			<label for="notes-input" class="block text-xs font-semibold text-slate-700 mb-1">
				Observations Notes (Conditions, paper weight, rush fees, discounts)
			</label>
			<textarea
				id="notes-input"
				bind:value={notes}
				rows="2"
				placeholder="e.g. Black and white print on 80gsm bond paper, vendor gave ₦5 discount for over 100 pages."
				class="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
			></textarea>
		</div>

		<!-- Guardrail notice -->
		{#if categoryLoadError}<div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-700" role="alert">{categoryLoadError}</div>{/if}
		{#if !apiClient.backendConfigured}<div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800">Connect the AKOKA backend to submit price observations.</div>{/if}
		<div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
			<div class="font-semibold text-slate-800">Verification Integrity Notice</div>
			<p>
				Submitted observations are held in the Trust Desk moderation queue until confirmed by community cross-checks or receipt verification. Avoid submitting inaccurate or promotional quotes.
			</p>
		</div>

		<!-- Actions -->
		<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
			<Button variant="outline" size="md" onclick={onclose}>Cancel</Button>
			<Button variant="primary" size="md" type="submit" loading={isSubmitting} disabled={!apiClient.backendConfigured || categories.length === 0}>
				Submit Observation
			</Button>
		</div>
	</form>
</Modal>
