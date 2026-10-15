import { apiClient } from './client';
import type { Listing } from '../types/models';

export interface ListingFilterParams {
	category?: string;
	area?: string;
	maxPrice?: number;
	search?: string;
}

export async function fetchListings(filters?: ListingFilterParams): Promise<Listing[]> {
	return apiClient.get<Listing[]>('/listings', filters);
}

export async function fetchListingById(id: string): Promise<Listing | undefined> {
	return apiClient.get<Listing>(`/listings/${id}`);
}

export type ListingInput = Pick<Listing, 'category_id' | 'title' | 'description' | 'price' | 'unit' | 'turnaround_time' | 'inclusions' | 'exclusions' | 'availability'>;

/** Vendor identity is derived from the authenticated session by the backend. */
export const createListing = (input: ListingInput) => apiClient.post<Listing>('/listings', input);
export const updateListing = (id: string, input: ListingInput) => apiClient.patch<Listing>(`/listings/${encodeURIComponent(id)}`, input);

