/**
 * AKOKA API Client
 * Browser API client. Authentication is cookie-based so provider secrets stay on the server.
 */

export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	meta?: Record<string, any>;
}

export class ApiClient {
	private baseUrl: string;
	readonly backendConfigured: boolean;

	constructor(baseUrl: string = import.meta.env.PUBLIC_API_BASE_URL || '/api') {
		this.backendConfigured = Boolean(import.meta.env.PUBLIC_API_BASE_URL);
		this.baseUrl = baseUrl.replace(/\/$/, '');
	}

	private async request<T>(endpoint: string, init: RequestInit = {}): Promise<T> {
		if (!this.backendConfigured) throw new Error('The AKOKA backend URL is not configured.');
		const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
	}

	async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
		let url = `${this.baseUrl}${endpoint}`;
		if (params) {
			const search = new URLSearchParams();
			Object.entries(params).forEach(([key, value]) => {
				if (value !== undefined && value !== null && value !== '') {
					search.append(key, String(value));
				}
			});
			const queryString = search.toString();
			if (queryString) {
				url += `?${queryString}`;
			}
		}

		return this.request<T>(url.slice(this.baseUrl.length));
	}

	async post<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
	}

	async patch<T>(endpoint: string, body?: any): Promise<T> {
		return this.request<T>(endpoint, { method: 'PATCH', body: body === undefined ? undefined : JSON.stringify(body) });
	}

	async postForm<T>(endpoint: string, form: FormData): Promise<T> {
		return this.request<T>(endpoint, { method: 'POST', body: form });
	}
}

export const apiClient = new ApiClient();

