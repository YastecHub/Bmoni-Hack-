import bcrypt from 'bcryptjs';
import { connectMongoDB } from './mongodb.js';
import {
	User,
	VendorProfile,
	Category,
	Listing,
	PriceObservation,
	Transaction,
	TransactionEvent,
	Review,
	Report
} from './models/index.js';

export async function seed() {
	await connectMongoDB();

	console.log('🌱 Checking MongoDB seed status...');
	const existingCount = await User.countDocuments();
	if (existingCount > 0) {
		console.log('MongoDB already contains data. Skipping initial seed.');
		return;
	}

	console.log('Seeding initial AKOKA UNILAG demo dataset into MongoDB...');

	const passwordHash = await bcrypt.hash('password123', 10);
	const adminPasswordHash = await bcrypt.hash('admin123', 10);
	const now = new Date().toISOString();

	const pastDate = (daysAgo: number) => {
		const d = new Date();
		d.setDate(d.getDate() - daysAgo);
		return d.toISOString();
	};

	// 1. Users
	const users = [
		{
			_id: 'usr_student_tunde',
			display_name: 'Tunde Bakare',
			email: 'student@unilag.edu.ng',
			password_hash: passwordHash,
			matric_or_phone: '200408012',
			role: 'student',
			campus_zone: 'new_hall',
			created_at: now,
			account_status: 'active'
		},
		{
			_id: 'usr_student_chioma',
			display_name: 'Chioma Eze',
			email: 'chioma@unilag.edu.ng',
			password_hash: passwordHash,
			matric_or_phone: '210405088',
			role: 'student',
			campus_zone: 'moremi_amina',
			created_at: now,
			account_status: 'active'
		},
		{
			_id: 'usr_vendor_ngozi',
			display_name: 'Madam Ngozi Okonkwo',
			email: 'vendor@unilag.edu.ng',
			password_hash: passwordHash,
			matric_or_phone: '08012345678',
			role: 'vendor',
			campus_zone: 'cits_commercial',
			created_at: now,
			account_status: 'active'
		},
		{
			_id: 'usr_vendor_segun',
			display_name: 'Engr. Segun Adeyemi',
			email: 'repairs@unilag.edu.ng',
			password_hash: passwordHash,
			matric_or_phone: '08087654321',
			role: 'vendor',
			campus_zone: 'new_hall',
			created_at: now,
			account_status: 'active'
		},
		{
			_id: 'usr_vendor_ibrahim',
			display_name: 'Ibrahim Bello',
			email: 'laundry@unilag.edu.ng',
			password_hash: passwordHash,
			matric_or_phone: '08055554444',
			role: 'vendor',
			campus_zone: 'bariga_gate',
			created_at: now,
			account_status: 'active'
		},
		{
			_id: 'usr_admin',
			display_name: 'Akoka Trust & Safety Desk',
			email: 'admin@akoka.unilag.edu.ng',
			password_hash: adminPasswordHash,
			matric_or_phone: '08000000000',
			role: 'admin',
			campus_zone: 'cits_commercial',
			created_at: now,
			account_status: 'active'
		}
	];
	await User.insertMany(users);

	// 2. Vendor Profiles
	const vendors = [
		{
			_id: 'vnd_finbarr_prints',
			user_id: 'usr_vendor_ngozi',
			business_name: 'Finbarr & CITS Academic Print Hub',
			tagline: 'Certified thesis binding, laser colour printing & faculty formatting',
			categories: ['cat_printing', 'cat_typesetting'],
			service_area: 'CITS Commercial Centre, UNILAG Main Campus',
			campus_zone: 'cits_commercial',
			physical_spot: 'Shop 14, Opposite Faculty of Education Concourse',
			verification_status: 'campus_audited',
			phone: '08012345678',
			whatsapp: '2348012345678',
			operational_hours: '8:00 AM - 7:30 PM (Mon - Sat)',
			rating: 4.9,
			review_count: 32,
			completed_transactions_count: 124,
			price_integrity_score: 98,
			bio: 'Serving UNILAG undergraduate and postgraduate students for over 8 years with precise university-approved font, margin and hard-cover gold embossing standards.'
		},
		{
			_id: 'vnd_tech_clinic',
			user_id: 'usr_vendor_segun',
			business_name: 'New Hall Tech Clinic',
			tagline: 'Hardware diagnostics, screen replacements & component soldering',
			categories: ['cat_gadgets'],
			service_area: 'New Hall Complex & Mariere Quadrangle',
			campus_zone: 'new_hall',
			physical_spot: 'Kiosk 7, Beside Madam Mango, New Hall Shopping Complex',
			verification_status: 'vendor_confirmed',
			phone: '08087654321',
			whatsapp: '2348087654321',
			operational_hours: '9:00 AM - 8:00 PM (Mon - Sun)',
			rating: 4.8,
			review_count: 24,
			completed_transactions_count: 88,
			price_integrity_score: 95,
			bio: 'Specialist in HP, Dell, MacBook and Lenovo motherboards, hinge rebuilds, cracked display swaps and fast RAM/NVMe storage upgrades with 14-day warranty.'
		},
		{
			_id: 'vnd_swift_laundry',
			user_id: 'usr_vendor_ibrahim',
			business_name: 'Akoka Swift Wash & Dry Depot',
			tagline: '24hr student laundry, steam pressing & white garment recovery',
			categories: ['cat_laundry'],
			service_area: 'Bariga Gate, St. Finbarr’s & Campus Gate Depots',
			campus_zone: 'bariga_gate',
			physical_spot: '12 St. Finbarr’s College Road (Outside Gate 2)',
			verification_status: 'vendor_confirmed',
			phone: '08055554444',
			whatsapp: '2348055554444',
			operational_hours: '7:30 AM - 9:00 PM Daily',
			rating: 4.7,
			review_count: 41,
			completed_transactions_count: 165,
			price_integrity_score: 96,
			bio: 'Reliable laundry service for busy students. Pick-up and drop-off available at Jaja sports complex and hall gates.'
		}
	];
	await VendorProfile.insertMany(vendors);

	// 3. Categories
	const categories = [
		{
			_id: 'cat_printing',
			name: 'Thesis & Academic Printing',
			slug: 'thesis-academic-printing',
			icon: 'printer',
			description: 'A4 monochrome printouts, colour plates, questionnaire copies and hard-cover thesis embossing.',
			unit_definition: 'per A4 page / volume',
			comparison_rules: ['Specify 70gsm vs 80gsm paper', 'Colour page ratio', 'Spine gold foil letters'],
			typical_item_specs: [
				'Black & White A4 (Single-sided)',
				'Black & White A4 (Double-sided)',
				'Full Colour A4 Plate',
				'Hardcover Thesis Embossing (Gold Foil)',
				'Spiral Coil Binding (Up to 150 pages)'
			],
			sample_size: 42
		},
		{
			_id: 'cat_gadgets',
			name: 'Laptop & Gadget Repairs',
			slug: 'laptop-gadget-repairs',
			icon: 'wrench',
			description: 'Display replacements, hinge repairs, keyboard replacements, battery swaps and OS restoration.',
			unit_definition: 'per repair service',
			comparison_rules: ['Part replacement included or labour only', 'Warranty period (min 7 days)'],
			typical_item_specs: [
				'Laptop Screen Replacement (15.6 inch LED)',
				'OS Reinstallation & Drive Health Audit',
				'Keyboard Replacement (HP / Dell / Lenovo)',
				'Phone Charging Port Microsoldering',
				'Thermal Paste & Fan Deep Clean'
			],
			sample_size: 29
		},
		{
			_id: 'cat_laundry',
			name: 'Hostels & Room Laundry',
			slug: 'hostels-room-laundry',
			icon: 'shirt',
			description: 'Bucket laundry, duvet cleaning, dry cleaning for corporate attire and prompt steam ironing.',
			unit_definition: 'per bucket / piece',
			comparison_rules: ['Wash, dry & press bundled', 'Stain treatment', 'Turnaround 24h vs 48h'],
			typical_item_specs: [
				'Full Bucket Laundry (Wash & Fold)',
				'Suit / Blazer Dry Cleaning',
				'Single Bedspread & Blanket Wash',
				'Jeans & Chinos Pressing (Per 5 Pieces)'
			],
			sample_size: 35
		},
		{
			_id: 'cat_typesetting',
			name: 'Formatting & Typing Services',
			slug: 'formatting-typing-services',
			icon: 'file-text',
			description: 'UNILAG guideline thesis typography, LaTeX mathematical equations, questionnaire data entry.',
			unit_definition: 'per document / page',
			comparison_rules: ['Pagination & table of contents inclusion', 'Proofreading turnaround'],
			typical_item_specs: [
				'Final Year Project Formatting (Full Thesis)',
				'Questionnaire Data Entry (Per 50 records)',
				'PowerPoint Defence Deck Polish (15 slides)'
			],
			sample_size: 18
		}
	];
	await Category.insertMany(categories);

	// 4. Listings
	const listings = [
		{
			_id: 'lst_thesis_hardcover',
			vendor_id: 'vnd_finbarr_prints',
			category_id: 'cat_printing',
			title: 'UNILAG Certified Hardcover Thesis Embossing (Gold Foil)',
			description: 'Standard navy blue/green buckram cover with hot-pressed metallic gold spine and front foil lettering according to UNILAG Postgraduate & Undergraduate school guidelines.',
			price: 4500,
			unit: 'per copy',
			turnaround_time: '24 - 48 Hours',
			inclusions: ['Gold foil spine & front title stamping', 'Three review proofs before binding', 'Heavy-weight binder board'],
			exclusions: ['Internal page printing (charged separately at ₦40/page)'],
			availability: 'available',
			updated_at: now
		},
		{
			_id: 'lst_thesis_bw_pages',
			vendor_id: 'vnd_finbarr_prints',
			category_id: 'cat_printing',
			title: 'Laser Monochrome Thesis Pages (80gsm Double-A Paper)',
			description: 'Crisp 1200dpi monochrome printing on premium bright white paper. Zero smudges or bleed-through.',
			price: 40,
			unit: 'per page',
			turnaround_time: 'Instant / Same Day',
			inclusions: ['80gsm high-opacity paper', 'Collation and page sorting'],
			exclusions: ['Binding'],
			availability: 'available',
			updated_at: now
		},
		{
			_id: 'lst_laptop_screen',
			vendor_id: 'vnd_tech_clinic',
			category_id: 'cat_gadgets',
			title: '15.6" Slim Full HD Laptop Screen Replacement + 30-Day Warranty',
			description: 'Brand new A+ grade matte display panel for HP, Dell, Lenovo and Acer laptops. Zero dead pixels guaranteed.',
			price: 36000,
			unit: 'per installation',
			turnaround_time: '2 - 4 Hours',
			inclusions: ['Screen panel hardware', 'Professional installation labour', 'Internal bezel dusting', '30-day warranty'],
			exclusions: ['Cracked top lid plastic repair (if needed, extra ₦4,000)'],
			availability: 'available',
			updated_at: now
		},
		{
			_id: 'lst_laptop_service',
			vendor_id: 'vnd_tech_clinic',
			category_id: 'cat_gadgets',
			title: 'Thermal Overhaul: Fan Clean, Arctic MX-4 Paste & OS Tuneup',
			description: 'Stops laptop overheating, throttle drops and loud fan noise. Includes high-performance thermal paste application and thermal fan lubrication.',
			price: 6500,
			unit: 'per laptop',
			turnaround_time: 'Same Day (3 Hours)',
			inclusions: ['Arctic MX-4 thermal paste application', 'Motherboard heat pipe flush', 'Windows startup optimization'],
			exclusions: ['Hard drive / SSD replacement parts'],
			availability: 'available',
			updated_at: now
		},
		{
			_id: 'lst_bucket_laundry',
			vendor_id: 'vnd_swift_laundry',
			category_id: 'cat_laundry',
			title: 'Hostel Jumbo Bucket Laundry (Wash, Dry & Neat Fold)',
			description: 'Complete bucket wash for shirts, trousers, tops and daily clothes using clean borehole water, quality detergent and fabric softener.',
			price: 2500,
			unit: 'per full bucket',
			turnaround_time: '24 Hours',
			inclusions: ['Detergent & Downy softener', 'Electric drying / sunny air dry', 'Neat folding in polybag'],
			exclusions: ['Ironing / pressing (add ₦1,000 per bucket for full steam press)'],
			availability: 'available',
			updated_at: now
		}
	];
	await Listing.insertMany(listings);

	// 5. Price Observations across multiple dates for genuine trend charts
	const observations = [
		{ _id: 'obs_print_1', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Black & White A4 (Single-sided)', amount: 40, unit: 'per page', area: 'CITS Commercial Centre', campus_zone: 'cits_commercial', source_type: 'receipt_supported', observed_at: pastDate(14), last_confirmed_at: pastDate(14), verification_status: 'verified', vendor_id: 'vnd_finbarr_prints', vendor_name: 'Finbarr & CITS Academic Print Hub', notes: 'Printed 85 pages with receipt.' },
		{ _id: 'obs_print_2', reporter_id: 'usr_student_chioma', category_id: 'cat_printing', item_specification: 'Black & White A4 (Single-sided)', amount: 45, unit: 'per page', area: 'New Hall Complex', campus_zone: 'new_hall', source_type: 'student_submitted', observed_at: pastDate(10), last_confirmed_at: pastDate(10), verification_status: 'verified', vendor_name: 'New Hall Business Kiosk 3', notes: 'Single page project draft.' },
		{ _id: 'obs_print_3', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Black & White A4 (Single-sided)', amount: 40, unit: 'per page', area: 'Science & Engineering Concourse', campus_zone: 'science_eng', source_type: 'vendor_confirmed', observed_at: pastDate(6), last_confirmed_at: pastDate(6), verification_status: 'verified', vendor_name: 'Engineering Annex Xerox', notes: 'Confirmed standard rate.' },
		{ _id: 'obs_print_4', reporter_id: 'usr_student_chioma', category_id: 'cat_printing', item_specification: 'Black & White A4 (Single-sided)', amount: 40, unit: 'per page', area: 'CITS Commercial Centre', campus_zone: 'cits_commercial', source_type: 'transaction_linked', observed_at: pastDate(2), last_confirmed_at: pastDate(2), verification_status: 'verified', vendor_id: 'vnd_finbarr_prints', vendor_name: 'Finbarr & CITS Academic Print Hub', notes: 'Completed project print job.' },
		{ _id: 'obs_print_5', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Black & White A4 (Single-sided)', amount: 50, unit: 'per page', area: 'Fagunwa & Mariere Axis', campus_zone: 'fagunwa_mariere', source_type: 'student_submitted', observed_at: pastDate(1), last_confirmed_at: pastDate(1), verification_status: 'verified', vendor_name: 'Mariere Night Print Spot', notes: 'Slightly higher late-evening rate.' },

		{ _id: 'obs_emboss_1', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Hardcover Thesis Embossing (Gold Foil)', amount: 4500, unit: 'per copy', area: 'CITS Commercial Centre', campus_zone: 'cits_commercial', source_type: 'receipt_supported', observed_at: pastDate(18), last_confirmed_at: pastDate(18), verification_status: 'verified', vendor_id: 'vnd_finbarr_prints', vendor_name: 'Finbarr & CITS Academic Print Hub', notes: 'Standard navy blue thesis cover.' },
		{ _id: 'obs_emboss_2', reporter_id: 'usr_student_chioma', category_id: 'cat_printing', item_specification: 'Hardcover Thesis Embossing (Gold Foil)', amount: 5000, unit: 'per copy', area: 'Bariga Gate Axis', campus_zone: 'bariga_gate', source_type: 'student_submitted', observed_at: pastDate(12), last_confirmed_at: pastDate(12), verification_status: 'verified', vendor_name: 'St. Finbarr Bindery', notes: 'Quick 24hr rush.' },
		{ _id: 'obs_emboss_3', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Hardcover Thesis Embossing (Gold Foil)', amount: 4500, unit: 'per copy', area: 'CITS Commercial Centre', campus_zone: 'cits_commercial', source_type: 'vendor_confirmed', observed_at: pastDate(5), last_confirmed_at: pastDate(5), verification_status: 'verified', vendor_id: 'vnd_finbarr_prints', vendor_name: 'Finbarr & CITS Academic Print Hub', notes: 'Bulk discount of 3 copies.' },
		{ _id: 'obs_emboss_4', reporter_id: 'usr_student_chioma', category_id: 'cat_printing', item_specification: 'Hardcover Thesis Embossing (Gold Foil)', amount: 4800, unit: 'per copy', area: 'New Hall Complex', campus_zone: 'new_hall', source_type: 'student_submitted', observed_at: pastDate(1), last_confirmed_at: pastDate(1), verification_status: 'verified', vendor_name: 'Madam Mango Quad', notes: 'Includes silver ribbon bookmark.' },

		{ _id: 'obs_tech_1', reporter_id: 'usr_student_tunde', category_id: 'cat_gadgets', item_specification: 'Laptop Screen Replacement (15.6 inch LED)', amount: 35000, unit: 'per installation', area: 'New Hall Complex', campus_zone: 'new_hall', source_type: 'transaction_linked', observed_at: pastDate(20), last_confirmed_at: pastDate(20), verification_status: 'verified', vendor_id: 'vnd_tech_clinic', vendor_name: 'New Hall Tech Clinic', notes: 'Dell Inspiron screen swap.' },
		{ _id: 'obs_tech_2', reporter_id: 'usr_student_chioma', category_id: 'cat_gadgets', item_specification: 'Laptop Screen Replacement (15.6 inch LED)', amount: 37000, unit: 'per installation', area: 'Bariga Gate Axis', campus_zone: 'bariga_gate', source_type: 'receipt_supported', observed_at: pastDate(11), last_confirmed_at: pastDate(11), verification_status: 'verified', vendor_name: 'Computer Village Bariga Annex', notes: 'HP Pavilion screen swap.' },
		{ _id: 'obs_tech_3', reporter_id: 'usr_student_tunde', category_id: 'cat_gadgets', item_specification: 'Laptop Screen Replacement (15.6 inch LED)', amount: 36000, unit: 'per installation', area: 'New Hall Complex', campus_zone: 'new_hall', source_type: 'vendor_confirmed', observed_at: pastDate(3), last_confirmed_at: pastDate(3), verification_status: 'verified', vendor_id: 'vnd_tech_clinic', vendor_name: 'New Hall Tech Clinic', notes: 'Current verified price.' },

		{ _id: 'obs_laundry_1', reporter_id: 'usr_student_tunde', category_id: 'cat_laundry', item_specification: 'Full Bucket Laundry (Wash & Fold)', amount: 2500, unit: 'per bucket', area: 'Bariga Gate Axis', campus_zone: 'bariga_gate', source_type: 'vendor_confirmed', observed_at: pastDate(15), last_confirmed_at: pastDate(15), verification_status: 'verified', vendor_id: 'vnd_swift_laundry', vendor_name: 'Akoka Swift Wash & Dry Depot', notes: 'Standard large student bucket.' },
		{ _id: 'obs_laundry_2', reporter_id: 'usr_student_chioma', category_id: 'cat_laundry', item_specification: 'Full Bucket Laundry (Wash & Fold)', amount: 2800, unit: 'per bucket', area: 'Moremi & Amina Hall Axis', campus_zone: 'moremi_amina', source_type: 'student_submitted', observed_at: pastDate(8), last_confirmed_at: pastDate(8), verification_status: 'verified', vendor_name: 'Amina Hall Washerman', notes: 'Pick-up right at porter lodge.' },
		{ _id: 'obs_laundry_3', reporter_id: 'usr_student_tunde', category_id: 'cat_laundry', item_specification: 'Full Bucket Laundry (Wash & Fold)', amount: 2500, unit: 'per bucket', area: 'Fagunwa & Mariere Axis', campus_zone: 'fagunwa_mariere', source_type: 'receipt_supported', observed_at: pastDate(2), last_confirmed_at: pastDate(2), verification_status: 'verified', vendor_name: 'Mariere Quad Washman', notes: 'Clean fold, ready in 24h.' },

		// Pending moderation items for admin review demo
		{ _id: 'obs_pending_1', reporter_id: 'usr_student_tunde', category_id: 'cat_printing', item_specification: 'Full Colour A4 Plate', amount: 150, unit: 'per page', area: 'CITS Commercial Centre', campus_zone: 'cits_commercial', source_type: 'student_submitted', observed_at: now, last_confirmed_at: now, verification_status: 'pending', vendor_name: 'Faculty of Ed Annex Xerox', notes: 'High gloss photographic paper.' },
		{ _id: 'obs_pending_2', reporter_id: 'usr_student_chioma', category_id: 'cat_gadgets', item_specification: 'OS Reinstallation & Drive Health Audit', amount: 3500, unit: 'per job', area: 'New Hall Complex', campus_zone: 'new_hall', source_type: 'student_submitted', observed_at: now, last_confirmed_at: now, verification_status: 'pending', vendor_name: 'Student Tech Repair', notes: 'Reinstalled Windows 11 with drivers.' }
	];
	await PriceObservation.insertMany(observations);

	// 6. Transactions
	const transactions = [
		{
			_id: 'tx_demo_agreed',
			buyer_id: 'usr_student_tunde',
			buyer_name: 'Tunde Bakare',
			vendor_id: 'vnd_finbarr_prints',
			vendor_name: 'Finbarr & CITS Academic Print Hub',
			listing_id: 'lst_thesis_hardcover',
			item_title: '3 Copies Final Thesis Hardcover Gold Embossing',
			category_id: 'cat_printing',
			agreed_price: 13500,
			scope: 'Produce 3 hardcover bound copies of undergraduate mechanical engineering final year thesis with gold spine text and department seal.',
			deliverables: ['3 Hardcover bound copies in Navy Blue', 'PDF proof inspection copy'],
			turnaround_description: '48 hours from submission of final print pages',
			due_at: pastDate(-2),
			milestones: [
				{ id: 'm1', title: 'Layout & Margin Proof Check', description: 'Student checks front cover spelling and page alignment', completed: true, completed_at: pastDate(1) },
				{ id: 'm2', title: 'Buckram Hardcover Pressing', description: 'Assembly of binder board and foil stamping', completed: false },
				{ id: 'm3', title: 'Final Inspection & Collection', description: 'Handover at CITS shop 14', completed: false }
			],
			status: 'agreed',
			payment: { status: 'not_started', amount: 13500, currency: 'NGN' },
			evidence_attachments: [],
			cancellation_terms: 'Either party may cancel free of charge before hard cover binding is commenced.',
			created_at: pastDate(2),
			updated_at: pastDate(1)
		},
		{
			_id: 'tx_demo_completed',
			buyer_id: 'usr_student_tunde',
			buyer_name: 'Tunde Bakare',
			vendor_id: 'vnd_tech_clinic',
			vendor_name: 'New Hall Tech Clinic',
			listing_id: 'lst_laptop_service',
			item_title: 'Thermal Overhaul & Fan Clean for Dell G15',
			category_id: 'cat_gadgets',
			agreed_price: 6500,
			scope: 'Internal dust extraction, thermal paste replacement and CPU stress test.',
			deliverables: ['Cleaned laptop chassis and silent fan', 'Benchmark temperature report'],
			turnaround_description: 'Same day',
			due_at: pastDate(7),
			milestones: [
				{ id: 'm1', title: 'Internal disassembly & inspection', description: 'Check fan bearings', completed: true, completed_at: pastDate(8) },
				{ id: 'm2', title: 'Thermal paste application', description: 'Arctic MX-4 applied', completed: true, completed_at: pastDate(8) },
				{ id: 'm3', title: 'Stress test & collection', description: 'Temperature remains under 74C', completed: true, completed_at: pastDate(7) }
			],
			status: 'completed',
			payment: { status: 'succeeded', amount: 6500, currency: 'NGN', provider_reference: 'BMONI_REF_DEMO_9981' },
			evidence_attachments: [
				{ id: 'ev_1', title: 'Stress Test Temperature Screenshot', url: '/uploads/demo-thermal-test.png', uploader: 'Engr. Segun Adeyemi', uploaded_at: pastDate(7) }
			],
			cancellation_terms: 'Full refund if diagnostics indicate unserviceable hardware.',
			created_at: pastDate(9),
			updated_at: pastDate(7)
		}
	];
	await Transaction.insertMany(transactions);

	// 7. Reviews
	const reviews = [
		{
			_id: 'rev_1',
			transaction_id: 'tx_demo_completed',
			reviewer_id: 'usr_student_tunde',
			reviewer_name: 'Tunde Bakare',
			vendor_id: 'vnd_tech_clinic',
			rating: 5,
			comment: 'Segun fixed my gaming laptop within 2 hours! Temperatures dropped from 96C to 72C. Very professional and honored the exact agreed price.',
			verified_purchase: true,
			created_at: pastDate(6)
		}
	];
	await Review.insertMany(reviews);

	// 8. Reports
	const reports = [
		{
			_id: 'rep_1',
			reporter_id: 'usr_student_chioma',
			reporter_name: 'Chioma Eze',
			target_type: 'listing',
			target_id: 'lst_laptop_screen',
			reason: 'Incorrect turnaround time listed',
			details: 'Vendor claimed 2 hours but when visited in person they mentioned parts need to come from Ikeja first.',
			status: 'pending',
			created_at: pastDate(1)
		}
	];
	await Report.insertMany(reports);

	// 9. Events
	const events = [
		{
			_id: 'evt_1',
			transaction_id: 'tx_demo_agreed',
			actor_id: 'usr_student_tunde',
			actor_name: 'Tunde Bakare',
			actor_role: 'student',
			event_type: 'created',
			details: 'Transaction draft created for 3 Copies Hardcover Thesis Embossing.',
			created_at: pastDate(2)
		},
		{
			_id: 'evt_2',
			transaction_id: 'tx_demo_agreed',
			actor_id: 'usr_vendor_ngozi',
			actor_name: 'Madam Ngozi Okonkwo',
			actor_role: 'vendor',
			event_type: 'agreement_proposed',
			details: 'Vendor confirmed turnaround and milestone schedule.',
			created_at: pastDate(2)
		},
		{
			_id: 'evt_3',
			transaction_id: 'tx_demo_agreed',
			actor_id: 'usr_student_tunde',
			actor_name: 'Tunde Bakare',
			actor_role: 'student',
			event_type: 'agreement_accepted',
			details: 'Buyer accepted terms. Agreement is active and awaiting payment.',
			created_at: pastDate(1)
		}
	];
	await TransactionEvent.insertMany(events);

	console.log('✅ Seed completed successfully in MongoDB with UNILAG campus data!');
}

if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
	seed()
		.then(() => process.exit(0))
		.catch((err) => {
			console.error('Seed failed:', err);
			process.exit(1);
		});
}
