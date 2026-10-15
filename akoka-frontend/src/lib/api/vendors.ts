import { apiClient } from './client';
import type { VendorProfile, Review, Listing } from '../types/models';

export interface VendorDetails { vendor: VendorProfile; listings: Listing[]; reviews: Review[] }

export async function fetchVendors(): Promise<VendorProfile[]> {
	return apiClient.get<VendorProfile[]>('/vendors');
}

export async function fetchVendorById(id: string): Promise<VendorProfile | undefined> {
	return apiClient.get<VendorProfile>(`/vendors/${encodeURIComponent(id)}`);
}

export async function fetchVendorReviews(id: string): Promise<Review[]> {
	return apiClient.get<Review[]>(`/vendors/${encodeURIComponent(id)}/reviews`);
}

export const fetchVendor = (id: string) => apiClient.get<VendorDetails>(`/vendors/${encodeURIComponent(id)}`);

export function submitTransactionReview(transactionId: string, rating: number, comment: string): Promise<Review> {
	return apiClient.post<Review>(`/transactions/${encodeURIComponent(transactionId)}/review`, { rating, comment });
}
