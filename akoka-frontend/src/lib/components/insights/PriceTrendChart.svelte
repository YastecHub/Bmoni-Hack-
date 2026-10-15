<script lang="ts">
	import type { PriceObservation } from '$lib/types/models';
	let { observations }: { observations: PriceObservation[] } = $props();

	const chart = $derived.by(() => {
		const byDay = new Map<string, number[]>();
		for (const observation of observations) {
			if (observation.verification_status !== 'verified') continue;
			const day = new Date(observation.observed_at).toISOString().slice(0, 10);
			byDay.set(day, [...(byDay.get(day) ?? []), observation.amount]);
		}
		const rows = [...byDay.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, prices]) => {
			const sorted = [...prices].sort((a, b) => a - b);
			return { date, price: sorted[Math.floor(sorted.length / 2)], count: sorted.length };
		});
		if (rows.length < 3) return { rows, points: '', enough: false, min: 0, max: 0 };
		const min = Math.min(...rows.map((row) => row.price));
		const max = Math.max(...rows.map((row) => row.price));
		const spread = max - min || Math.max(max * 0.1, 1);
		const points = rows.map((row, index) => {
			const x = 42 + (index / (rows.length - 1)) * 676;
			const y = 174 - ((row.price - min) / spread) * 136;
			return `${x},${y}`;
		}).join(' ');
		return { rows, points, enough: true, min, max };
	});
</script>

<section class="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="price-trend-title">
	<div class="flex items-start justify-between gap-4">
		<div>
			<h2 id="price-trend-title" class="text-sm font-bold text-slate-900">Observed price over time</h2>
			<p class="text-xs text-slate-500 mt-1">Daily median of verified observations only</p>
		</div>
		<span class="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{chart.rows.length} date{chart.rows.length === 1 ? '' : 's'}</span>
	</div>
	{#if chart.enough}
		<div class="mt-4 overflow-hidden" role="img" aria-label="Line chart of verified median campus prices by day">
			<svg viewBox="0 0 760 220" class="w-full h-auto" preserveAspectRatio="none" aria-hidden="true">
				<line x1="42" y1="38" x2="718" y2="38" stroke="#e2e8f0" />
				<line x1="42" y1="106" x2="718" y2="106" stroke="#e2e8f0" />
				<line x1="42" y1="174" x2="718" y2="174" stroke="#cbd5e1" />
				<polyline points={chart.points} fill="none" stroke="#0369a1" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
				{#each chart.rows as row, index}
					{@const x = 42 + (index / (chart.rows.length - 1)) * 676}
					{@const spread = chart.max - chart.min || Math.max(chart.max * 0.1, 1)}
					{@const y = 174 - ((row.price - chart.min) / spread) * 136}
					<circle cx={x} cy={y} r="5" fill="#fff" stroke="#0369a1" stroke-width="3"><title>{row.date}: ₦{row.price.toLocaleString()} ({row.count} observation{row.count === 1 ? '' : 's'})</title></circle>
				{/each}
			</svg>
		</div>
		<div class="flex justify-between text-[10px] font-mono text-slate-400"><span>{chart.rows[0].date}</span><span>{chart.rows.at(-1)?.date}</span></div>
	{:else}
		<div class="mt-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 p-5 text-xs text-slate-500">
			A trend chart appears after verified observations cover at least three different dates. No values are invented.
		</div>
	{/if}
</section>
