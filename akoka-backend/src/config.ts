import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
	port: Number(process.env.PORT) || 5000,
	nodeEnv: process.env.NODE_ENV || 'development',
	frontendUrls: (process.env.FRONTEND_URLS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173')
		.split(',')
		.map((u) => u.trim()),
	jwtSecret: process.env.JWT_SECRET || 'akoka_super_secret_jwt_key_unilag_2026_hackathon',
	cookieSecret: process.env.COOKIE_SECRET || 'akoka_super_secret_cookie_key_unilag',
	databaseFile: path.resolve(__dirname, '../../', process.env.DATABASE_FILE || 'akoka.db'),
	mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/akoka',
	uploadsDir: path.resolve(__dirname, '../uploads'),
	paymentMode: process.env.PAYMENT_MODE || 'simulated',
	bmoniApiKey: process.env.BMONI_API_KEY || '',
	bmoniPublicKey: process.env.BMONI_PUBLIC_KEY || ''
};
