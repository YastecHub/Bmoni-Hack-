import { Router, Request, Response } from 'express';
import { Category } from '../db/models/index.js';

export const categoriesRouter = Router();

// GET /categories
categoriesRouter.get('/', async (_req: Request, res: Response) => {
	try {
		const categories = await Category.find().sort({ name: 1 });
		res.json(categories.map((c) => c.toJSON()));
	} catch (error) {
		console.error('Error fetching categories:', error);
		res.status(500).json({ error: 'Could not fetch campus categories.' });
	}
});
