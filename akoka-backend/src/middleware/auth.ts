import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../db/models/index.js';
import type { User as UserType, UserRole } from '../types/index.js';

export interface AuthRequest extends Request {
	user?: UserType;
}

export function generateToken(user: UserType): string {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			role: user.role,
			display_name: user.display_name
		},
		config.jwtSecret,
		{ expiresIn: '7d' }
	);
}

export function setAuthCookie(res: Response, token: string): void {
	res.cookie('akoka_token', token, {
		httpOnly: true,
		secure: config.nodeEnv === 'production',
		sameSite: 'lax',
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
		path: '/'
	});
}

export function clearAuthCookie(res: Response): void {
	res.clearCookie('akoka_token', {
		httpOnly: true,
		secure: config.nodeEnv === 'production',
		sameSite: 'lax',
		path: '/'
	});
}

export async function authenticate(req: AuthRequest, _res: Response, next: NextFunction): Promise<void> {
	const token =
		req.cookies?.akoka_token ||
		(req.headers.authorization?.startsWith('Bearer ')
			? req.headers.authorization.slice(7)
			: undefined);

	if (!token) {
		return next();
	}

	try {
		const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
		const userDoc = await User.findById(decoded.id);

		if (userDoc && userDoc.account_status === 'active') {
			req.user = userDoc.toJSON();
		}
	} catch {
		// Invalid or expired token - proceed as unauthenticated
	}

	next();
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
	if (!req.user) {
		res.status(401).json({ error: 'Authentication required. Please sign in.' });
		return;
	}
	next();
}

export function requireRole(...roles: UserRole[]) {
	return (req: AuthRequest, res: Response, next: NextFunction): void => {
		if (!req.user) {
			res.status(401).json({ error: 'Authentication required.' });
			return;
		}

		if (!roles.includes(req.user.role)) {
			res.status(403).json({
				error: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
			});
			return;
		}

		next();
	};
}
