import { apiClient } from './client';
import type { Report } from '../types/models';

export async function submitReport(
	report: Omit<Report, 'id' | 'created_at' | 'status' | 'reporter_id' | 'reporter_name'>
): Promise<Report> {
	return apiClient.post<Report>('/reports', report);
}
