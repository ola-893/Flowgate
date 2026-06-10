/**
 * StreamEngine Provider Registry
 * 
 * Off-chain registry for the hackathon demo. Providers register their
 * premium API endpoints here with pricing. In production, this would
 * be backed by on-chain Listing objects from registry.move.
 */

export interface ProviderListing {
    id: string;
    providerAddress: string;   // Sui address that receives stream payments
    name: string;              // "Alpha Signals Inc."
    endpoint: string;          // "/api/premium/alpha-signals/v1/btc"
    ratePerSecond: string;     // In SUI (e.g. "0.0001")
    description: string;
    category: string;
    registeredAt: string;
}

const MIST_PER_SUI = 1_000_000_000;

// In-memory registry (seeded with demo providers)
const registry: ProviderListing[] = [
    {
        id: 'provider-alpha-signals',
        providerAddress: '0x0000000000000000000000000000000000000000000000000000000000001234',
        name: 'Alpha Signals Inc.',
        endpoint: '/api/premium/alpha-signals/v1/btc',
        ratePerSecond: '0.0001',
        description: 'Proprietary high-frequency trading signals for BTC, derived from on-chain whale activity, options flow, and funding rates.',
        category: 'Finance',
        registeredAt: new Date().toISOString(),
    },
    {
        id: 'provider-longevity-research',
        providerAddress: '0x0000000000000000000000000000000000000000000000000000000000001234',
        name: 'Longevity Research Corp.',
        endpoint: '/api/premium/medical/trials',
        ratePerSecond: '0.0002',
        description: 'Gated Phase III clinical trial results, raw patient datasets, and compound efficacy scores for longevity research.',
        category: 'Medical',
        registeredAt: new Date().toISOString(),
    },
    {
        id: 'provider-lexai',
        providerAddress: '0x0000000000000000000000000000000000000000000000000000000000001234',
        name: 'LexAI Data Services',
        endpoint: '/api/premium/legal/precedents',
        ratePerSecond: '0.00015',
        description: 'Comprehensive corpus of copyright litigation precedents, AI fair-use rulings, and jurisdictional analysis.',
        category: 'Legal',
        registeredAt: new Date().toISOString(),
    },
];

const earningsByProviderId: Record<string, number> = {};

function slugify(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function providerAliases(provider: ProviderListing): string[] {
    const aliases = [provider.id, slugify(provider.name)];
    if (provider.id.startsWith('provider-')) {
        aliases.push(provider.id.slice('provider-'.length));
    }
    return aliases;
}

export function ratePerSecondToMist(ratePerSecond: string): number {
    const parsed = Number(ratePerSecond);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed * MIST_PER_SUI);
}

export function getProviders(): ProviderListing[] {
    return [...registry];
}

export function getProviderById(id: string): ProviderListing | undefined {
    return registry.find(p => p.id === id);
}

export function getProviderByPublicId(id: string): ProviderListing | undefined {
    const normalized = slugify(id);
    return registry.find(p => providerAliases(p).includes(normalized));
}

export function getProviderByEndpoint(endpoint: string): ProviderListing | undefined {
    return registry.find(p => p.endpoint === endpoint);
}

export function addProviderEarnings(providerId: string, earnedMist: number): number {
    const provider = getProviderById(providerId) || getProviderByPublicId(providerId);
    if (!provider || !Number.isFinite(earnedMist) || earnedMist <= 0) {
        return 0;
    }

    earningsByProviderId[provider.id] = (earningsByProviderId[provider.id] || 0) + earnedMist;
    return earningsByProviderId[provider.id];
}

export function getProviderEarnings(providerId: string): { provider: ProviderListing; totalEarnedMist: number } | undefined {
    const provider = getProviderById(providerId) || getProviderByPublicId(providerId);
    if (!provider) return undefined;

    return {
        provider,
        totalEarnedMist: earningsByProviderId[provider.id] || 0,
    };
}

export function registerProvider(listing: Omit<ProviderListing, 'id' | 'registeredAt'>): ProviderListing {
    const newListing: ProviderListing = {
        ...listing,
        id: 'provider-' + Math.random().toString(36).substring(2, 10),
        registeredAt: new Date().toISOString(),
    };
    registry.push(newListing);
    console.log(`[Registry] New provider registered: ${newListing.name} at ${newListing.endpoint}`);
    return newListing;
}
