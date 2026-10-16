import type { User } from '$lib/types/models';
import { apiClient, setStoredToken, getStoredToken } from './client';

export interface RegisterPayload {
	name: string;
	email: string;
	password: string;
	role: 'student' | 'vendor';
	phone?: string;
	campus_zone?: string;
}

export interface AuthResponse {
	user?: User;
	token?: string;
	id?: string;
	email?: string;
	role?: 'student' | 'vendor' | 'admin';
	display_name?: string;
	[key: string]: any;
}

function unwrapUser(payload: any): User {
	if (!payload) {
		throw new Error('Empty response received from authentication service.');
	}

	if (payload.token) {
		setStoredToken(payload.token);
	}

	return payload.user ? payload.user : payload;
}

export async function signIn(email: string, password: string): Promise<User> {
	const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
	return unwrapUser(res);
}

export async function registerAccount(data: RegisterPayload): Promise<User> {
	const res = await apiClient.post<AuthResponse>('/auth/register', data);
	return unwrapUser(res);
}

export async function fetchCurrentUser(): Promise<User> {
	const res = await apiClient.get<AuthResponse>('/auth/me');
	return unwrapUser(res);
}

export async function signOut(): Promise<void> {
	try {
		await apiClient.post<void>('/auth/logout');
	} finally {
		setStoredToken(null);
	}
}

export { getStoredToken };
