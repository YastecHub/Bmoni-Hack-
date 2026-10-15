-- AKOKA Campus Commerce & Price Intelligence Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    matric_or_phone TEXT,
    role TEXT NOT NULL CHECK(role IN ('student', 'vendor', 'admin')),
    campus_zone TEXT NOT NULL,
    created_at TEXT NOT NULL,
    account_status TEXT NOT NULL DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'pending'))
);

CREATE TABLE IF NOT EXISTS vendor_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    tagline TEXT,
    categories TEXT NOT NULL, -- JSON array of category IDs
    service_area TEXT NOT NULL,
    campus_zone TEXT NOT NULL,
    physical_spot TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK(verification_status IN ('vendor_confirmed', 'campus_audited', 'unverified')),
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    operational_hours TEXT NOT NULL,
    rating REAL NOT NULL DEFAULT 5.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    completed_transactions_count INTEGER NOT NULL DEFAULT 0,
    price_integrity_score INTEGER NOT NULL DEFAULT 95,
    avatar_url TEXT,
    bio TEXT
);

CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    unit_definition TEXT NOT NULL,
    comparison_rules TEXT NOT NULL, -- JSON array of strings
    typical_item_specs TEXT NOT NULL, -- JSON array of strings
    sample_size INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price REAL NOT NULL,
    unit TEXT NOT NULL,
    turnaround_time TEXT NOT NULL,
    inclusions TEXT NOT NULL, -- JSON array of strings
    exclusions TEXT NOT NULL, -- JSON array of strings
    availability TEXT NOT NULL CHECK(availability IN ('available', 'busy', 'closed')),
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS price_observations (
    id TEXT PRIMARY KEY,
    reporter_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    item_specification TEXT NOT NULL,
    amount REAL NOT NULL,
    unit TEXT NOT NULL,
    area TEXT NOT NULL,
    campus_zone TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK(source_type IN ('student_submitted', 'vendor_confirmed', 'receipt_supported', 'transaction_linked')),
    observed_at TEXT NOT NULL,
    last_confirmed_at TEXT NOT NULL,
    verification_status TEXT NOT NULL CHECK(verification_status IN ('pending', 'verified', 'flagged', 'rejected')),
    vendor_id TEXT REFERENCES vendor_profiles(id) ON DELETE SET NULL,
    vendor_name TEXT,
    receipt_image_url TEXT,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    buyer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    buyer_name TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    vendor_name TEXT NOT NULL,
    listing_id TEXT REFERENCES listings(id) ON DELETE SET NULL,
    item_title TEXT NOT NULL,
    category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    agreed_price REAL NOT NULL,
    scope TEXT NOT NULL,
    deliverables TEXT NOT NULL, -- JSON array of strings
    turnaround_description TEXT NOT NULL,
    due_at TEXT NOT NULL,
    milestones TEXT NOT NULL, -- JSON array of milestone objects
    status TEXT NOT NULL CHECK(status IN ('draft', 'awaiting_agreement', 'agreed', 'in_progress', 'awaiting_confirmation', 'completed', 'disputed', 'cancelled')),
    payment TEXT, -- JSON object {status, amount, currency, provider_reference}
    evidence_attachments TEXT NOT NULL DEFAULT '[]', -- JSON array of evidence objects
    cancellation_terms TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transaction_events (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    actor_id TEXT NOT NULL REFERENCES users(id),
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details TEXT NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    transaction_id TEXT UNIQUE NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_name TEXT NOT NULL,
    vendor_id TEXT NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    verified_purchase INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    reporter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_name TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK(target_type IN ('listing', 'price_observation', 'transaction', 'vendor', 'review')),
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    details TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK(status IN ('requires_action', 'processing', 'succeeded', 'failed', 'cancelled')),
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'NGN',
    checkout_url TEXT,
    provider_reference TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_vendor ON listings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_observations_cat_spec ON price_observations(category_id, item_specification);
CREATE INDEX IF NOT EXISTS idx_observations_status ON price_observations(verification_status);
CREATE INDEX IF NOT EXISTS idx_transactions_buyer ON transactions(buyer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_vendor ON transactions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_events_transaction ON transaction_events(transaction_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
