/**
 * StreamEngine Provider Registry
 * 
 * Off-chain registry for the hackathon demo. Website owners register their
 * sites here with per-second scraping access pricing. In production, this
 * would be backed by on-chain Listing objects from registry.move.
 */

export interface ProviderListing {
    id: string;
    providerAddress: string;   // Sui address that receives stream payments
    name: string;              // "X (Twitter)"
    websiteUrl: string;        // "https://x.com"
    endpoint: string;          // Gateway scraping route
    ratePerSecond: number;     // MIST per second of scraping access
    description: string;
    category: string;
    registeredAt: string;
}

const MIST_PER_SUI = 1_000_000_000;
const DEMO_PROVIDER_ADDRESS = '0x0000000000000000000000000000000000000000000000000000000000001234';

// In-memory registry (seeded with demo providers)
const registry: ProviderListing[] = [
    {
        id: 'x-social',
        providerAddress: DEMO_PROVIDER_ADDRESS,
        name: 'X (Twitter)',
        description: 'Real-time posts, trending topics, and human interactions from X.com',
        websiteUrl: 'https://x.com',
        endpoint: '/api/premium/x-social/feed',
        ratePerSecond: 100,
        category: 'Social Media',
        registeredAt: new Date().toISOString(),
    },
    {
        id: 'reddit',
        providerAddress: DEMO_PROVIDER_ADDRESS,
        name: 'Reddit',
        description: 'Upvoted threads, community discussions, and niche subreddit data',
        websiteUrl: 'https://reddit.com',
        endpoint: '/api/premium/reddit/feed',
        ratePerSecond: 80,
        category: 'Social Media',
        registeredAt: new Date().toISOString(),
    },
    {
        id: 'bloomberg',
        providerAddress: DEMO_PROVIDER_ADDRESS,
        name: 'Bloomberg',
        description: 'Proprietary financial news, earnings call transcripts, and market commentary',
        websiteUrl: 'https://bloomberg.com',
        endpoint: '/api/premium/bloomberg/feed',
        ratePerSecond: 200,
        category: 'Finance',
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

export function ratePerSecondToMist(ratePerSecond: number | string): number {
    const parsed = Number(ratePerSecond);
    if (!Number.isFinite(parsed) || parsed <= 0) return 0;
    return Math.floor(parsed < 1 ? parsed * MIST_PER_SUI : parsed);
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
    console.log(`[Registry] New website listed: ${newListing.name} at ${newListing.websiteUrl}`);
    return newListing;
}
