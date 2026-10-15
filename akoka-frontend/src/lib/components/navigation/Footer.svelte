<script lang="ts">
	import { IconShieldCheck, IconLock, IconScale, IconMapPin } from '$lib/components/icons';
</script>

<footer class="mt-auto bg-slate-950 text-slate-400 text-xs border-t border-slate-800">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
			<!-- Col 1: Identity & Thesis -->
			<div class="space-y-3 md:col-span-1">
				<div class="flex items-center gap-2 text-white font-extrabold text-base tracking-tight">
					<div class="w-6 h-6 rounded-lg bg-akoka-600 flex items-center justify-center text-xs">A</div>
					<span>AKOKA</span>
				</div>
				<p class="text-slate-400 text-xs leading-relaxed">
					The Intelligence Layer for Campus Commerce. Helping students compare verified prices, choose trustworthy providers, and document terms before transactions begin.
				</p>
				<div class="flex items-center gap-1.5 text-[11px] text-slate-300">
					<IconMapPin size={13} class="text-emerald-400 shrink-0" />
					<span>Initial Pilot: University of Lagos (Akoka, Lagos)</span>
				</div>
			</div>

			<!-- Col 2: Campus Zones -->
			<div class="space-y-2">
				<h5 class="text-white font-semibold text-xs uppercase tracking-wider">Pilot Coverage</h5>
				<ul class="space-y-1.5 text-xs text-slate-400">
					<li>New Hall Shopping Quad</li>
					<li>CITS & Commercial Centre</li>
					<li>Faculty of Science Concourse</li>
					<li>Bariga Gate & St. Finbarr’s</li>
					<li>Moremi / Amina Walkway</li>
					<li>Jaja Clinic & Sports Axis</li>
				</ul>
			</div>

			<!-- Col 3: Product Distinction -->
			<div class="space-y-2">
				<h5 class="text-white font-semibold text-xs uppercase tracking-wider">Architecture</h5>
				<ul class="space-y-1.5 text-xs text-slate-400">
					<li>Price Intelligence & Normalization</li>
					<li>Confidence Indicators (IQR/Median)</li>
					<li>Evidence-Informed Vendor Profiles</li>
					<li>Documented Agreement Timeline</li>
					<li>Audit & Moderation Desk</li>
				</ul>
			</div>

			<!-- Col 4: Trust & Compliance Guardrails -->
			<div class="space-y-2.5">
				<h5 class="text-white font-semibold text-xs uppercase tracking-wider">Payments</h5>
				<div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-[11px] leading-relaxed">
					<div class="flex items-center gap-1.5 font-semibold text-sky-300"><IconLock size={13} /><span>Backend-managed checkout</span></div>
					<p class="text-slate-400">Payment status is confirmed by the connected backend and its fintech provider.</p>
				</div>
			</div>
		</div>

		<!-- Bottom Legal & Hackathon Credit -->
		<div class="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
			<div>
				© 2026 AKOKA Project. Prepared for Hackathon Evaluation & MVP Demonstration.
			</div>
			<div class="flex items-center gap-4">
				<span>Designed for Clean Code & SvelteKit 5 Runes</span>
				<span>•</span>
				<span class="text-emerald-400">UNILAG Pilot Ready</span>
			</div>
		</div>
	</div>
</footer>
