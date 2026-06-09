module synapse::data_lifecycle {
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    use sui::clock::{Self, Clock};
    use sui::transfer;

    /// Represents an encrypted AI memory blob stored on Walrus
    /// and managed by the Synapse Move contracts.
    public struct ManagedBlob has key, store {
        id: UID,
        blob_id: vector<u8>,
        agent_id: address,
        created_at: u64,
        expires_at: u64,
    }

    /// Register a new Walrus blob for lifecycle management
    public entry fun register_blob(
        blob_id: vector<u8>,
        duration_ms: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let managed_blob = ManagedBlob {
            id: object::new(ctx),
            blob_id,
            agent_id: sui::tx_context::sender(ctx),
            created_at: current_time,
            expires_at: current_time + duration_ms,
        };
        // The blob is shared so operators and agents can interact with it
        transfer::public_share_object(managed_blob);
    }

    /// Extend the lifetime of a managed blob
    public entry fun extend_lifetime(
        blob: &mut ManagedBlob,
        additional_duration_ms: u64,
        _ctx: &mut TxContext
    ) {
        blob.expires_at = blob.expires_at + additional_duration_ms;
    }

    /// Prune expired logs (allows anyone to clean up stale data)
    public entry fun prune_expired(
        blob: ManagedBlob,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(clock::timestamp_ms(clock) > blob.expires_at, 0); // ENotExpired
        let ManagedBlob { id, blob_id: _, agent_id: _, created_at: _, expires_at: _ } = blob;
        object::delete(id);
    }
}
