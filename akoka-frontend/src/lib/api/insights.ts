import { apiClient } from './client';
import type { PriceInsight, PriceObservation } from '../types/models';

export async function fetchPriceInsights(params: {
	category: string;
	itemSpec?: string;
}): Promise<PriceInsight> {
	return apiClient.get<PriceInsight>('/price-insights', params);
}

export async function submitPriceObservation(
	observation: Omit<PriceObservation, 'id' | 'observed_at' | 'last_confirmed_at' | 'verification_status'>
): Promise<PriceObservation> {
	return apiClient.post<PriceObservation>('/price-observations', observation);
}

export async function fetchObservations(categoryId?: string): Promise<PriceObservation[]> {
	return apiClient.get<PriceObservation[]>('/price-observations', { category: categoryId });
}
