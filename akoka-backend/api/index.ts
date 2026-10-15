import app, { initApp } from '../src/server.js';

let isInitialized = false;

export default async function handler(req: any, res: any) {
	if (!isInitialized) {
		try {
			await initApp();
			isInitialized = true;
		} catch (err) {
			console.error('Initialization error during serverless invocation:', err);
		}
	}
	return app(req, res);
}
