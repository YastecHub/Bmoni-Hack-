import { apiClient } from './client';

export type PaymentStatus = 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface PaymentIntent {
	id: string;
	transaction_id: string;
	status: PaymentStatus;
	amount: number;
	currency: string;
	checkout_url?: string;
}

/** The backend must create the provider session; never place private fintech keys in the browser. */
export function startTransactionPayment(transactionId: string, returnUrl: string): Promise<PaymentIntent> {
	return apiClient.post<PaymentIntent>('/payments/checkout', { transaction_id: transactionId, return_url: returnUrl });
}

export function fetchPaymentStatus(paymentId: string): Promise<PaymentIntent> {
	return apiClient.get<PaymentIntent>(`/payments/${encodeURIComponent(paymentId)}`);
}
