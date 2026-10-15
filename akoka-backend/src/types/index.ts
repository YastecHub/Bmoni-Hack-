export type UserRole = 'student' | 'vendor' | 'admin';

export interface User {
	id: string;
	display_name: string;
	email: string;
	matric_or_phone: string;
	role: UserRole;
	campus_zone: string;
	created_at: string;
	account_status: 'active' | 'suspended' | 'pending';
}

export interface UserWithPassword extends User {
	password_hash: string;
}

export type VerificationStatus = 'vendor_confirmed' | 'campus_audited' | 'unverified';

export interface VendorProfile {
	id: string;
	user_id: string;
	business_name: string;
	tagline: string;
	categories: string[];
	service_area: string;
	campus_zone: string;
	physical_spot: string;
	verification_status: VerificationStatus;
	phone: string;
	whatsapp: string;
	operational_hours: string;
	rating: number;
	review_count: number;
	completed_transactions_count: number;
	price_integrity_score: number;
	avatar_url?: string;
	bio: string;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	icon: string;
	description: string;
	unit_definition: string;
	comparison_rules: string[];
	typical_item_specs: string[];
	sample_size: number;
}

export interface Listing {
	id: string;
	vendor_id: string;
	category_id: string;
	title: string;
	description: string;
	price: number;
	unit: string;
	turnaround_time: string;
	inclusions: string[];
	exclusions: string[];
	availability: 'available' | 'busy' | 'closed';
	updated_at: string;
	vendor?: VendorProfile;
}

export type ObservationSourceType =
	| 'student_submitted'
	| 'vendor_confirmed'
	| 'receipt_supported'
	| 'transaction_linked';

export type ObservationVerificationStatus = 'pending' | 'verified' | 'flagged' | 'rejected';

export interface PriceObservation {
	id: string;
	reporter_id?: string;
	category_id: string;
	item_specification: string;
	amount: number;
	unit: string;
	area: string;
	campus_zone: string;
	source_type: ObservationSourceType;
	observed_at: string;
	last_confirmed_at: string;
	verification_status: ObservationVerificationStatus;
	vendor_id?: string;
	vendor_name?: string;
	receipt_image_url?: string;
	notes?: string;
}

export type ConfidenceLevel = 'high' | 'moderate' | 'low' | 'insufficient_data';

export interface PriceInsight {
	category_id: string;
	category_name: string;
	item_specification: string;
	sample_size: number;
	median_price: number | null;
	range_low: number | null;
	range_high: number | null;
	confidence_level: ConfidenceLevel;
	confidence_reason: string;
	freshness_days: number;
	recent_trend: 'stable' | 'increasing' | 'decreasing' | 'volatile';
	comparable_observations: PriceObservation[];
}

export type TransactionStatus =
	| 'draft'
	| 'awaiting_agreement'
	| 'agreed'
	| 'in_progress'
	| 'awaiting_confirmation'
	| 'completed'
	| 'disputed'
	| 'cancelled';

export interface TransactionMilestone {
	id: string;
	title: string;
	description: string;
	completed: boolean;
	completed_at?: string;
}

export interface Transaction {
	id: string;
	buyer_id: string;
	buyer_name: string;
	vendor_id: string;
	vendor_name: string;
	listing_id?: string;
	item_title: string;
	category_id: string;
	agreed_price: number;
	scope: string;
	deliverables: string[];
	turnaround_description: string;
	due_at: string;
	milestones: TransactionMilestone[];
	status: TransactionStatus;
	payment?: {
		status: 'not_started' | 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
		amount: number;
		currency: string;
		provider_reference?: string;
	};
	evidence_attachments: Array<{
		id: string;
		title: string;
		url: string;
		uploader: string;
		uploaded_at: string;
	}>;
	cancellation_terms: string;
	created_at: string;
	updated_at: string;
	vendor?: VendorProfile;
	review_submitted?: boolean;
}

export interface TransactionEvent {
	id: string;
	transaction_id: string;
	actor_id: string;
	actor_name: string;
	actor_role: UserRole;
	event_type:
		| 'created'
		| 'agreement_proposed'
		| 'agreement_accepted'
		| 'work_started'
		| 'milestone_completed'
		| 'deliverable_submitted'
		| 'completion_confirmed'
		| 'issue_flagged'
		| 'cancelled';
	details: string;
	created_at: string;
}

export interface Review {
	id: string;
	transaction_id: string;
	reviewer_id: string;
	reviewer_name: string;
	vendor_id: string;
	rating: number;
	comment: string;
	verified_purchase: boolean;
	created_at: string;
}

export interface Report {
	id: string;
	reporter_id: string;
	reporter_name: string;
	target_type: 'listing' | 'price_observation' | 'transaction' | 'vendor' | 'review';
	target_id: string;
	reason: string;
	details: string;
	status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
	created_at: string;
}

export interface PaymentIntent {
	id: string;
	transaction_id: string;
	status: 'requires_action' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
	amount: number;
	currency: string;
	checkout_url?: string;
}
