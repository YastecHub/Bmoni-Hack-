/**
 * AKOKA API Client
 * Browser API client. Authentication is cookie-based so provider secrets stay on the server.
 */

const defaultBaseUrl = import.meta.env.PROD
	? 'https://akoka-backend.vercel.app/api'
	: 'http://localhost:5000/api';

const resolvedBaseUrl =
	(typeof import.meta !== 'undefined' &&
		(import.meta.env?.PUBLIC_API_BASE_URL || import.meta.env?.VITE_PUBLIC_API_BASE_URL)) ||
	defaultBaseUrl;

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	meta?: Record<string, any>;
}

export class ApiClient {
	private baseUrl: string;
	readonly backendConfigured: boolean;

	constructor(baseUrl?: string) {
		const targetUrl = baseUrl || resolvedBaseUrl;
		this.baseUrl = targetUrl.replace(/\/$/, '');
		this.backendConfigured = true;
	}

	getBaseUrl(): string {
		return this.baseUrl;
	}

	private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
		try {
			const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
			const response = await fetch(`${this.baseUrl}${cleanEndpoint}`, {
				...init,
				credentials: 'include',
				headers: {
					Accept: 'application/json',
					...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
					...init.headers
				}
			});

			const text = response.status === 204 ? '' : await response.text();
			let payload: any = undefined;
			if (text) {
				try {
					payload = JSON.parse(text);
				} catch {
					payload = text;
				}
			}

			if (!response.ok) {
				const message = payload?.message || payload?.error || `${response.status} ${response.statusText}`;
				throw new Error(String(message));
			}

			return payload as T;
		} catch (err: any) {
			if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
				throw new Error(`Unable to reach AKOKA API at ${this.baseUrl}. Please verify your connection.`);
			}
			throw err;
		}
	}

	async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
		let url = endpoint;
		if (params) {
			const search = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					search.append(key, String(value));
				}
			});
			const queryString = search.toString();
			if (queryString) {
				url += `${endpoint.includes('?') ? '&' : '?'}${queryString}`;
			}
		}

		return this.request<T>(url);
	}

	async post<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'POST',
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	}

	async patch<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, {
			method: 'PATCH',
			body: body === undefined ? undefined : JSON.stringify(body)
		});
	}

	async postForm<T>(endpoint: string, form: FormData): Promise<T> {
		return this.request<T>(endpoint, { method: 'POST', body: form });
	}
}

export const apiClient = new ApiClient();
