import { Router, Response } from 'express';
import { Listing, VendorProfile } from '../db/models/index.js';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth.js';
import type { Listing as ListingType } from '../types/index.js';

export const listingsRouter = Router();

async function populateListing(doc: any): Promise<ListingType> {
	const json = doc.toJSON ? doc.toJSON() : doc;
	const vendorDoc = await VendorProfile.findById(json.vendor_id);
	return {
		...json,
		price: Number(json.price),
		vendor: vendorDoc ? vendorDoc.toJSON() : undefined
	};
}

// GET /listings?category=&area=&maxPrice=&search=
listingsRouter.get('/', async (req: AuthRequest, res: Response) => {
	try {
		const { category, area, maxPrice, search } = req.query;

		const filter: any = {};

		if (category && category !== 'all') {
			filter.category_id = category;
		}

		if (maxPrice) {
			filter.price = { $lte: Number(maxPrice) };
		}

		if (search && typeof search === 'string' && search.trim()) {
			const term = search.trim();
			filter.$or = [
				{ title: { $regex: term, $options: 'i' } },
				{ description: { $regex: term, $options: 'i' } }
			];
		}

		const listingDocs = await Listing.find(filter).sort({ updated_at: -1 });
		let listings = await Promise.all(listingDocs.map(populateListing));

		// Area filter (based on vendor's campus zone)
		if (area && area !== 'all') {
			listings = listings.filter((l) => l.vendor?.campus_zone === area);
		}

		res.json(listings);
	} catch (error) {
		console.error('Error fetching listings:', error);
		res.status(500).json({ error: 'Could not fetch listings.' });
	}
});

// GET /listings/:id
listingsRouter.get('/:id', async (req: AuthRequest, res: Response) => {
	try {
		const listingDoc = await Listing.findById(req.params.id);
		if (!listingDoc) {
			res.status(404).json({ error: 'Listing not found.' });
			return;
		}

		const listing = await populateListing(listingDoc);
		res.json(listing);
	} catch (error) {
		console.error('Error fetching listing:', error);
		res.status(500).json({ error: 'Could not fetch listing details.' });
	}
});

// POST /listings
listingsRouter.post('/', requireAuth, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
	try {
		const vendor = await VendorProfile.findOne({ user_id: req.user!.id });
		if (!vendor) {
			res.status(400).json({ error: 'No vendor profile linked to this account.' });
			return;
		}

		const {
			category_id,
			title,
			description,
			price,
			unit,
			turnaround_time,
			inclusions = [],
			exclusions = [],
			availability = 'available'
		} = req.body;

		if (!category_id || !title || !price || !unit) {
			res.status(400).json({ error: 'Category, title, price, and unit are required.' });
			return;
		}

		const id = `lst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();

		const created = await Listing.create({
			_id: id,
			vendor_id: vendor._id,
			category_id,
			title: title.trim(),
			description: description?.trim() || '',
			price: Number(price),
			unit: unit.trim(),
			turnaround_time: turnaround_time?.trim() || 'Flexible',
			inclusions: Array.isArray(inclusions) ? inclusions : [],
			exclusions: Array.isArray(exclusions) ? exclusions : [],
			availability,
			updated_at: now
		});

		const populated = await populateListing(created);
		res.status(201).json(populated);
	} catch (error) {
		console.error('Error creating listing:', error);
		res.status(500).json({ error: 'Could not create listing.' });
	}
});

// PATCH /listings/:id
listingsRouter.patch('/:id', requireAuth, requireRole('vendor'), async (req: AuthRequest, res: Response) => {
	try {
		const listing = await Listing.findById(req.params.id);
		if (!listing) {
			res.status(404).json({ error: 'Listing not found.' });
			return;
		}

		const vendor = await VendorProfile.findOne({ user_id: req.user!.id });
		if (!vendor || vendor._id !== listing.vendor_id) {
			res.status(403).json({ error: 'You are not authorized to edit this listing.' });
			return;
		}

		const {
			category_id = listing.category_id,
			title = listing.title,
			description = listing.description,
			price = listing.price,
			unit = listing.unit,
			turnaround_time = listing.turnaround_time,
			inclusions = listing.inclusions,
			exclusions = listing.exclusions,
			availability = listing.availability
		} = req.body;

		const now = new Date().toISOString();

		const updated = await Listing.findByIdAndUpdate(
			req.params.id,
			{
				category_id,
				title: title.trim(),
				description: description.trim(),
				price: Number(price),
				unit: unit.trim(),
				turnaround_time: turnaround_time.trim(),
				inclusions: Array.isArray(inclusions) ? inclusions : [],
				exclusions: Array.isArray(exclusions) ? exclusions : [],
				availability,
				updated_at: now
			},
			{ new: true }
		);

		const populated = await populateListing(updated);
		res.json(populated);
	} catch (error) {
		console.error('Error updating listing:', error);
		res.status(500).json({ error: 'Could not update listing.' });
	}
});
