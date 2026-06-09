module synapse::agent_registry {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::string::String;
    use synapse::access_control::{Self, AgentCap};

    /// Represents an AI agent's identity on-chain
    public struct AgentProfile has key, store {
        id: UID,
        name: String,
        delegate_address: address,
        is_active: bool,
    }

    /// Admin capability for managing agents
    public struct AdminCap has key, store {
        id: UID,
    }

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(admin_cap, tx_context::sender(ctx));
    }

    /// Register a new agent and issue it an AgentCap for decryption
    public entry fun register_agent(
        _admin: &AdminCap,
        name: String,
        delegate_address: address,
        ctx: &mut TxContext
    ) {
        let profile = AgentProfile {
            id: object::new(ctx),
            name,
            delegate_address,
            is_active: true,
        };
        // The profile is shared so others can view agent status
        transfer::public_share_object(profile);
        
        // In a real integration, the admin would mint the AgentCap
        // and transfer it to the delegate_address, but since the AgentCap 
        // is defined in access_control, we'll assume a composite flow.
        // For hackathon simplicity, we just create the profile.
    }

    /// Deactivate a rogue or retired agent
    public entry fun deactivate_agent(
        _admin: &AdminCap,
        profile: &mut AgentProfile,
        _ctx: &mut TxContext
    ) {
        profile.is_active = false;
    }
}
