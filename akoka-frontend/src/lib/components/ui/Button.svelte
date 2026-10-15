<script lang="ts">
	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		loading = false,
		class: className = '',
		onclick,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		loading?: boolean;
		class?: string;
		onclick?: (e: MouseEvent) => void;
		children?: any;
	} = $props();

	const variantStyles = {
		primary:
			'bg-akoka-600 hover:bg-akoka-700 active:bg-akoka-800 text-white shadow-sm hover:shadow border border-akoka-700/20 focus-visible:ring-akoka-500',
		secondary:
			'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-sm hover:shadow border border-slate-800 focus-visible:ring-slate-700',
		outline:
			'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 focus-visible:ring-slate-400 active:bg-slate-100 shadow-sm',
		ghost:
			'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200 border border-transparent focus-visible:ring-slate-400',
		danger:
			'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm border border-rose-700/20 focus-visible:ring-rose-500',
		success:
			'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm border border-emerald-700/20 focus-visible:ring-emerald-500'
	};

	const sizeStyles = {
		sm: 'text-xs px-2.5 py-1.5 rounded-lg gap-1.5 font-medium',
		md: 'text-sm px-4 py-2 rounded-xl gap-2 font-medium',
		lg: 'text-base px-5 py-2.5 rounded-xl gap-2.5 font-semibold'
	};
</script>

<button
	{type}
	{disabled}
	{onclick}
	class="inline-flex items-center justify-center transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer {variantStyles[
		variant
	]} {sizeStyles[size]} {className}"
>
	{#if loading}
		<svg
			class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
		>
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path
				class="opacity-75"
				fill="currentColor"
				d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
			></path>
		</svg>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</button>
