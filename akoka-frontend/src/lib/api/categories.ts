import { apiClient } from './client';
import type { Category } from '../types/models';

export async function fetchCategories(): Promise<Category[]> {
	return apiClient.get<Category[]>('/categories');
}
