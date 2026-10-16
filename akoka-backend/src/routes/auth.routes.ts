import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, VendorProfile } from '../db/models/index.js';
import {
	AuthRequest,
	generateToken,
	setAuthCookie,
	clearAuthCookie,
	requireAuth
} from '../middleware/auth.js';
import type { User as UserType } from '../types/index.js';

export const authRouter = Router();

// GET /auth/me
authRouter.get('/me', requireAuth, (req: AuthRequest, res: Response) => {
	const safeUser: any = { ...req.user };
	delete safeUser.password_hash;
	res.json({
		user: safeUser,
		...safeUser
	});
});

// POST /auth/login
authRouter.post('/login', async (req: AuthRequest, res: Response) => {
	try {
		const { email, password } = req.body;

		if (!email || !password) {
			res.status(400).json({ error: 'Please provide both email and password.' });
			return;
		}

		const userRecord = await User.findOne({ email: email.trim().toLowerCase() });

		if (!userRecord) {
			res.status(401).json({ error: 'Invalid email or password.' });
			return;
		}

		if (userRecord.account_status !== 'active') {
			res.status(403).json({ error: 'Account is suspended or pending verification.' });
			return;
		}

		const passwordMatch = await bcrypt.compare(password, userRecord.password_hash);
		if (!passwordMatch) {
			res.status(401).json({ error: 'Invalid email or password.' });
			return;
		}

		const safeUser: any = userRecord.toJSON();
		delete safeUser.password_hash;

		const token = generateToken(safeUser);
		setAuthCookie(res, token);

		res.json({
			token,
			user: safeUser,
			...safeUser
		});
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({ error: 'Failed to sign in. Please try again.' });
	}
});

// POST /auth/register
authRouter.post('/register', async (req: AuthRequest, res: Response) => {
	try {
		const { name, email, password, role, phone, campus_zone } = req.body;

		if (!name || !email || !password || !role) {
			res.status(400).json({ error: 'Name, email, password, and role are required.' });
			return;
		}

		if (!['student', 'vendor'].includes(role)) {
			res.status(400).json({ error: 'Registration is permitted for students and vendors only.' });
			return;
		}

		const existing = await User.findOne({ email: email.trim().toLowerCase() });
		if (existing) {
			res.status(409).json({ error: 'An account with this email already exists.' });
			return;
		}

		const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
		const now = new Date().toISOString();
		const passwordHash = await bcrypt.hash(password, 10);
		const userZone = campus_zone || 'new_hall';

		const newUserDoc = await User.create({
			_id: userId,
			display_name: name.trim(),
			email: email.trim().toLowerCase(),
			password_hash: passwordHash,
			matric_or_phone: phone || '',
			role,
			campus_zone: userZone,
			created_at: now,
			account_status: 'active'
		});

		// If vendor, automatically link an initial vendor profile
		if (role === 'vendor') {
			const vendorId = `vnd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
			await VendorProfile.create({
				_id: vendorId,
				user_id: userId,
				business_name: `${name.trim()}'s Services`,
				tagline: 'Quality campus service provider',
				categories: [],
				service_area: `${userZone} Campus Area`,
				campus_zone: userZone,
				physical_spot: 'UNILAG Campus Axis',
				verification_status: 'vendor_confirmed',
				phone: phone || '',
				whatsapp: phone ? `234${phone.replace(/^0/, '')}` : '',
				operational_hours: '8:00 AM - 7:00 PM',
				rating: 5.0,
				review_count: 0,
				completed_transactions_count: 0,
				price_integrity_score: 95,
				bio: `Campus vendor registered on AKOKA.`
			});
		}

		const safeUser: any = newUserDoc.toJSON();
		delete safeUser.password_hash;

		const token = generateToken(safeUser);
		setAuthCookie(res, token);

		res.status(201).json({
			token,
			user: safeUser,
			...safeUser
		});
	} catch (error) {
		console.error('Registration error:', error);
		res.status(500).json({ error: 'Failed to create account.' });
	}
});

// POST /auth/logout
authRouter.post('/logout', (_req: AuthRequest, res: Response) => {
	clearAuthCookie(res);
	res.status(200).json({ success: true, message: 'Logged out successfully.' });
});
