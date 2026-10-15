import { writable } from 'svelte/store';

export interface Toast {
	id: string;
	title: string;
	message: string;
	type: 'success' | 'info' | 'warning' | 'error';
	duration?: number;
}

function createNotificationStore() {
	const { subscribe, update } = writable<Toast[]>([]);

	return {
		subscribe,
		show: (toast: Omit<Toast, 'id'>) => {
			const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
			const newToast: Toast = { ...toast, id };

			update((all) => [...all, newToast]);

			const duration = toast.duration ?? 4500;
			setTimeout(() => {
				update((all) => all.filter((t) => t.id !== id));
			}, duration);
		},
		dismiss: (id: string) => {
			update((all) => all.filter((t) => t.id !== id));
		}
	};
}

export const toast = createNotificationStore();
