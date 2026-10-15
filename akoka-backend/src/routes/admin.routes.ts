import { Router, Response } from 'express';
import { PriceObservation, Report, Transaction } from '../db/models/index.js';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';
import { parseTransaction } from '../services/transactionEngine.js';
import type { PriceObservation as PriceObservationType, Report as ReportType } from '../types/index.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

// GET /admin/moderation-queue
adminRouter.get('/moderation-queue', async (_req: AuthRequest, res: Response) => {
	try {
		const obsDocs = await PriceObservation.find({ verification_status: 'pending' }).sort({ observed_at: -1 });
		const pendingObservations: PriceObservationType[] = obsDocs.map((r) => r.toJSON());

		const reportDocs = await Report.find({ status: 'pending' }).sort({ created_at: -1 });
		const reports: ReportType[] = reportDocs.map((r) => r.toJSON());

		const txDocs = await Transaction.find({ status: 'disputed' }).sort({ updated_at: -1 });
		const pendingTransactions = await Promise.all(txDocs.map((t) => parseTransaction(t)));

		const verifiedObservationCount = await PriceObservation.countDocuments({ verification_status: 'verified' });

		res.json({
			pendingObservations,
			reports,
			pendingTransactions,
			verifiedObservationCount
		});
	} catch (error) {
		console.error('Error fetching moderation queue:', error);
		res.status(500).json({ error: 'Could not fetch moderation queue data.' });
	}
});

// PATCH /admin/moderation-queue/observation/:id
adminRouter.patch('/moderation-queue/observation/:id', async (req: AuthRequest, res: Response) => {
	try {
		const { status } = req.body;
		if (!['verified', 'rejected', 'flagged'].includes(status)) {
			res.status(400).json({ error: "status must be 'verified', 'rejected', or 'flagged'." });
			return;
		}

		const obs = await PriceObservation.findById(req.params.id);
		if (!obs) {
			res.status(404).json({ error: 'Price observation not found.' });
			return;
		}

		const now = new Date().toISOString();
		await PriceObservation.findByIdAndUpdate(req.params.id, {
			verification_status: status,
			last_confirmed_at: now
		});

		res.json({ success: true, message: `Observation status updated to ${status}.` });
	} catch (error) {
		console.error('Error moderating observation:', error);
		res.status(500).json({ error: 'Could not update observation status.' });
	}
});

// PATCH /admin/moderation-queue/report/:id
async function handleReportResolution(req: AuthRequest, res: Response) {
	try {
		const { action } = req.body;
		if (!['resolved', 'dismissed'].includes(action)) {
			res.status(400).json({ error: "action must be 'resolved' or 'dismissed'." });
			return;
		}

		const report = await Report.findById(req.params.id);
		if (!report) {
			res.status(404).json({ error: 'Report not found.' });
			return;
		}

		await Report.findByIdAndUpdate(req.params.id, { status: action });
		res.json({ success: true, message: `Report marked as ${action}.` });
	} catch (error) {
		console.error('Error resolving report:', error);
		res.status(500).json({ error: 'Could not resolve report.' });
	}
}

adminRouter.patch('/admin/moderation-queue/report/:id', handleReportResolution);
adminRouter.patch('/moderation-queue/report/:id', handleReportResolution);
