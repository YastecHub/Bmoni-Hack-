<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { apiClient } from '$lib/api/client';
	import { fetchTransactionById, fetchTransactionEvents, updateTransactionAgreement, uploadTransactionEvidence } from '$lib/api/transactions';
	import { submitReport } from '$lib/api/reports';
	import { submitTransactionReview } from '$lib/api/vendors';
	import { authStore } from '$lib/stores/authStore';
	import { toast } from '$lib/stores/notificationStore';
	import TransactionStatusStepper from '$lib/components/transactions/TransactionStatusStepper.svelte';
	import EventAuditTimeline from '$lib/components/transactions/EventAuditTimeline.svelte';
	import PaymentCheckout from '$lib/components/transactions/PaymentCheckout.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import {
		IconCheckmark,
		IconClock,
		IconAlertCircle,
		IconFileText,
		IconReceipt,
		IconShieldCheck,
		IconFlag,
		IconPlus
	} from '$lib/components/icons';
	import type { Transaction, TransactionEvent, TransactionMilestone } from '$lib/types/models';

	const txId = page.params.id || '';
	const currentUser = authStore;

	let transaction = $state<Transaction | undefined>();
	let events = $state<TransactionEvent[]>([]);
	let pageError = $state('');
	let busy = $state(false);
	async function refresh() {
		const [nextTransaction, nextEvents] = await Promise.all([fetchTransactionById(txId), fetchTransactionEvents(txId)]);
		transaction = nextTransaction;
		events = nextEvents;
	}
	onMount(() => { refresh().catch((error) => pageError = error instanceof Error ? error.message : 'Could not load agreement.'); });
	const isBuyer = $derived(Boolean(transaction && $currentUser?.id === transaction.buyer_id && $currentUser?.role === 'student'));
	const isVendor = $derived(Boolean(transaction && $currentUser?.role === 'vendor' && $currentUser?.id === transaction.vendor?.user_id));
	const canCancel = $derived(Boolean(transaction && (isBuyer || isVendor) && transaction.status === 'awaiting_agreement'));

	// Evidence upload modal state
	let isEvidenceModalOpen = $state(false);
	let evidenceTitle = $state('Completed Thesis Print Inspection Photo');
	let evidenceFile = $state<File | undefined>();

	// Dispute modal state
	let isDisputeModalOpen = $state(false);
	let disputeReason = $state('Delay / Unapproved scope change');
	let disputeDetails = $state('');
	let isCancellationModalOpen = $state(false);
	let cancellationDetails = $state('');
	let reviewRating = $state(5);
	let reviewComment = $state('');

	async function handleAcceptAgreement() {
		if (!transaction || !$currentUser || !isBuyer) return;
		await runAction(async () => updateTransactionAgreement(transaction!.id, { status: 'agreed', details: 'Buyer accepted the agreed scope and price.' }), 'Agreement Signed', 'Agreement terms were recorded.');
	}

	async function handleStartWork() {
		if (!transaction || !$currentUser || !isVendor) return;
		await runAction(async () => updateTransactionAgreement(transaction!.id, { status: 'in_progress', details: 'Provider commenced work.' }), 'Work Commenced', 'Job status moved to In Progress.');
	}

	async function handleToggleMilestone(milestoneId: string) {
		if (!transaction || !isVendor) return;
		await runAction(async () => { await apiClient.patch(`/transactions/${encodeURIComponent(transaction!.id)}/milestones/${encodeURIComponent(milestoneId)}`, {}); await refresh(); }, 'Milestone Updated', 'Milestone progress was saved.');
	}

	async function runAction(action: () => Promise<unknown>, title: string, message: string): Promise<boolean> {
		if (busy) return false;
		busy = true;
		try { await action(); await refresh(); toast.show({ title, message, type: 'success' }); return true; }
		catch (error) { toast.show({ title: 'Action failed', message: error instanceof Error ? error.message : 'The backend could not save this action.', type: 'error' }); return false; }
		finally { busy = false; }
	}

	async function handleUploadEvidence(e: SubmitEvent) {
		e.preventDefault();
		if (!transaction || !$currentUser || !isVendor || !evidenceFile) return;
		if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(evidenceFile.type) || evidenceFile.size > 10 * 1024 * 1024) {
			toast.show({ title: 'Unsupported evidence file', message: 'Choose a JPG, PNG, WebP, or PDF file up to 10 MB.', type: 'error' });
			return;
		}
		const saved = await runAction(async () => {
			await uploadTransactionEvidence(transaction!.id, evidenceFile!, evidenceTitle);
			await updateTransactionAgreement(transaction!.id, { status: 'awaiting_confirmation', details: `Deliverable submitted: ${evidenceTitle}` });
		}, 'Evidence Submitted', 'Evidence was sent to the agreement record.');
		if (saved) { isEvidenceModalOpen = false; evidenceFile = undefined; }
	}

	async function handleConfirmCompletion() {
		if (!transaction || !$currentUser || !isBuyer) return;
		await runAction(() => updateTransactionAgreement(transaction!.id, { status: 'completed', details: 'Buyer confirmed completion.' }), 'Transaction Completed', 'Completion was recorded.');
	}

	async function handleSubmitReview(event: SubmitEvent) {
		event.preventDefault();
		if (!transaction || !isBuyer || transaction.status !== 'completed' || transaction.review_submitted) return;
		await runAction(async () => {
			await submitTransactionReview(transaction!.id, reviewRating, reviewComment.trim());
			await refresh();
		}, 'Review submitted', 'Your verified transaction review was recorded.');
	}

	async function handleRaiseDispute(e: SubmitEvent) {
		e.preventDefault();
		if (!transaction || !$currentUser) return;
		const saved = await runAction(async () => {
			await submitReport({ target_type: 'transaction', target_id: transaction!.id, reason: disputeReason, details: disputeDetails });
			await updateTransactionAgreement(transaction!.id, { status: 'disputed', details: `Issue reported: ${disputeReason}` });
		}, 'Issue Reported', 'Your report was sent for review.');
		if (saved) isDisputeModalOpen = false;
	}

	async function handleCancelAgreement(event: SubmitEvent) {
		event.preventDefault();
		if (!transaction || !canCancel || !cancellationDetails.trim()) return;
		const saved = await runAction(() => updateTransactionAgreement(transaction!.id, { status: 'cancelled', details: `Agreement cancelled: ${cancellationDetails.trim()}` }), 'Agreement cancelled', 'The cancellation was recorded.');
		if (saved) isCancellationModalOpen = false;
	}
</script>

<svelte:head>
	<title>{transaction ? `Agreement #${transaction.id}` : 'Transaction Workspace'} • AKOKA UNILAG</title>
</svelte:head>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
	{#if pageError}<div role="alert" class="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{pageError}</div>{/if}
	{#if !transaction}
		<div class="py-16 text-center space-y-4">
			<IconAlertCircle size={32} class="text-rose-500 mx-auto" />
			<h2 class="text-lg font-bold text-slate-800">Transaction Agreement Not Found</h2>
			<p class="text-xs text-slate-500">The requested transaction record does not exist.</p>
			<a href="/transactions" class="text-xs font-semibold text-akoka-600 hover:underline">
				← Back to Documented Agreements
			</a>
		</div>
	{:else}
		<!-- Breadcrumb & Status Stepper Card -->
		<div class="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-card space-y-6">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
				<div>
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
							#{transaction.id}
						</span>
						<span class="text-xs text-slate-400">Documented Agreement</span>
					</div>
					<h1 class="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-1">
						{transaction.item_title}
					</h1>
				</div>

				<div class="text-right">
					<div class="text-xs text-slate-400 font-medium">Agreed Contract Price</div>
					<div class="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
						₦{transaction.agreed_price.toLocaleString()}
					</div>
				</div>
			</div>

			<!-- Status Stepper Sequence (Section 8) -->
			<TransactionStatusStepper status={transaction.status} />

		<PaymentCheckout {transaction} />

			<!-- Interactive Step Transition Action Bar -->
			<div class="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
				<div class="text-xs text-slate-500">
					Signed in as: <strong class="text-slate-800">{$currentUser?.display_name ?? 'Unknown user'} ({$currentUser?.role ?? 'signed out'})</strong>
				</div>

				<div class="flex flex-wrap items-center gap-2">
					{#if transaction.status === 'awaiting_agreement' && isBuyer}
						<Button variant="primary" size="sm" onclick={handleAcceptAgreement}>
							<IconCheckmark size={14} />
							<span>Sign & Accept Terms</span>
						</Button>
					{/if}

					{#if transaction.status === 'agreed' && isVendor}
						<Button variant="primary" size="sm" onclick={handleStartWork}>
							<IconClock size={14} />
							<span>Commence Work Execution</span>
						</Button>
					{/if}

					{#if transaction.status === 'in_progress' && isVendor}
						<Button variant="outline" size="sm" onclick={() => (isEvidenceModalOpen = true)}>
							<IconReceipt size={14} />
							<span>Submit Deliverable Proof</span>
						</Button>
					{/if}

					{#if transaction.status === 'awaiting_confirmation' && isBuyer}
						<Button variant="success" size="sm" onclick={handleConfirmCompletion}>
							<IconCheckmark size={14} />
							<span>Confirm Completion</span>
						</Button>
					{/if}

					{#if (isBuyer || isVendor) && transaction.status !== 'completed' && transaction.status !== 'disputed'}
						<Button variant="ghost" size="sm" class="text-rose-600 hover:text-rose-700 hover:bg-rose-50" onclick={() => (isDisputeModalOpen = true)}>
							<IconFlag size={14} />
							<span>Flag Issue / Dispute</span>
						</Button>
					{/if}
					{#if canCancel}
						<Button variant="ghost" size="sm" class="text-slate-600 hover:text-rose-700" disabled={busy} onclick={() => isCancellationModalOpen = true}>Cancel agreement</Button>
					{/if}
				</div>
			</div>
		</div>

		{#if transaction.status === 'completed' && isBuyer}
			<section class="rounded-3xl border border-slate-200 bg-white p-6 space-y-4" aria-labelledby="review-heading">
				<h2 id="review-heading" class="text-lg font-bold">Your provider review</h2>
				{#if transaction.review_submitted}
					<p class="text-sm text-emerald-800">You have submitted a verified review for this completed agreement.</p>
				{:else}
					<form class="grid gap-3 max-w-2xl" onsubmit={handleSubmitReview}>
						<label class="text-sm font-medium">Rating
							<select bind:value={reviewRating} class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2" aria-label="Rating" required>
								<option value={5}>5 — Excellent</option><option value={4}>4 — Good</option><option value={3}>3 — Okay</option><option value={2}>2 — Poor</option><option value={1}>1 — Very poor</option>
							</select>
						</label>
						<label class="text-sm font-medium">Review
							<textarea bind:value={reviewComment} minlength="5" maxlength="1000" rows="3" required class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Share useful feedback about the completed service."></textarea>
						</label>
						<div><Button type="submit" variant="primary" size="sm" loading={busy} disabled={!apiClient.backendConfigured || busy}>Submit verified review</Button></div>
					</form>
				{/if}
			</section>
		{/if}

		<!-- Grid Layout: Agreement Details & Milestones vs Audit Trail -->
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left 2 Cols: Agreement Specifications & Milestones -->
			<div class="lg:col-span-2 space-y-6">
				<!-- Agreement Specifications Card -->
				<div class="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
					<div class="flex items-center justify-between pb-3 border-b border-slate-100">
						<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
							Agreed Contract Specifications
						</h3>
						<span class="text-xs text-slate-400">Section 8 Workflow</span>
					</div>

					<!-- Parties Row -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
						<div>
							<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Buyer (Student)</div>
							<div class="font-bold text-slate-900 mt-0.5">{transaction.buyer_name}</div>
							<div class="text-slate-500 font-mono text-[11px]">ID: {transaction.buyer_id}</div>
						</div>

						<div>
							<div class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Vendor (Provider)</div>
							<div class="font-bold text-slate-900 mt-0.5">{transaction.vendor_name}</div>
							<div class="text-slate-500 font-mono text-[11px]">ID: {transaction.vendor_id}</div>
						</div>
					</div>

					<!-- Scope of Work -->
					<div class="space-y-1.5 text-xs text-slate-700 leading-relaxed">
						<h4 class="font-bold text-slate-900 text-xs">Documented Scope & Inclusions</h4>
						<p class="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
							{transaction.scope}
						</p>
					</div>

					<!-- Deliverables List -->
					<div class="space-y-2 text-xs">
						<h4 class="font-bold text-slate-900 text-xs">Required Deliverables & Standards</h4>
						<ul class="space-y-1.5">
							{#each transaction.deliverables as deliv}
								<li class="flex items-start gap-2 text-slate-700">
									<IconCheckmark size={14} class="text-emerald-600 shrink-0 mt-0.5" />
									<span>{deliv}</span>
								</li>
							{/each}
						</ul>
					</div>

					<!-- Turnaround & Deadlines -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
						<div>
							<span class="text-slate-400 font-medium">Turnaround Baseline:</span>
							<div class="font-bold text-slate-800 mt-0.5">{transaction.turnaround_description}</div>
						</div>
						<div>
							<span class="text-slate-400 font-medium">Formal Due Date:</span>
							<div class="font-bold text-slate-800 mt-0.5">
								{new Date(transaction.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
							</div>
						</div>
					</div>

					<!-- Cancellation Policy -->
					<div class="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-0.5">
						<span class="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Cancellation Policy</span>
						<p>{transaction.cancellation_terms}</p>
					</div>
				</div>

				<!-- Milestones Checkpoints Card -->
				<div class="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
					<div class="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
								Milestone Checkpoints
							</h3>
				<p class="text-xs text-slate-500">Record progress against the agreed milestones.</p>
						</div>
						<span class="text-xs font-mono text-slate-400">
							{transaction.milestones.filter((m: TransactionMilestone) => m.completed).length}/{transaction.milestones.length} Done
						</span>
					</div>

					<div class="space-y-2.5">
						{#each transaction.milestones as milestone}
							<button
								type="button"
								onclick={() => handleToggleMilestone(milestone.id)}
								class="w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer {milestone.completed
								? 'bg-emerald-50/70 border-emerald-200 text-slate-900'
									: 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'}"
								disabled={!isVendor || busy}
							>
								<div
									class="w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors {milestone.completed
										? 'bg-emerald-600 border-emerald-600 text-white'
										: 'border-slate-300 bg-white'}"
								>
									{#if milestone.completed}
										<IconCheckmark size={13} />
									{/if}
								</div>

								<div class="flex-1 min-w-0 text-xs">
									<div class="flex items-center justify-between">
										<span class="font-bold {milestone.completed ? 'line-through text-slate-600' : 'text-slate-900'}">
											{milestone.title}
										</span>
										{#if milestone.completed_at}
											<span class="text-[10px] text-emerald-700 font-mono">
												Signed off {new Date(milestone.completed_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
											</span>
										{/if}
									</div>
									<p class="text-slate-500 text-[11px] mt-0.5">
										{milestone.description}
									</p>
								</div>
							</button>
						{/each}
					</div>
				</div>

				<!-- Evidence Attachments Gallery -->
				<div class="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-4">
					<div class="flex items-center justify-between pb-3 border-b border-slate-100">
						<div>
							<h3 class="text-sm font-bold uppercase tracking-wider text-slate-900">
								Deliverables Evidence Gallery ({transaction.evidence_attachments.length})
							</h3>
							<p class="text-xs text-slate-500">Inspection photos uploaded for buyer review</p>
						</div>

						{#if isVendor && (transaction.status === 'in_progress' || transaction.status === 'awaiting_confirmation')}
							<Button variant="outline" size="sm" onclick={() => (isEvidenceModalOpen = true)}>
								<IconPlus size={14} />
								<span>Add Photo Proof</span>
							</Button>
						{/if}
					</div>

					{#if transaction.evidence_attachments.length === 0}
						<div class="p-6 rounded-2xl bg-slate-50 text-center text-xs text-slate-400 italic">
							No completion evidence has been attached yet. Provider uploads photos before collection.
						</div>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							{#each transaction.evidence_attachments as ev}
								<div class="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 text-xs">
									<img src={ev.url} alt={ev.title} class="w-full h-40 object-cover" />
									<div class="p-3 space-y-1">
										<div class="font-bold text-slate-900">{ev.title}</div>
										<div class="text-[10px] text-slate-500 flex items-center justify-between">
											<span>By: {ev.uploader}</span>
											<span>{new Date(ev.uploaded_at).toLocaleDateString('en-GB')}</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Right Col: Event Audit Trail -->
			<div class="space-y-6">
				<div class="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-2xs">
					<EventAuditTimeline {events} />
				</div>
			</div>
		</div>
	{/if}
</div>

<!-- Modal: Submit Deliverable Evidence -->
<Modal
	isOpen={isEvidenceModalOpen}
	onclose={() => (isEvidenceModalOpen = false)}
	title="Submit Deliverable Evidence"
	subtitle="Upload photo proof of completed work for student verification"
	size="md"
>
	<form onsubmit={handleUploadEvidence} class="space-y-4">
		<div>
			<label for="ev-title" class="block text-xs font-semibold text-slate-700 mb-1">
				Evidence Description
			</label>
			<input
				id="ev-title"
				type="text"
				bind:value={evidenceTitle}
				placeholder="e.g. Completed Thesis Hardcover Gold Foil Photo"
				class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				required
			/>
		</div>

		<div>
			<label for="ev-file" class="block text-xs font-semibold text-slate-700 mb-1">
				Evidence file (JPG, PNG, WebP, or PDF; max 10 MB)
			</label>
			<input
				id="ev-file"
				type="file"
				accept="image/jpeg,image/png,image/webp,application/pdf"
				onchange={(event) => evidenceFile = event.currentTarget.files?.[0]}
				class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				required
			/>
			{#if evidenceFile}<p class="mt-2 text-xs text-slate-500">Selected: {evidenceFile.name}</p>{/if}
			{#if !apiClient.backendConfigured}<p class="mt-2 text-xs text-amber-800">Connect the AKOKA backend to securely upload evidence.</p>{/if}
		</div>

		<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
			<Button variant="outline" size="md" onclick={() => (isEvidenceModalOpen = false)}>Cancel</Button>
			<Button variant="primary" size="md" type="submit" loading={busy} disabled={!apiClient.backendConfigured}>Submit & Request Sign-off</Button>
		</div>
	</form>
</Modal>

<Modal isOpen={isCancellationModalOpen} onclose={() => isCancellationModalOpen = false} title="Cancel agreement" subtitle="Cancellation will be recorded in the agreement history." size="md">
	<form onsubmit={handleCancelAgreement} class="space-y-4">
		<p class="text-sm text-slate-600">You can cancel while the agreement is still awaiting acceptance. Once accepted, payment and cancellation outcomes must follow the backend’s transaction policy.</p>
		<label class="block text-sm font-medium">Reason
			<textarea bind:value={cancellationDetails} minlength="5" maxlength="500" rows="3" required class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Briefly explain why this agreement is being cancelled."></textarea>
		</label>
		<div class="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onclick={() => isCancellationModalOpen = false}>Keep agreement</Button><Button type="submit" variant="danger" size="sm" loading={busy} disabled={busy}>Confirm cancellation</Button></div>
	</form>
</Modal>

<!-- Modal: Flag Issue / Dispute -->
<Modal
	isOpen={isDisputeModalOpen}
	onclose={() => (isDisputeModalOpen = false)}
	title="Flag Transaction Issue / Dispute"
	subtitle="Submit issue to the Trust Desk for campus moderation"
	size="md"
>
	<form onsubmit={handleRaiseDispute} class="space-y-4">
		<div>
			<label for="dispute-reason" class="block text-xs font-semibold text-slate-700 mb-1">
				Primary Reason
			</label>
			<select
				id="dispute-reason"
				bind:value={disputeReason}
				class="w-full text-xs rounded-xl border border-slate-300 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
			>
				<option value="Unapproved scope or price hike">Unapproved scope or price hike</option>
				<option value="Deliverable quality defect">Deliverable quality defect</option>
				<option value="Missed completion deadline">Missed completion deadline</option>
				<option value="Failure to deliver agreed items">Failure to deliver agreed items</option>
			</select>
		</div>

		<div>
			<label for="dispute-details" class="block text-xs font-semibold text-slate-700 mb-1">
				Issue Description & Context
			</label>
			<textarea
				id="dispute-details"
				bind:value={disputeDetails}
				rows="3"
				placeholder="State specifically what diverged from the documented terms."
				class="w-full text-xs rounded-xl border border-slate-300 p-3 bg-white focus:outline-none focus:ring-2 focus:ring-akoka-500"
				required
			></textarea>
		</div>

		<div class="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
			<Button variant="outline" size="md" onclick={() => (isDisputeModalOpen = false)}>Cancel</Button>
			<Button variant="danger" size="md" type="submit">Submit Dispute to Trust Desk</Button>
		</div>
	</form>
</Modal>
