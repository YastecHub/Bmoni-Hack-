import { Router, Response } from 'express';
import { Transaction, VendorProfile, Review, TransactionEvent } from '../db/models/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { uploadEvidence } from '../middleware/upload.js';
import {
	parseTransaction,
	logTransactionEvent,
	validateStateTransition
} from '../services/transactionEngine.js';
import type { Transaction as TransactionType, TransactionMilestone, Review as ReviewType } from '../types/index.js';

export const transactionsRouter = Router();

// GET /transactions
transactionsRouter.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const user = req.user!;
		const filter: any = {};

		if (user.role === 'student') {
			filter.buyer_id = user.id;
		} else if (user.role === 'vendor') {
			const myVendors = await VendorProfile.find({ user_id: user.id });
			const vendorIds = myVendors.map((v) => v._id);
			filter.vendor_id = { $in: vendorIds };
		}
		// Admin sees all

		const docs = await Transaction.find(filter).sort({ created_at: -1 });
		const transactions = await Promise.all(docs.map((doc) => parseTransaction(doc, user.id)));

		res.json(transactions);
	} catch (error) {
		console.error('Error fetching transactions:', error);
		res.status(500).json({ error: 'Could not fetch transactions.' });
	}
});

// POST /transactions (Create transaction draft / agreement request)
transactionsRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const user = req.user!;
		if (user.role !== 'student') {
			res.status(403).json({ error: 'Only student buyers can initiate a transaction agreement.' });
			return;
		}

		const {
			vendor_id,
			listing_id,
			item_title,
			category_id,
			agreed_price,
			scope,
			deliverables = [],
			turnaround_description,
			due_at,
			cancellation_terms
		} = req.body;

		if (!vendor_id || !item_title || !agreed_price || !scope) {
			res.status(400).json({ error: 'Vendor, item title, agreed price, and scope are required.' });
			return;
		}

		const vendor = await VendorProfile.findById(vendor_id);
		if (!vendor) {
			res.status(404).json({ error: 'Selected vendor does not exist.' });
			return;
		}

		const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const deliverablesList: string[] = Array.isArray(deliverables) ? deliverables : [deliverables];
		const milestones: TransactionMilestone[] = [
			{
				id: `m_${Date.now()}_1`,
				title: 'Scope & Requirement Confirmation',
				description: 'Both parties confirm deliverables, dimensions, and specifications.',
				completed: true,
				completed_at: now
			},
			{
				id: `m_${Date.now()}_2`,
				title: 'Work Commencement & Deliverable Production',
				description: 'Provider begins job execution and prepares inspection proof.',
				completed: false
			},
			{
				id: `m_${Date.now()}_3`,
				title: 'Final Handover & Verification',
				description: 'Student inspects completed work on campus and signs off.',
				completed: false
			}
		];

		const created = await Transaction.create({
			_id: id,
			buyer_id: user.id,
			buyer_name: user.display_name,
			vendor_id: vendor._id,
			vendor_name: vendor.business_name,
			listing_id: listing_id || null,
			item_title: item_title.trim(),
			category_id,
			agreed_price: Number(agreed_price),
			scope: scope.trim(),
			deliverables: deliverablesList,
			turnaround_description: turnaround_description?.trim() || 'Standard turnaround',
			due_at: due_at || new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
			milestones,
			status: 'awaiting_agreement',
			payment: {
				status: 'not_started',
				amount: Number(agreed_price),
				currency: 'NGN'
			},
			evidence_attachments: [],
			cancellation_terms: cancellation_terms?.trim() || 'Either party may cancel while awaiting agreement.',
			created_at: now,
			updated_at: now
		});

		await logTransactionEvent(
			id,
			user,
			'created',
			`Agreement drafted for ${item_title} (₦${Number(agreed_price).toLocaleString()}).`
		);

		const result = await parseTransaction(created, user.id);
		res.status(201).json(result);
	} catch (error) {
		console.error('Error creating transaction:', error);
		res.status(500).json({ error: 'Could not create transaction draft.' });
	}
});

// GET /transactions/:id
transactionsRouter.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const doc = await Transaction.findById(req.params.id);
		if (!doc) {
			res.status(404).json({ error: 'Agreement record not found.' });
			return;
		}

		const tx = await parseTransaction(doc, req.user!.id);
		const user = req.user!;

		const isBuyer = user.id === tx.buyer_id;
		const isVendor = user.role === 'vendor' && user.id === tx.vendor?.user_id;
		const isAdmin = user.role === 'admin';

		if (!isBuyer && !isVendor && !isAdmin) {
			res.status(403).json({ error: 'You are not authorized to view this transaction agreement.' });
			return;
		}

		res.json(tx);
	} catch (error) {
		console.error('Error fetching transaction:', error);
		res.status(500).json({ error: 'Could not fetch transaction record.' });
	}
});

// PATCH /transactions/:id/agreement
transactionsRouter.patch('/:id/agreement', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const doc = await Transaction.findById(req.params.id);
		if (!doc) {
			res.status(404).json({ error: 'Transaction agreement not found.' });
			return;
		}

		const tx = await parseTransaction(doc, req.user!.id);
		const { status, details } = req.body;

		if (!status) {
			res.status(400).json({ error: 'Target status is required.' });
			return;
		}

		const check = validateStateTransition(tx.status, status, req.user!, tx);
		if (!check.allowed) {
			res.status(400).json({ error: check.reason || 'Invalid state transition.' });
			return;
		}

		const now = new Date().toISOString();

		await Transaction.findByIdAndUpdate(req.params.id, {
			status,
			updated_at: now
		});

		// If completed, update vendor stats
		if (status === 'completed') {
			await VendorProfile.findByIdAndUpdate(tx.vendor_id, {
				$inc: { completed_transactions_count: 1 }
			});
		}

		let eventType: any = 'agreement_accepted';
		if (status === 'in_progress') eventType = 'work_started';
		else if (status === 'awaiting_confirmation') eventType = 'deliverable_submitted';
		else if (status === 'completed') eventType = 'completion_confirmed';
		else if (status === 'cancelled') eventType = 'cancelled';
		else if (status === 'disputed') eventType = 'issue_flagged';

		await logTransactionEvent(
			String(req.params.id),
			req.user!,
			eventType,
			details || `Transaction moved to ${status.replace('_', ' ')}.`
		);

		res.json({ success: true, message: 'Agreement terms updated.' });
	} catch (error) {
		console.error('Error updating agreement:', error);
		res.status(500).json({ error: 'Could not update transaction status.' });
	}
});

// GET /transactions/:id/events
transactionsRouter.get('/:id/events', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const events = await TransactionEvent.find({ transaction_id: req.params.id }).sort({ created_at: 1 });
		res.json(events.map((e) => e.toJSON()));
	} catch (error) {
		console.error('Error fetching transaction events:', error);
		res.status(500).json({ error: 'Could not fetch transaction audit events.' });
	}
});

// POST /transactions/:id/events
transactionsRouter.post('/:id/events', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const { event_type, details } = req.body;
		if (!event_type || !details) {
			res.status(400).json({ error: 'event_type and details are required.' });
			return;
		}

		await logTransactionEvent(String(req.params.id), req.user!, event_type, details);
		res.status(201).json({ success: true });
	} catch (error) {
		console.error('Error logging transaction event:', error);
		res.status(500).json({ error: 'Could not record event.' });
	}
});

// PATCH /transactions/:id/milestones/:milestoneId
transactionsRouter.patch('/:id/milestones/:milestoneId', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const doc = await Transaction.findById(req.params.id);
		if (!doc) {
			res.status(404).json({ error: 'Transaction not found.' });
			return;
		}

		const tx = await parseTransaction(doc, req.user!.id);
		const user = req.user!;
		const isVendor = user.role === 'vendor' && user.id === tx.vendor?.user_id;

		if (!isVendor && user.role !== 'admin') {
			res.status(403).json({ error: 'Only the vendor can update milestone progress.' });
			return;
		}

		const milestones: TransactionMilestone[] = doc.milestones || [];
		const targetMilestone = milestones.find((m) => m.id === req.params.milestoneId);

		if (!targetMilestone) {
			res.status(404).json({ error: 'Milestone not found.' });
			return;
		}

		targetMilestone.completed = !targetMilestone.completed;
		targetMilestone.completed_at = targetMilestone.completed ? new Date().toISOString() : undefined;

		const now = new Date().toISOString();

		await Transaction.findByIdAndUpdate(req.params.id, {
			milestones,
			updated_at: now
		});

		await logTransactionEvent(
			String(req.params.id),
			user,
			'milestone_completed',
			`Milestone '${targetMilestone.title}' marked as ${targetMilestone.completed ? 'completed' : 'pending'}.`
		);

		res.json({ success: true, milestones });
	} catch (error) {
		console.error('Error updating milestone:', error);
		res.status(500).json({ error: 'Could not update milestone.' });
	}
});

// POST /transactions/:id/evidence
transactionsRouter.post(
	'/:id/evidence',
	requireAuth,
	uploadEvidence.single('file'),
	async (req: AuthRequest, res: Response) => {
		try {
			if (!req.file) {
				res.status(400).json({ error: 'Please select an evidence file to upload.' });
				return;
			}

			const doc = await Transaction.findById(req.params.id);
			if (!doc) {
				res.status(404).json({ error: 'Transaction not found.' });
				return;
			}

			const title = req.body.title?.trim() || req.file.originalname;
			const fileUrl = `/uploads/${req.file.filename}`;
			const evidenceId = `ev_${Date.now()}`;
			const now = new Date().toISOString();

			const newEvidence = {
				id: evidenceId,
				title,
				url: fileUrl,
				uploader: req.user!.display_name,
				uploaded_at: now
			};

			await Transaction.findByIdAndUpdate(req.params.id, {
				$push: { evidence_attachments: newEvidence },
				updated_at: now
			});

			await logTransactionEvent(
				String(req.params.id),
				req.user!,
				'deliverable_submitted',
				`Evidence deliverable uploaded: "${title}".`
			);

			res.status(201).json(newEvidence);
		} catch (error) {
			console.error('Error uploading evidence:', error);
			res.status(500).json({ error: 'Failed to upload evidence attachment.' });
		}
	}
);

// POST /transactions/:id/review
transactionsRouter.post('/:id/review', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const user = req.user!;
		if (user.role !== 'student') {
			res.status(403).json({ error: 'Only student buyers can submit transaction reviews.' });
			return;
		}

		const doc = await Transaction.findById(req.params.id);
		if (!doc) {
			res.status(404).json({ error: 'Transaction not found.' });
			return;
		}

		const tx = await parseTransaction(doc, user.id);
		if (tx.buyer_id !== user.id) {
			res.status(403).json({ error: 'You are not the buyer of this transaction.' });
			return;
		}

		if (tx.status !== 'completed') {
			res.status(400).json({ error: 'Reviews can only be submitted for completed transactions.' });
			return;
		}

		const existing = await Review.findOne({ transaction_id: tx.id });
		if (existing) {
			res.status(409).json({ error: 'A review has already been submitted for this transaction.' });
			return;
		}

		const { rating, comment } = req.body;
		const ratingNum = Math.min(5, Math.max(1, Number(rating) || 5));
		const commentText = comment?.trim() || '';

		const reviewId = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const created = await Review.create({
			_id: reviewId,
			transaction_id: tx.id,
			reviewer_id: user.id,
			reviewer_name: user.display_name,
			vendor_id: tx.vendor_id,
			rating: ratingNum,
			comment: commentText,
			verified_purchase: true,
			created_at: now
		});

		// Recalculate vendor average rating and review count
		const reviews = await Review.find({ vendor_id: tx.vendor_id });
		const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

		await VendorProfile.findByIdAndUpdate(tx.vendor_id, {
			review_count: reviews.length,
			rating: Math.round(avgRating * 10) / 10
		});

		res.status(201).json(created.toJSON());
	} catch (error) {
		console.error('Error submitting review:', error);
		res.status(500).json({ error: 'Could not submit review.' });
	}
});
