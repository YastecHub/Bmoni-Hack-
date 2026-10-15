import { apiClient } from './client';
import type { Transaction, TransactionEvent } from '../types/models';

export async function fetchTransactions(): Promise<Transaction[]> {
	return apiClient.get<Transaction[]>('/transactions');
}

export async function fetchTransactionById(id: string): Promise<Transaction | undefined> {
	return apiClient.get<Transaction>(`/transactions/${encodeURIComponent(id)}`);
}

export async function fetchTransactionEvents(id: string): Promise<TransactionEvent[]> {
	return apiClient.get<TransactionEvent[]>(`/transactions/${encodeURIComponent(id)}/events`);
}

export async function createTransactionDraft(data: {
	vendor_id: string;
	listing_id?: string;
	item_title: string;
	category_id: string;
	agreed_price: number;
	scope: string;
	deliverables: string[];
	turnaround_description: string;
	due_at: string;
	cancellation_terms: string;
}): Promise<Transaction> {
	return apiClient.post<Transaction>('/transactions', data);
}

export async function updateTransactionAgreement(
	id: string,
	data: {
		status: Transaction['status'];
		details: string;
	}
): Promise<void> {
	await apiClient.patch(`/transactions/${encodeURIComponent(id)}/agreement`, data);
}

export async function uploadTransactionEvidence(id: string, file: File, title: string): Promise<void> {
	const form = new FormData();
	form.append('file', file);
	form.append('title', title);
	await apiClient.postForm(`/transactions/${encodeURIComponent(id)}/evidence`, form);
}

export async function recordTransactionEvent(
	id: string,
	eventData: {
		event_type: TransactionEvent['event_type'];
		details: string;
	}
): Promise<void> {
	await apiClient.post(`/transactions/${encodeURIComponent(id)}/events`, eventData);
}
