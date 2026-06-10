module stream_engine::registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use std::string::String;

    // --- Structs ---

    /// A Registry object representing the global Marketplace.
    public struct MarketplaceRegistry has key {
        id: UID,
    }

    /// A website listed on the scraping marketplace.
    public struct Listing has key, store {
        id: UID,
        owner: address,
        domain: String,
        description: String,
        price_per_second: u64, // MIST per second of scraping access
    }

    // --- Events ---

    public struct ListingCreated has copy, drop {
        listing_id: ID,
        owner: address,
        domain: String,
        price_per_second: u64,
    }

    // --- Init ---

    fun init(ctx: &mut TxContext) {
        let registry = MarketplaceRegistry {
            id: object::new(ctx),
        };
        // The registry is shared so anyone can potentially read from it or register against it (if we added dynamic fields).
        // For this hackathon demo, we will just share the Listings directly to make them easily discoverable.
        transfer::share_object(registry);
    }

    // --- Functions ---

    /// Register a new website on the StreamEngine marketplace.
    public fun register_website(
        domain: String,
        description: String,
        price_per_second: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let listing = Listing {
            id: object::new(ctx),
            owner: sender,
            domain,
            description,
            price_per_second,
        };

        event::emit(ListingCreated {
            listing_id: object::uid_to_inner(&listing.id),
            owner: sender,
            domain,
            price_per_second,
        });

        // Share the listing so AI Agents can read it directly from the network.
        transfer::share_object(listing);
    }
}
