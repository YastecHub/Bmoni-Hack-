import { Payment, Transaction } from '../db/models/index.js';
import { config } from '../config.js';
import type { PaymentIntent, Transaction as TransactionType } from '../types/index.js';

export async function createCheckoutSession(
	transaction: TransactionType,
	returnUrl: string
): Promise<PaymentIntent> {
	const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
	const now = new Date().toISOString();

	const simulatedCheckoutUrl = `http://localhost:${config.port}/api/payments/simulate-checkout?payment_id=${encodeURIComponent(
		paymentId
	)}&return_url=${encodeURIComponent(returnUrl)}&amount=${transaction.agreed_price}`;

	await Payment.create({
		_id: paymentId,
		transaction_id: transaction.id,
		status: 'processing',
		amount: transaction.agreed_price,
		currency: 'NGN',
		checkout_url: simulatedCheckoutUrl,
		provider_reference: `SIM_BMONI_${paymentId}`,
		created_at: now,
		updated_at: now
	});

	// Update transaction payment state to processing
	const currentPayment = {
		status: 'processing',
		amount: transaction.agreed_price,
		currency: 'NGN',
		provider_reference: `SIM_BMONI_${paymentId}`
	};

	await Transaction.findByIdAndUpdate(transaction.id, {
		payment: currentPayment,
		updated_at: now
	});

	return {
		id: paymentId,
		transaction_id: transaction.id,
		status: 'processing',
		amount: transaction.agreed_price,
		currency: 'NGN',
		checkout_url: simulatedCheckoutUrl
	};
}

export async function confirmPayment(paymentId: string): Promise<PaymentIntent> {
	const payment = await Payment.findById(paymentId);
	if (!payment) {
		throw new Error('Payment record not found.');
	}

	const now = new Date().toISOString();

	payment.status = 'succeeded';
	payment.updated_at = now;
	await payment.save();

	// Update corresponding transaction payment status
	const paymentData = {
		status: 'succeeded',
		amount: payment.amount,
		currency: payment.currency,
		provider_reference: payment.provider_reference || `SIM_BMONI_${paymentId}`
	};

	await Transaction.findByIdAndUpdate(payment.transaction_id, {
		payment: paymentData,
		updated_at: now
	});

	return {
		id: payment.id,
		transaction_id: payment.transaction_id,
		status: 'succeeded',
		amount: payment.amount,
		currency: payment.currency
	};
}
