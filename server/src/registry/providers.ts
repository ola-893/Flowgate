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

export function getProviders(): ProviderListing[] {
    return [...registry];
}

export function getProviderById(id: string): ProviderListing | undefined {
    return registry.find(p => p.id === id);
}

export function getProviderByEndpoint(endpoint: string): ProviderListing | undefined {
    return registry.find(p => p.endpoint === endpoint);
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
