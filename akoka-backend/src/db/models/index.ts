import mongoose, { Schema, Model } from 'mongoose';

const baseOptions = {
	toJSON: {
		virtuals: true,
		transform: (_doc: any, ret: any) => {
			ret.id = ret._id;
			delete ret._id;
			delete ret.__v;
			return ret;
		}
	},
	toObject: {
		virtuals: true,
		transform: (_doc: any, ret: any) => {
			ret.id = ret._id;
			delete ret._id;
			delete ret.__v;
			return ret;
		}
	}
};

// 1. User Model
const userSchema = new Schema(
	{
		_id: { type: String, required: true },
		display_name: { type: String, required: true },
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		password_hash: { type: String, required: true },
		matric_or_phone: { type: String, default: '' },
		role: { type: String, enum: ['student', 'vendor', 'admin'], required: true },
		campus_zone: { type: String, required: true },
		created_at: { type: String, required: true },
		account_status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' }
	},
	baseOptions
);

// 2. Vendor Profile Model
const vendorProfileSchema = new Schema(
	{
		_id: { type: String, required: true },
		user_id: { type: String, required: true, unique: true, ref: 'User' },
		business_name: { type: String, required: true },
		tagline: { type: String, default: '' },
		categories: { type: [String], default: [] },
		service_area: { type: String, required: true },
		campus_zone: { type: String, required: true },
		physical_spot: { type: String, required: true },
		verification_status: {
			type: String,
			enum: ['vendor_confirmed', 'campus_audited', 'unverified'],
			default: 'vendor_confirmed'
		},
		phone: { type: String, required: true },
		whatsapp: { type: String, default: '' },
		operational_hours: { type: String, required: true },
		rating: { type: Number, default: 5.0 },
		review_count: { type: Number, default: 0 },
		completed_transactions_count: { type: Number, default: 0 },
		price_integrity_score: { type: Number, default: 95 },
		avatar_url: { type: String },
		bio: { type: String, default: '' }
	},
	baseOptions
);

// 3. Category Model
const categorySchema = new Schema(
	{
		_id: { type: String, required: true },
		name: { type: String, required: true },
		slug: { type: String, required: true, unique: true },
		icon: { type: String, required: true },
		description: { type: String, required: true },
		unit_definition: { type: String, required: true },
		comparison_rules: { type: [String], default: [] },
		typical_item_specs: { type: [String], default: [] },
		sample_size: { type: Number, default: 0 }
	},
	baseOptions
);

// 4. Listing Model
const listingSchema = new Schema(
	{
		_id: { type: String, required: true },
		vendor_id: { type: String, required: true, ref: 'VendorProfile' },
		category_id: { type: String, required: true, ref: 'Category' },
		title: { type: String, required: true },
		description: { type: String, default: '' },
		price: { type: Number, required: true },
		unit: { type: String, required: true },
		turnaround_time: { type: String, required: true },
		inclusions: { type: [String], default: [] },
		exclusions: { type: [String], default: [] },
		availability: { type: String, enum: ['available', 'busy', 'closed'], default: 'available' },
		updated_at: { type: String, required: true }
	},
	baseOptions
);

// 5. Price Observation Model
const priceObservationSchema = new Schema(
	{
		_id: { type: String, required: true },
		reporter_id: { type: String, ref: 'User' },
		category_id: { type: String, required: true, ref: 'Category' },
		item_specification: { type: String, required: true },
		amount: { type: Number, required: true },
		unit: { type: String, required: true },
		area: { type: String, required: true },
		campus_zone: { type: String, required: true },
		source_type: {
			type: String,
			enum: ['student_submitted', 'vendor_confirmed', 'receipt_supported', 'transaction_linked'],
			required: true
		},
		observed_at: { type: String, required: true },
		last_confirmed_at: { type: String, required: true },
		verification_status: {
			type: String,
			enum: ['pending', 'verified', 'flagged', 'rejected'],
			default: 'pending'
		},
		vendor_id: { type: String, ref: 'VendorProfile' },
		vendor_name: { type: String },
		receipt_image_url: { type: String },
		notes: { type: String }
	},
	baseOptions
);

// 6. Transaction Model
const milestoneSchema = new Schema(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		description: { type: String, default: '' },
		completed: { type: Boolean, default: false },
		completed_at: { type: String }
	},
	{ _id: false }
);

const paymentSchema = new Schema(
	{
		status: {
			type: String,
			enum: ['not_started', 'pending', 'processing', 'succeeded', 'failed', 'cancelled'],
			default: 'not_started'
		},
		amount: { type: Number, required: true },
		currency: { type: String, default: 'NGN' },
		provider_reference: { type: String }
	},
	{ _id: false }
);

const evidenceSchema = new Schema(
	{
		id: { type: String, required: true },
		title: { type: String, required: true },
		url: { type: String, required: true },
		uploader: { type: String, required: true },
		uploaded_at: { type: String, required: true }
	},
	{ _id: false }
);

const transactionSchema = new Schema(
	{
		_id: { type: String, required: true },
		buyer_id: { type: String, required: true, ref: 'User' },
		buyer_name: { type: String, required: true },
		vendor_id: { type: String, required: true, ref: 'VendorProfile' },
		vendor_name: { type: String, required: true },
		listing_id: { type: String, ref: 'Listing' },
		item_title: { type: String, required: true },
		category_id: { type: String, required: true, ref: 'Category' },
		agreed_price: { type: Number, required: true },
		scope: { type: String, required: true },
		deliverables: { type: [String], default: [] },
		turnaround_description: { type: String, default: '' },
		due_at: { type: String, required: true },
		milestones: { type: [milestoneSchema], default: [] },
		status: {
			type: String,
			enum: [
				'draft',
				'awaiting_agreement',
				'agreed',
				'in_progress',
				'awaiting_confirmation',
				'completed',
				'disputed',
				'cancelled'
			],
			default: 'awaiting_agreement'
		},
		payment: { type: paymentSchema },
		evidence_attachments: { type: [evidenceSchema], default: [] },
		cancellation_terms: { type: String, default: 'Standard cancellation terms.' },
		created_at: { type: String, required: true },
		updated_at: { type: String, required: true }
	},
	baseOptions
);

// 7. Transaction Event Model
const transactionEventSchema = new Schema(
	{
		_id: { type: String, required: true },
		transaction_id: { type: String, required: true, ref: 'Transaction' },
		actor_id: { type: String, required: true },
		actor_name: { type: String, required: true },
		actor_role: { type: String, required: true },
		event_type: { type: String, required: true },
		details: { type: String, required: true },
		created_at: { type: String, required: true }
	},
	baseOptions
);

// 8. Review Model
const reviewSchema = new Schema(
	{
		_id: { type: String, required: true },
		transaction_id: { type: String, required: true, unique: true, ref: 'Transaction' },
		reviewer_id: { type: String, required: true, ref: 'User' },
		reviewer_name: { type: String, required: true },
		vendor_id: { type: String, required: true, ref: 'VendorProfile' },
		rating: { type: Number, min: 1, max: 5, required: true },
		comment: { type: String, default: '' },
		verified_purchase: { type: Boolean, default: true },
		created_at: { type: String, required: true }
	},
	baseOptions
);

// 9. Report Model
const reportSchema = new Schema(
	{
		_id: { type: String, required: true },
		reporter_id: { type: String, required: true, ref: 'User' },
		reporter_name: { type: String, required: true },
		target_type: {
			type: String,
			enum: ['listing', 'price_observation', 'transaction', 'vendor', 'review'],
			required: true
		},
		target_id: { type: String, required: true },
		reason: { type: String, required: true },
		details: { type: String, default: '' },
		status: { type: String, enum: ['pending', 'reviewed', 'resolved', 'dismissed'], default: 'pending' },
		created_at: { type: String, required: true }
	},
	baseOptions
);

// 10. Payment Model
const paymentIntentSchema = new Schema(
	{
		_id: { type: String, required: true },
		transaction_id: { type: String, required: true, ref: 'Transaction' },
		status: {
			type: String,
			enum: ['requires_action', 'processing', 'succeeded', 'failed', 'cancelled'],
			default: 'processing'
		},
		amount: { type: Number, required: true },
		currency: { type: String, default: 'NGN' },
		checkout_url: { type: String },
		provider_reference: { type: String },
		created_at: { type: String, required: true },
		updated_at: { type: String, required: true }
	},
	baseOptions
);

// Prevent model recompilation in serverless / hot reload environments
export const User: Model<any> = mongoose.models.User || mongoose.model('User', userSchema);
export const VendorProfile: Model<any> =
	mongoose.models.VendorProfile || mongoose.model('VendorProfile', vendorProfileSchema);
export const Category: Model<any> =
	mongoose.models.Category || mongoose.model('Category', categorySchema);
export const Listing: Model<any> =
	mongoose.models.Listing || mongoose.model('Listing', listingSchema);
export const PriceObservation: Model<any> =
	mongoose.models.PriceObservation || mongoose.model('PriceObservation', priceObservationSchema);
export const Transaction: Model<any> =
	mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
export const TransactionEvent: Model<any> =
	mongoose.models.TransactionEvent || mongoose.model('TransactionEvent', transactionEventSchema);
export const Review: Model<any> =
	mongoose.models.Review || mongoose.model('Review', reviewSchema);
export const Report: Model<any> =
	mongoose.models.Report || mongoose.model('Report', reportSchema);
export const Payment: Model<any> =
	mongoose.models.Payment || mongoose.model('Payment', paymentIntentSchema);
