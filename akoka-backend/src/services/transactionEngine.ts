import { VendorProfile, Review, TransactionEvent } from '../db/models/index.js';
import type { Transaction, TransactionEvent as TransactionEventType, TransactionStatus, User } from '../types/index.js';

export async function parseTransaction(doc: any, currentUserId?: string): Promise<Transaction> {
	const raw = doc.toJSON ? doc.toJSON() : doc;
	const vendorDoc = await VendorProfile.findById(raw.vendor_id);

	let vendor = undefined;
	if (vendorDoc) {
		vendor = vendorDoc.toJSON();
	}

	let reviewSubmitted = false;
	if (currentUserId) {
		const existingReview = await Review.findOne({
			transaction_id: raw.id || raw._id,
			reviewer_id: currentUserId
		});
		reviewSubmitted = Boolean(existingReview);
	}

	return {
		id: raw.id || raw._id,
		buyer_id: raw.buyer_id,
		buyer_name: raw.buyer_name,
		vendor_id: raw.vendor_id,
		vendor_name: raw.vendor_name,
		listing_id: raw.listing_id || undefined,
		item_title: raw.item_title,
		category_id: raw.category_id,
		agreed_price: Number(raw.agreed_price),
		scope: raw.scope,
		deliverables: raw.deliverables || [],
		turnaround_description: raw.turnaround_description || '',
		due_at: raw.due_at,
		milestones: raw.milestones || [],
		status: raw.status,
		payment: raw.payment || undefined,
		evidence_attachments: raw.evidence_attachments || [],
		cancellation_terms: raw.cancellation_terms || 'Standard cancellation terms.',
		created_at: raw.created_at,
		updated_at: raw.updated_at,
		vendor,
		review_submitted: reviewSubmitted
	};
}

export async function logTransactionEvent(
	transactionId: string,
	user: User,
	eventType: TransactionEventType['event_type'],
	details: string
): Promise<void> {
	const id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
	const now = new Date().toISOString();

	await TransactionEvent.create({
		_id: id,
		transaction_id: transactionId,
		actor_id: user.id,
		actor_name: user.display_name,
		actor_role: user.role,
		event_type: eventType,
		details,
		created_at: now
	});
}

export function validateStateTransition(
	currentStatus: TransactionStatus,
	targetStatus: TransactionStatus,
	user: User,
	transaction: Transaction
): { allowed: boolean; reason?: string } {
	const isBuyer = user.id === transaction.buyer_id;
	const isVendor = user.role === 'vendor' && user.id === transaction.vendor?.user_id;
	const isAdmin = user.role === 'admin';

	if (isAdmin) {
		return { allowed: true };
	}

	// Cancellation rule: either party can cancel while awaiting_agreement
	if (targetStatus === 'cancelled') {
		if (currentStatus === 'awaiting_agreement' && (isBuyer || isVendor)) {
			return { allowed: true };
		}
		return {
			allowed: false,
			reason: 'Cancellation is only permitted while the agreement is awaiting acceptance.'
		};
	}

	// Dispute rule: either party can raise dispute during active agreement
	if (targetStatus === 'disputed') {
		if (['agreed', 'in_progress', 'awaiting_confirmation'].includes(currentStatus) && (isBuyer || isVendor)) {
			return { allowed: true };
		}
		return {
			allowed: false,
			reason: 'Disputes can only be raised on agreed or in-progress transactions.'
		};
	}

	// Normal progressive flow
	switch (currentStatus) {
		case 'draft':
		case 'awaiting_agreement':
			if (targetStatus === 'agreed') {
				if (!isBuyer && !isVendor) {
					return { allowed: false, reason: 'Only the buyer or vendor may accept agreement terms.' };
				}
				return { allowed: true };
			}
			break;

		case 'agreed':
			if (targetStatus === 'in_progress') {
				if (!isVendor) {
					return { allowed: false, reason: 'Only the vendor can commence work to move status to in progress.' };
				}
				return { allowed: true };
			}
			break;

		case 'in_progress':
			if (targetStatus === 'awaiting_confirmation') {
				if (!isVendor) {
					return { allowed: false, reason: 'Only the vendor can submit deliverables for sign-off.' };
				}
				return { allowed: true };
			}
			break;

		case 'awaiting_confirmation':
			if (targetStatus === 'completed') {
				if (!isBuyer) {
					return { allowed: false, reason: 'Only the student buyer can confirm final completion.' };
				}
				return { allowed: true };
			}
			break;

		default:
			break;
	}

	return {
		allowed: false,
		reason: `Transition from '${currentStatus}' to '${targetStatus}' is not permitted.`
	};
}
