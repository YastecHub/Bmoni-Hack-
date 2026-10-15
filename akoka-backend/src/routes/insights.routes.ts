import { Router, Response } from 'express';
import { PriceObservation } from '../db/models/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { calculatePriceInsight } from '../services/priceEngine.js';
import type { PriceObservation as PriceObservationType } from '../types/index.js';

export const insightsRouter = Router();

// GET /price-insights?category=&itemSpec=
insightsRouter.get('/price-insights', async (req: AuthRequest, res: Response) => {
	try {
		const category = req.query.category as string;
		const itemSpec = req.query.itemSpec as string | undefined;

		if (!category) {
			res.status(400).json({ error: 'category query parameter is required.' });
			return;
		}

		const insight = await calculatePriceInsight(category, itemSpec);
		res.json(insight);
	} catch (error) {
		console.error('Error calculating price insights:', error);
		res.status(500).json({ error: error instanceof Error ? error.message : 'Could not calculate price insights.' });
	}
});

// GET /price-observations?category=
insightsRouter.get('/price-observations', async (req: AuthRequest, res: Response) => {
	try {
		const category = req.query.category as string | undefined;

		const filter: any = {};
		if (category) {
			filter.category_id = category;
		}

		const docs = await PriceObservation.find(filter).sort({ observed_at: -1 });
		const observations: PriceObservationType[] = docs.map((d) => d.toJSON());

		res.json(observations);
	} catch (error) {
		console.error('Error fetching observations:', error);
		res.status(500).json({ error: 'Could not fetch price observations.' });
	}
});

// POST /price-observations
insightsRouter.post('/price-observations', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const {
			category_id,
			item_specification,
			amount,
			unit,
			area,
			campus_zone,
			source_type,
			vendor_id,
			vendor_name,
			notes
		} = req.body;

		if (!category_id || !item_specification || !amount || !unit || !campus_zone) {
			res.status(400).json({
				error: 'category_id, item_specification, amount, unit, and campus_zone are required.'
			});
			return;
		}

		if (Number(amount) <= 0) {
			res.status(400).json({ error: 'Amount must be a positive number.' });
			return;
		}

		let determinedSource = source_type || 'student_submitted';
		if (req.user!.role === 'student') {
			if (determinedSource !== 'receipt_supported' && determinedSource !== 'student_submitted') {
				determinedSource = 'student_submitted';
			}
		} else if (req.user!.role === 'vendor') {
			determinedSource = 'vendor_confirmed';
		}

		const id = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const created = await PriceObservation.create({
			_id: id,
			reporter_id: req.user!.id,
			category_id,
			item_specification: item_specification.trim(),
			amount: Number(amount),
			unit: unit.trim(),
			area: area?.trim() || campus_zone,
			campus_zone,
			source_type: determinedSource,
			observed_at: now,
			last_confirmed_at: now,
			verification_status: 'pending',
			vendor_id: vendor_id || null,
			vendor_name: vendor_name || null,
			notes: notes?.trim() || null
		});

		res.status(201).json(created.toJSON());
	} catch (error) {
		console.error('Error submitting price observation:', error);
		res.status(500).json({ error: 'Could not submit price observation.' });
	}
});
