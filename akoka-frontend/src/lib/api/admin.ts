import { apiClient } from './client';
import type { PriceObservation, Report } from '../types/models';

export interface ModerationQueueResponse {
	pendingObservations: PriceObservation[];
	reports: Report[];
	pendingTransactions: import('../types/models').Transaction[];
	verifiedObservationCount?: number;
}

export async function fetchModerationQueue(): Promise<ModerationQueueResponse> {
	return apiClient.get<ModerationQueueResponse>('/admin/moderation-queue');
}

export async function moderateObservation(
	id: string,
	status: 'verified' | 'rejected' | 'flagged'
): Promise<void> {
	await apiClient.patch(`/admin/moderation-queue/observation/${id}`, { status });
}

export async function resolveReport(id: string, action: 'resolved' | 'dismissed'): Promise<void> {
	await apiClient.patch(`/admin/moderation-queue/report/${id}`, { action });
}
