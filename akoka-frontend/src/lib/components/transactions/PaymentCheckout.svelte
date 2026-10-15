<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { apiClient } from '$lib/api/client';
	import { fetchPaymentStatus, startTransactionPayment, type PaymentStatus } from '$lib/api/payments';
	import { authStore } from '$lib/stores/authStore';
	import type { Transaction } from '$lib/types/models';
	import Button from '$lib/components/ui/Button.svelte';
	import { IconLock, IconAlertCircle, IconCheckmark } from '$lib/components/icons';

	let { transaction }: { transaction: Transaction } = $props();
	const user = authStore;
	let paymentStatus = $state<PaymentStatus | 'not_started' | 'pending'>('not_started');
	let errorMessage = $state('');
	let pending = $state(false);
	const paymentId = $derived(page.url.searchParams.get('payment_id'));
	const canPay = $derived($user?.id === transaction.buyer_id && $user?.role === 'student');
	$effect(() => { paymentStatus = transaction.payment?.status ?? 'not_started'; });

	onMount(() => {
		if (!paymentId || !apiClient.backendConfigured) return;
		fetchPaymentStatus(paymentId).then((payment) => { paymentStatus = payment.status; }).catch((error) => {
			errorMessage = error instanceof Error ? error.message : 'Unable to confirm payment status.';
		});
	});

	async function handleCheckout() {
		if (!apiClient.backendConfigured || !canPay || transaction.status !== 'agreed' || pending) return;
		pending = true;
		errorMessage = '';
		try {
			const returnUrl = `${window.location.origin}/transactions/${encodeURIComponent(transaction.id)}`;
			const payment = await startTransactionPayment(transaction.id, returnUrl);
			paymentStatus = payment.status;
			if (payment.checkout_url) {
				const checkoutUrl = new URL(payment.checkout_url);
				if (checkoutUrl.protocol !== 'https:') throw new Error('The payment provider returned an insecure checkout URL.');
				window.location.assign(checkoutUrl.toString());
			} else if (payment.status !== 'succeeded') {
				throw new Error('Payment service did not return a checkout link.');
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Could not start secure checkout.';
		} finally {
			pending = false;
		}
	}

	function label(status: string) {
		return status.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
	}
</script>

<section class="rounded-2xl border border-slate-200 bg-white p-5" aria-labelledby="payment-heading">
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div class="flex items-start gap-3">
			<div class="rounded-xl bg-sky-50 text-akoka-700 p-2"><IconLock size={18} /></div>
			<div>
				<h2 id="payment-heading" class="text-sm font-bold text-slate-900">Secure payment</h2>
				<p class="text-xs text-slate-500 mt-1">Payments are initiated through the connected backend and its approved fintech provider.</p>
				<p class="text-xs font-semibold text-slate-700 mt-2">Status: {label(paymentStatus)}</p>
			</div>
		</div>
		<div class="sm:text-right">
			<div class="text-lg font-bold text-slate-950">₦{transaction.agreed_price.toLocaleString()}</div>
			{#if canPay && transaction.status === 'agreed' && paymentStatus !== 'succeeded'}
				<Button type="button" variant="primary" size="sm" loading={pending} disabled={!apiClient.backendConfigured || pending} onclick={handleCheckout} class="mt-2">Continue to payment</Button>
			{:else if paymentStatus === 'succeeded'}
				<span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 mt-2"><IconCheckmark size={14} />Payment confirmed</span>
			{:else if !canPay}
				<p class="text-[11px] text-slate-400 mt-2">Only the signed-in buyer can pay this agreement.</p>
			{:else if transaction.status !== 'agreed'}
				<p class="text-[11px] text-slate-400 mt-2">Payment is available after both parties agree to the terms.</p>
			{/if}
		</div>
	</div>
	{#if !apiClient.backendConfigured}<p class="mt-3 text-xs text-amber-800">Connect the backend API before enabling payment.</p>{/if}
	{#if errorMessage}<p class="mt-3 flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800" role="alert"><IconAlertCircle size={15} />{errorMessage}</p>{/if}
</section>
