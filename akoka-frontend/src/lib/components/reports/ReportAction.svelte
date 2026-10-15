<script lang="ts">
	import { authStore } from '$lib/stores/authStore';
	import { toast } from '$lib/stores/notificationStore';
	import { submitReport } from '$lib/api/reports';
	import type { Report } from '$lib/types/models';
	import Button from '$lib/components/ui/Button.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { apiClient } from '$lib/api/client';

	let { targetType, targetId, label = 'Report' }: { targetType: Report['target_type']; targetId: string; label?: string } = $props();
	const user = authStore;
	let open = $state(false);
	let reason = $state('Incorrect or misleading information');
	let details = $state('');
	let submitting = $state(false);

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!$user) {
			toast.show({ title: 'Sign in required', message: 'Sign in before submitting a report.', type: 'error' });
			return;
		}
		if (!details.trim() || submitting) return;
		submitting = true;
		try {
			await submitReport({ target_type: targetType, target_id: targetId, reason, details: details.trim() });
			toast.show({ title: 'Report submitted', message: 'The Trust Desk will review your report.', type: 'success' });
			open = false;
			details = '';
		} catch (error) {
			toast.show({ title: 'Report could not be submitted', message: error instanceof Error ? error.message : 'Please try again.', type: 'error' });
		} finally { submitting = false; }
	}
</script>

<Button type="button" variant="ghost" size="sm" class="text-slate-500 hover:text-rose-700" disabled={!apiClient.backendConfigured} onclick={() => open = true}>{label}</Button>
<Modal isOpen={open} onclose={() => open = false} title="Report content" subtitle="Reports are reviewed by the campus Trust Desk." size="md">
	<form onsubmit={submit} class="space-y-4">
		<label class="block text-sm font-medium">Reason
			<select bind:value={reason} class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2 bg-white" required>
				<option>Incorrect or misleading information</option><option>Outdated price or offer</option><option>Impersonation or suspicious activity</option><option>Harassment or abusive content</option><option>Other</option>
			</select>
		</label>
		<label class="block text-sm font-medium">Details
			<textarea bind:value={details} minlength="5" maxlength="1000" rows="4" required class="mt-1 block w-full rounded-xl border border-slate-300 px-3 py-2" placeholder="Tell the moderators what should be reviewed."></textarea>
		</label>
		<div class="flex justify-end gap-2"><Button type="button" variant="outline" size="sm" onclick={() => open = false}>Cancel</Button><Button type="submit" variant="primary" size="sm" loading={submitting} disabled={!apiClient.backendConfigured || submitting}>Submit report</Button></div>
	</form>
</Modal>
