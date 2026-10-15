import type { User } from '$lib/types/models';
import { apiClient } from './client';

export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
	role: 'student' | 'vendor';
	phone?: string;
	campus_zone?: string;
}

function unwrapUser(payload: User | { user: User }): User {
	return 'user' in payload ? payload.user : payload;
}

export async function signIn(email: string, password: string): Promise<User> {
	return unwrapUser(await apiClient.post<User | { user: User }>('/auth/login', { email, password }));
}

export async function registerAccount(data: RegisterPayload): Promise<User> {
	return unwrapUser(await apiClient.post<User | { user: User }>('/auth/register', data));
}

export async function fetchCurrentUser(): Promise<User> {
	return unwrapUser(await apiClient.get<User | { user: User }>('/auth/me'));
}

export async function signOut(): Promise<void> {
	await apiClient.post<void>('/auth/logout');
}
