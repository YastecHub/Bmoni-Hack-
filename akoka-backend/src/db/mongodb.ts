import mongoose from 'mongoose';
import { config } from '../config.js';

interface MongooseCache {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
}

declare global {
	var __mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.__mongooseCache || { conn: null, promise: null };

if (!global.__mongooseCache) {
	global.__mongooseCache = cached;
}

export async function connectMongoDB(): Promise<typeof mongoose> {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts: mongoose.ConnectOptions = {
			bufferCommands: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000
		};

		console.log(`Connecting to MongoDB at: ${config.mongodbUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

		cached.promise = mongoose
			.connect(config.mongodbUri, opts)
			.then((m) => {
				console.log('Connected to MongoDB successfully.');
				return m;
			})
			.catch((err) => {
				cached.promise = null;
				console.error('MongoDB connection error:', err.message);
				throw err;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}
