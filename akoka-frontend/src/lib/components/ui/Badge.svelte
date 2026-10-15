<script lang="ts">
	let {
		variant = 'neutral',
		size = 'md',
		class: className = '',
		children
	}: {
		variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
		size?: 'sm' | 'md' | 'lg';
		class?: string;
		children?: any;
	} = $props();

	const variantStyles = {
		primary: 'bg-akoka-50 text-akoka-700 border-akoka-200',
		success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
		warning: 'bg-amber-50 text-amber-700 border-amber-200',
		danger: 'bg-rose-50 text-rose-700 border-rose-200',
		neutral: 'bg-slate-100 text-slate-700 border-slate-200',
		outline: 'bg-transparent text-slate-600 border-slate-300'
	};

	const sizeStyles = {
		sm: 'text-xs px-2 py-0.5 font-medium',
		md: 'text-xs px-2.5 py-1 font-medium',
		lg: 'text-sm px-3 py-1.5 font-semibold'
	};
</script>

<span
	class="inline-flex items-center gap-1.5 rounded-full border transition-colors {variantStyles[variant]} {sizeStyles[size]} {className}"
>
	{#if children}
		{@render children()}
	{/if}
</span>
