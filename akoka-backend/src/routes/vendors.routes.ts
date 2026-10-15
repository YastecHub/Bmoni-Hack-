import { Router, Request, Response } from 'express';
import { VendorProfile, Listing, Review } from '../db/models/index.js';
import type { VendorProfile as VendorProfileType, Listing as ListingType, Review as ReviewType } from '../types/index.js';

export const vendorsRouter = Router();

// GET /vendors
vendorsRouter.get('/', async (_req: Request, res: Response) => {
	try {
		const vendorDocs = await VendorProfile.find().sort({ rating: -1 });
		const vendors: VendorProfileType[] = vendorDocs.map((v) => v.toJSON());
		res.json(vendors);
	} catch (error) {
		console.error('Error fetching vendors:', error);
		res.status(500).json({ error: 'Could not fetch campus vendors.' });
	}
});

// GET /vendors/:id
vendorsRouter.get('/:id', async (req: Request, res: Response) => {
	try {
		const vendorDoc = await VendorProfile.findById(req.params.id);
		if (!vendorDoc) {
			res.status(404).json({ error: 'Vendor profile not found.' });
			return;
		}

		const vendor: VendorProfileType = vendorDoc.toJSON();

		// Fetch vendor listings
		const listingDocs = await Listing.find({ vendor_id: vendor.id }).sort({ updated_at: -1 });
		const listings: ListingType[] = listingDocs.map((l) => ({
			...l.toJSON(),
			vendor
		}));

		// Fetch vendor reviews
		const reviewDocs = await Review.find({ vendor_id: vendor.id }).sort({ created_at: -1 });
		const reviews: ReviewType[] = reviewDocs.map((r) => r.toJSON());

		res.json({ vendor, listings, reviews });
	} catch (error) {
		console.error('Error fetching vendor details:', error);
		res.status(500).json({ error: 'Could not fetch vendor profile.' });
	}
});

// GET /vendors/:id/reviews
vendorsRouter.get('/:id/reviews', async (req: Request, res: Response) => {
	try {
		const reviewDocs = await Review.find({ vendor_id: req.params.id }).sort({ created_at: -1 });
		const reviews: ReviewType[] = reviewDocs.map((r) => r.toJSON());
		res.json(reviews);
	} catch (error) {
		console.error('Error fetching vendor reviews:', error);
		res.status(500).json({ error: 'Could not fetch reviews.' });
	}
});
