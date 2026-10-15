import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { config } from '../config.js';

if (!fs.existsSync(config.uploadsDir)) {
	fs.mkdirSync(config.uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => {
		cb(null, config.uploadsDir);
	},
	filename: (_req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const ext = path.extname(file.originalname).toLowerCase();
		cb(null, `evidence-${uniqueSuffix}${ext}`);
	}
});

const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export const uploadEvidence = multer({
	storage,
	limits: {
		fileSize: 10 * 1024 * 1024 // 10 MB limit as stated in the frontend
	},
	fileFilter: (_req, file, cb) => {
		if (allowedMimeTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Invalid file type. Only JPG, PNG, WebP, and PDF are allowed.'));
		}
	}
});
