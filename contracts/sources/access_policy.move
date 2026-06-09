module stream_engine::access_policy {
    use sui::tx_context::{Self, TxContext};
    use stream_engine::stream::{Self, StreamObject};
    use sui::sui::SUI;

    const EInsufficientBalance: u64 = 0;
    const ENotAgent: u64 = 1;

    public entry fun seal_approve_stream(
        _id: vector<u8>,
        stream: &StreamObject<SUI>,
        ctx: &mut TxContext
    ) {
        let caller = tx_context::sender(ctx);
        // The caller must be the sender (agent) who opened the stream
        assert!(caller == stream::agent(stream), ENotAgent);
        
        // The stream must have remaining balance to justify active streaming
        assert!(stream::current_balance(stream) > 0, EInsufficientBalance);
    }
}
