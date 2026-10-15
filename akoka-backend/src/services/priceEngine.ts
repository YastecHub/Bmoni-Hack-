import { Category, PriceObservation } from '../db/models/index.js';
import type { PriceInsight, PriceObservation as PriceObservationType, ConfidenceLevel } from '../types/index.js';

export async function calculatePriceInsight(categoryId: string, itemSpec?: string): Promise<PriceInsight> {
	const category = await Category.findById(categoryId);

	if (!category) {
		throw new Error(`Category not found: ${categoryId}`);
	}

	const typicalSpecs: string[] = category.typical_item_specs || [];
	const targetSpec = itemSpec || typicalSpecs[0] || '';

	const filter: any = {
		category_id: categoryId,
		verification_status: 'verified'
	};

	if (targetSpec) {
		filter.item_specification = targetSpec;
	}

	const docs = await PriceObservation.find(filter).sort({ observed_at: -1 });
	const observations: PriceObservationType[] = docs.map((d) => d.toJSON());

	const sampleSize = observations.length;

	// Insufficient data: < 3 observations
	if (sampleSize < 3) {
		return {
			category_id: category.id,
			category_name: category.name,
			item_specification: targetSpec,
			sample_size: sampleSize,
			median_price: null,
			range_low: null,
			range_high: null,
			confidence_level: 'insufficient_data',
			confidence_reason: `Insufficient data: only ${sampleSize} verified observation${sampleSize === 1 ? '' : 's'} recorded. At least 3 independent data points are required before calculating a reliable campus benchmark.`,
			freshness_days: 0,
			recent_trend: 'stable',
			comparable_observations: observations
		};
	}

	const prices = observations.map((o) => o.amount).sort((a, b) => a - b);
	const median =
		prices.length % 2 === 0
			? Math.round((prices[prices.length / 2 - 1] + prices[prices.length / 2]) / 2)
			: prices[Math.floor(prices.length / 2)];

	const rangeLow = prices[0];
	const rangeHigh = prices[prices.length - 1];

	const now = Date.now();
	const daysAges = observations.map((o) => {
		const observedTime = new Date(o.observed_at).getTime();
		return Math.max(0, Math.floor((now - observedTime) / (1000 * 60 * 60 * 24)));
	});
	const freshnessDays = Math.round(daysAges.reduce((sum, d) => sum + d, 0) / sampleSize);

	const mean = prices.reduce((sum, p) => sum + p, 0) / sampleSize;
	const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / sampleSize;
	const stdDev = Math.sqrt(variance);
	const cv = mean > 0 ? stdDev / mean : 0;

	const sources = new Set(observations.map((o) => o.source_type));
	const hasVendorConfirmed = sources.has('vendor_confirmed') || sources.has('receipt_supported');

	let confidenceLevel: ConfidenceLevel = 'low';
	let confidenceReason = '';

	if (sampleSize >= 5 && cv <= 0.25 && freshnessDays <= 14) {
		confidenceLevel = 'high';
		confidenceReason = `High confidence: ${sampleSize} recent observations across campus with tight price consensus (±${Math.round(cv * 100)}% variance) and ${hasVendorConfirmed ? 'vendor confirmation' : 'verified student audits'}.`;
	} else if (sampleSize >= 3 && cv <= 0.40 && freshnessDays <= 30) {
		confidenceLevel = 'moderate';
		confidenceReason = `Moderate confidence: ${sampleSize} observations collected within 30 days. Moderate variation observed across campus zones.`;
	} else {
		confidenceLevel = 'low';
		confidenceReason = `Low confidence: data points exhibit wide pricing disparity or older confirmation dates. Use as an estimate only.`;
	}

	const chronological = [...observations].sort(
		(a, b) => new Date(a.observed_at).getTime() - new Date(b.observed_at).getTime()
	);
	const half = Math.floor(chronological.length / 2);
	const firstHalf = chronological.slice(0, half).map((o) => o.amount);
	const secondHalf = chronological.slice(half).map((o) => o.amount);

	const avg1 = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : median;
	const avg2 = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : median;

	let recentTrend: 'stable' | 'increasing' | 'decreasing' | 'volatile' = 'stable';
	if (cv > 0.45) {
		recentTrend = 'volatile';
	} else if (avg2 > avg1 * 1.05) {
		recentTrend = 'increasing';
	} else if (avg2 < avg1 * 0.95) {
		recentTrend = 'decreasing';
	}

	return {
		category_id: category.id,
		category_name: category.name,
		item_specification: targetSpec,
		sample_size: sampleSize,
		median_price: median,
		range_low: rangeLow,
		range_high: rangeHigh,
		confidence_level: confidenceLevel,
		confidence_reason: confidenceReason,
		freshness_days: freshnessDays,
		recent_trend: recentTrend,
		comparable_observations: observations
	};
}
