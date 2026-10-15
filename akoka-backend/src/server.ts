import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

import { config } from './config.js';
import { connectMongoDB } from './db/mongodb.js';
import { seed } from './db/seed.js';
import { authenticate } from './middleware/auth.js';

import { authRouter } from './routes/auth.routes.js';
import { categoriesRouter } from './routes/categories.routes.js';
import { listingsRouter } from './routes/listings.routes.js';
import { vendorsRouter } from './routes/vendors.routes.js';
import { insightsRouter } from './routes/insights.routes.js';
import { transactionsRouter } from './routes/transactions.routes.js';
import { paymentsRouter } from './routes/payments.routes.js';
import { reportsRouter } from './routes/reports.routes.js';
import { adminRouter } from './routes/admin.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// 1. CORS Configuration supporting Vercel and localhost
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin) return callback(null, true);

			if (
				config.frontendUrls.includes(origin) ||
				origin.startsWith('http://localhost:') ||
				origin.startsWith('http://127.0.0.1:') ||
				origin.endsWith('.vercel.app')
			) {
				return callback(null, true);
			}

			callback(null, true); // Permissive fallback for preview deployments
		},
		credentials: true,
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
	})
);

// 2. Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 3. User Authentication Context
app.use(authenticate);

// 4. Static Uploads Serving
app.use('/uploads', express.static(config.uploadsDir));

// 5. Health Check & Environment Status
const statusHandler = (_req: express.Request, res: express.Response) => {
	const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
	const dbState = dbStates[mongoose.connection.readyState] || 'unknown';

	res.json({
		status: 'ok',
		app: 'AKOKA Campus Commerce & Price Intelligence API',
		market: 'University of Lagos (UNILAG)',
		db: 'MongoDB',
		db_connected: mongoose.connection.readyState === 1,
		db_state: dbState,
		platform: process.env.VERCEL ? 'Vercel Serverless' : 'Node.js',
		version: '1.0.0',
		endpoints: {
			health: '/health',
			auth: '/api/auth',
			listings: '/api/listings',
			vendors: '/api/vendors',
			priceInsights: '/api/price-insights',
			transactions: '/api/transactions',
			payments: '/api/payments',
			reports: '/api/reports',
			admin: '/api/admin'
		},
		timestamp: new Date().toISOString()
	});
};

app.get('/', statusHandler);
app.get('/api', statusHandler);
app.get('/health', statusHandler);
app.get('/api/health', statusHandler);

// 6. API Router Setup
const apiRouter = express.Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/listings', listingsRouter);
apiRouter.use('/vendors', vendorsRouter);
apiRouter.use('/', insightsRouter); // /price-insights & /price-observations
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/payments', paymentsRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/admin', adminRouter);

// Mount under both `/api` (standard for Vercel & REST) and `/` (direct calls)
app.use('/api', apiRouter);
app.use('/', apiRouter);

// 7. Global 404 Handler
app.use((req, res) => {
	res.status(404).json({
		error: `Route not found: ${req.method} ${req.originalUrl}`
	});
});

// 8. Global Error Handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Unhandled server error:', err);
	res.status(err.status || 500).json({
		error: err.message || 'Internal Server Error'
	});
});

// 9. Startup & Initialization (for local development or persistent server)
export async function initApp() {
	try {
		await connectMongoDB();
		await seed();
	} catch (error) {
		console.error('Database connection/seed error:', error);
	}
}

// In standard Node.js environments (not Vercel serverless), start HTTP listener
if (!process.env.VERCEL) {
	initApp().then(() => {
		app.listen(config.port, () => {
			console.log(`\n======================================================`);
			console.log(`🚀 AKOKA Backend API running on http://localhost:${config.port}`);
			console.log(`📦 Database Engine: MongoDB`);
			console.log(`📍 Market: UNILAG Campus Axis`);
			console.log(`🛡️  Payment Mode: ${config.paymentMode.toUpperCase()}`);
			console.log(`======================================================\n`);
		});
	});
}

export default app;
