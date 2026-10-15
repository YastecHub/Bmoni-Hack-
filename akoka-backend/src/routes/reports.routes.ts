import { Router, Response } from 'express';
import { Report } from '../db/models/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import type { Report as ReportType } from '../types/index.js';

export const reportsRouter = Router();

// POST /reports
reportsRouter.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const { target_type, target_id, reason, details } = req.body;

		if (!target_type || !target_id || !reason) {
			res.status(400).json({ error: 'target_type, target_id, and reason are required.' });
			return;
		}

		const validTypes = ['listing', 'price_observation', 'transaction', 'vendor', 'review'];
		if (!validTypes.includes(target_type)) {
			res.status(400).json({ error: `target_type must be one of: ${validTypes.join(', ')}` });
			return;
		}

		const id = `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const created = await Report.create({
			_id: id,
			reporter_id: req.user!.id,
			reporter_name: req.user!.display_name,
			target_type,
			target_id,
			reason: reason.trim(),
			details: details?.trim() || '',
			status: 'pending',
			created_at: now
		});

		res.status(201).json(created.toJSON());
	} catch (error) {
		console.error('Error submitting report:', error);
		res.status(500).json({ error: 'Could not submit report.' });
	}
});
