module stream_engine::stream {
    use sui::object::{Self, UID};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::clock::{Self, Clock};
    use sui::event;

    // --- Errors ---
    const ENotRecipient: u64 = 0;
    const ENotSenderOrRecipient: u64 = 1;
    const EStreamEnded: u64 = 2;
    const ENoFunds: u64 = 3;

    // --- Structs ---
    public struct StreamObject<phantom T> has key, store {
        id: UID,
        sender: address,
        recipient: address,
        balance: Balance<T>,
        rate_per_second: u64,
        start_time_ms: u64,
        last_withdrawal_ms: u64,
        metadata: vector<u8>
    }

    // --- Events ---
    public struct StreamCreated has copy, drop {
        stream_id: address,
        sender: address,
        recipient: address,
        rate_per_second: u64,
        metadata: vector<u8>
    }

    public struct StreamClosed has copy, drop {
        stream_id: address,
        sender: address,
        recipient: address,
        refunded_amount: u64
    }

    public struct Withdrawn has copy, drop {
        stream_id: address,
        recipient: address,
        amount: u64
    }

    // --- Accessors ---
    public fun current_balance<T>(stream: &StreamObject<T>): u64 {
        balance::value(&stream.balance)
    }

    public fun agent<T>(stream: &StreamObject<T>): address {
        stream.sender
    }

    // --- Functions ---
    public fun create_stream<T>(
        coin: Coin<T>,
        recipient: address,
        rate_per_second: u64,
        metadata: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        let current_time = clock::timestamp_ms(clock);
        
        let stream = StreamObject {
            id: object::new(ctx),
            sender,
            recipient,
            balance: coin::into_balance(coin),
            rate_per_second,
            start_time_ms: current_time,
            last_withdrawal_ms: current_time,
            metadata
        };

        event::emit(StreamCreated {
            stream_id: object::uid_to_address(&stream.id),
            sender,
            recipient,
            rate_per_second,
            metadata
        });

        // Must be a shared object so both parties can interact
        transfer::share_object(stream);
    }

    public fun get_claimable_balance<T>(stream: &StreamObject<T>, clock: &Clock): u64 {
        let current_time = clock::timestamp_ms(clock);
        if (current_time <= stream.last_withdrawal_ms) {
            return 0
        };

        let elapsed_seconds = (current_time - stream.last_withdrawal_ms) / 1000;
        let claimable = elapsed_seconds * stream.rate_per_second;
        let current_balance = balance::value(&stream.balance);

        if (claimable > current_balance) {
            current_balance
        } else {
            claimable
        }
    }

    public fun withdraw<T>(
        stream: &mut StreamObject<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == stream.recipient, ENotRecipient);

        let claimable = get_claimable_balance(stream, clock);
        assert!(claimable > 0, ENoFunds);

        stream.last_withdrawal_ms = clock::timestamp_ms(clock);
        
        let withdrawn_balance = balance::split(&mut stream.balance, claimable);
        let withdrawn_coin = coin::from_balance(withdrawn_balance, ctx);
        
        event::emit(Withdrawn {
            stream_id: object::uid_to_address(&stream.id),
            recipient: stream.recipient,
            amount: claimable
        });

        transfer::public_transfer(withdrawn_coin, caller);
    }

    // Unpacks the stream object and returns storage rebates to the caller. 
    public fun close_stream<T>(
        stream: StreamObject<T>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        assert!(caller == stream.sender || caller == stream.recipient, ENotSenderOrRecipient);

        let current_time = clock::timestamp_ms(clock);
        let elapsed_seconds = (current_time - stream.last_withdrawal_ms) / 1000;
        let mut claimable = elapsed_seconds * stream.rate_per_second;
        
        let StreamObject {
            id,
            sender,
            recipient,
            mut balance,
            rate_per_second: _,
            start_time_ms: _,
            last_withdrawal_ms: _,
            metadata: _
        } = stream;

        let total_balance = balance::value(&balance);
        if (claimable > total_balance) {
            claimable = total_balance;
        };

        let refunded_to_sender = total_balance - claimable;

        if (claimable > 0) {
            let recipient_balance = balance::split(&mut balance, claimable);
            transfer::public_transfer(coin::from_balance(recipient_balance, ctx), recipient);
        };

        if (refunded_to_sender > 0) {
            let sender_balance = balance::split(&mut balance, refunded_to_sender);
            transfer::public_transfer(coin::from_balance(sender_balance, ctx), sender);
        };

        balance::destroy_zero(balance);

        event::emit(StreamClosed {
            stream_id: object::uid_to_address(&id),
            sender,
            recipient,
            refunded_amount: refunded_to_sender
        });

        object::delete(id);
    }
}
