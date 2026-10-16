import { writable } from 'svelte/store';
import type { User, UserRole } from '../types/models';
import { setStoredToken } from '../api/client';

export const authStore = writable<User | null>(null);
export const authLoading = writable(false);

export function setAuthenticatedUser(user: User) {
	authStore.set(user);
}

export function clearAuthenticatedUser() {
	setStoredToken(null);
	authStore.set(null);
}

export function dashboardPathForRole(role: UserRole): string {
	return role === 'admin' ? '/admin' : role === 'vendor' ? '/vendor' : '/student';
}
