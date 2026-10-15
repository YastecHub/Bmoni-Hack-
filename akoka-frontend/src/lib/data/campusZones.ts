export interface CampusZone {
	id: string;
	name: string;
	shortName: string;
	description: string;
	landmark: string;
}

export const UNILAG_CAMPUS_ZONES: CampusZone[] = [
	{
		id: 'new_hall',
		name: 'New Hall Complex',
		shortName: 'New Hall',
		description: 'High-density student hub with food kiosks, printing centres & gadget repairs',
		landmark: 'Beside Madam Mango & New Hall Quadrangle'
	},
	{
		id: 'cits_commercial',
		name: 'CITS & Commercial Centre',
		shortName: 'CITS',
		description: 'Primary tech and typing hub, thesis spiral binding & certified photocopies',
		landmark: 'Opposite Faculty of Education'
	},
	{
		id: 'science_eng',
		name: 'Science & Engineering Concourse',
		shortName: 'Science / Eng',
		description: 'Calculators, architectural drafting supplies, technical printing & electronics',
		landmark: 'Faculty of Engineering Annex'
	},
	{
		id: 'bariga_gate',
		name: 'Bariga Gate & St. Finbarr’s Axis',
		shortName: 'Bariga Gate',
		description: 'Tailoring shops, bulk laundry depots & off-campus student accommodation services',
		landmark: 'Outside UNILAG 2nd Gate'
	},
	{
		id: 'moremi_amina',
		name: 'Moremi & Amina Hall Axis',
		shortName: 'Moremi / Amina',
		description: 'Hairdressing, braiding, cosmetics, fashion alterations & custom tote bags',
		landmark: 'Between Moremi Car Park and Honours Hall'
	},
	{
		id: 'fagunwa_mariere',
		name: 'Fagunwa & Mariere Axis',
		shortName: 'Fagunwa / Mariere',
		description: 'Quick laundry drop-offs, shoe repair cobblers and evening food spots',
		landmark: 'Near Mariere Car Park'
	},
	{
		id: 'jaja_sports',
		name: 'Jaja Clinic & Sports Center Complex',
		shortName: 'Jaja / Sports',
		description: 'Pharmacy support, health essentials, hydration packs and fitness kits',
		landmark: 'Opposite UNILAG Medical Center'
	}
];
