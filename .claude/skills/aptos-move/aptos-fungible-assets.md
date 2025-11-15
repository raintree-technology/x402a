# Aptos Fungible Assets Expert

You are an expert in the Aptos Fungible Asset (FA) standard - the modern token standard that replaces the legacy Coin module. You help developers create and manage fungible tokens using best practices.

## Core Concepts

### Fungible Asset Architecture

1. **Metadata Object**: Stores token information
   - Name, symbol, decimals
   - Icon URI, project URI
   - Supply tracking (optional max supply)
   - Created using Object standard

2. **FungibleStore**: Holds actual token balances
   - Per-user storage of tokens
   - Primary stores (default) vs custom stores
   - Balance tracking

3. **Refs (Capabilities)**: Permission system
   - **MintRef**: Allows minting new tokens
   - **BurnRef**: Allows burning tokens
   - **TransferRef**: Allows forced transfers (freezing, etc.)
   - These are capabilities stored by the creator

4. **Primary Fungible Store**: Default pattern
   - Automatic store creation for users
   - Simplifies token management
   - Recommended for most use cases

## Standard Token Creation Pattern

```move
module my_addr::my_token {
    use aptos_framework::fungible_asset::{Self, Metadata, MintRef, BurnRef, TransferRef};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use std::signer;

    /// Errors
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_BALANCE: u64 = 2;

    /// Holds the refs for managing the token
    struct TokenRefs has key {
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
    }

    /// Initialize the fungible asset
    public entry fun initialize(
        creator: &signer,
        maximum_supply: Option<u128>,
        name: String,
        symbol: String,
        decimals: u8,
        icon_uri: String,
        project_uri: String,
    ) {
        // Create a named object for the metadata
        let constructor_ref = &object::create_named_object(creator, *string::bytes(&name));

        // Initialize primary store enabled fungible asset
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            maximum_supply,
            name,
            symbol,
            decimals,
            icon_uri,
            project_uri,
        );

        // Generate and store refs
        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);

        // Store refs at creator's address
        move_to(creator, TokenRefs {
            mint_ref,
            burn_ref,
            transfer_ref,
        });
    }

    /// Mint tokens to a recipient
    public entry fun mint(
        creator: &signer,
        to: address,
        amount: u64,
    ) acquires TokenRefs {
        let creator_addr = signer::address_of(creator);
        assert!(exists<TokenRefs>(creator_addr), E_NOT_OWNER);

        let token_refs = borrow_global<TokenRefs>(creator_addr);
        let metadata = get_metadata();

        // Ensure primary store exists
        let to_store = primary_fungible_store::ensure_primary_store_exists(to, metadata);

        // Mint tokens
        fungible_asset::mint_to(&token_refs.mint_ref, to_store, amount);
    }

    /// Burn tokens from an account
    public entry fun burn(
        creator: &signer,
        from: address,
        amount: u64,
    ) acquires TokenRefs {
        let creator_addr = signer::address_of(creator);
        assert!(exists<TokenRefs>(creator_addr), E_NOT_OWNER);

        let token_refs = borrow_global<TokenRefs>(creator_addr);
        let metadata = get_metadata();
        let from_store = primary_fungible_store::primary_store(from, metadata);

        fungible_asset::burn_from(&token_refs.burn_ref, from_store, amount);
    }

    /// Transfer tokens (called by token holder)
    public entry fun transfer(
        from: &signer,
        to: address,
        amount: u64,
    ) {
        let metadata = get_metadata();
        primary_fungible_store::transfer(from, metadata, to, amount);
    }

    /// Get metadata object
    #[view]
    public fun get_metadata(): Object<Metadata> {
        let metadata_address = object::create_object_address(&@my_addr, b"MyToken");
        object::address_to_object<Metadata>(metadata_address)
    }

    /// Get balance of an address
    #[view]
    public fun balance_of(account: address): u64 {
        let metadata = get_metadata();
        primary_fungible_store::balance(account, metadata)
    }

    #[test(creator = @my_addr, user = @0x123)]
    public fun test_token(creator: &signer, user: &signer) acquires TokenRefs {
        use aptos_framework::account;

        // Setup
        account::create_account_for_test(@my_addr);
        account::create_account_for_test(@0x123);

        // Initialize token
        initialize(
            creator,
            option::none(), // unlimited supply
            string::utf8(b"My Token"),
            string::utf8(b"MTK"),
            8,
            string::utf8(b"https://icon.png"),
            string::utf8(b"https://project.com"),
        );

        // Mint to user
        mint(creator, @0x123, 1000);
        assert!(balance_of(@0x123) == 1000, 0);

        // Transfer
        transfer(user, @my_addr, 500);
        assert!(balance_of(@0x123) == 500, 1);
        assert!(balance_of(@my_addr) == 500, 2);
    }
}
```

## Advanced Patterns

### 1. Vesting Schedule

```move
use aptos_framework::timestamp;

struct VestingSchedule has key {
    beneficiary: address,
    total_amount: u64,
    start_time: u64,
    duration: u64,
    claimed: u64,
}

public entry fun create_vesting(
    creator: &signer,
    beneficiary: address,
    amount: u64,
    duration: u64,
) {
    let start_time = timestamp::now_seconds();

    move_to(creator, VestingSchedule {
        beneficiary,
        total_amount: amount,
        start_time,
        duration,
        claimed: 0,
    });
}

public entry fun claim_vested(account: &signer) acquires VestingSchedule, TokenRefs {
    let schedule = borrow_global_mut<VestingSchedule>(signer::address_of(account));

    let elapsed = timestamp::now_seconds() - schedule.start_time;
    let vested = if (elapsed >= schedule.duration) {
        schedule.total_amount
    } else {
        (schedule.total_amount * elapsed) / schedule.duration
    };

    let claimable = vested - schedule.claimed;
    schedule.claimed = vested;

    // Mint vested tokens
    mint(account, schedule.beneficiary, claimable);
}
```

### 2. Tax on Transfers

```move
struct TaxConfig has key {
    tax_rate_bps: u64, // basis points (100 = 1%)
    tax_collector: address,
}

public entry fun transfer_with_tax(
    from: &signer,
    to: address,
    amount: u64,
) acquires TaxConfig, TokenRefs {
    let config = borrow_global<TaxConfig>(@my_addr);

    // Calculate tax
    let tax_amount = (amount * config.tax_rate_bps) / 10000;
    let net_amount = amount - tax_amount;

    let metadata = get_metadata();

    // Transfer net amount to recipient
    primary_fungible_store::transfer(from, metadata, to, net_amount);

    // Transfer tax to collector
    primary_fungible_store::transfer(from, metadata, config.tax_collector, tax_amount);
}
```

### 3. Governance/Voting Weight

```move
struct VotingPower has key {
    locked_tokens: u64,
    unlock_time: u64,
}

public entry fun lock_for_voting(
    account: &signer,
    amount: u64,
    lock_duration: u64,
) acquires TokenRefs {
    let addr = signer::address_of(account);
    let unlock_time = timestamp::now_seconds() + lock_duration;

    // Transfer tokens to contract
    let metadata = get_metadata();
    primary_fungible_store::transfer(account, metadata, @my_addr, amount);

    // Record voting power
    if (exists<VotingPower>(addr)) {
        let power = borrow_global_mut<VotingPower>(addr);
        power.locked_tokens = power.locked_tokens + amount;
        if (unlock_time > power.unlock_time) {
            power.unlock_time = unlock_time;
        };
    } else {
        move_to(account, VotingPower {
            locked_tokens: amount,
            unlock_time,
        });
    }
}

#[view]
public fun get_voting_power(addr: address): u64 acquires VotingPower {
    if (!exists<VotingPower>(addr)) {
        return 0
    };

    let power = borrow_global<VotingPower>(addr);
    if (timestamp::now_seconds() >= power.unlock_time) {
        0
    } else {
        power.locked_tokens
    }
}
```

### 4. Permission-Based Minting

```move
struct MintPermission has key {
    allowed_minters: vector<address>,
}

public entry fun add_minter(admin: &signer, minter: address) acquires MintPermission {
    let admin_addr = signer::address_of(admin);
    assert!(exists<TokenRefs>(admin_addr), E_NOT_OWNER);

    let permissions = borrow_global_mut<MintPermission>(admin_addr);
    vector::push_back(&mut permissions.allowed_minters, minter);
}

public entry fun mint_with_permission(
    minter: &signer,
    to: address,
    amount: u64,
) acquires MintPermission, TokenRefs {
    let minter_addr = signer::address_of(minter);
    let permissions = borrow_global<MintPermission>(@my_addr);

    assert!(vector::contains(&permissions.allowed_minters, &minter_addr), E_NOT_AUTHORIZED);

    // Mint tokens
    let token_refs = borrow_global<TokenRefs>(@my_addr);
    let metadata = get_metadata();
    let to_store = primary_fungible_store::ensure_primary_store_exists(to, metadata);
    fungible_asset::mint_to(&token_refs.mint_ref, to_store, amount);
}
```

## Common Operations

### Query Supply
```move
#[view]
public fun get_supply(): Option<u128> {
    let metadata = get_metadata();
    fungible_asset::supply(metadata)
}

#[view]
public fun get_maximum_supply(): Option<u128> {
    let metadata = get_metadata();
    fungible_asset::maximum(metadata)
}
```

### Freeze/Unfreeze Account
```move
public entry fun freeze_account(
    admin: &signer,
    account: address,
) acquires TokenRefs {
    let token_refs = borrow_global<TokenRefs>(signer::address_of(admin));
    let metadata = get_metadata();
    let store = primary_fungible_store::primary_store(account, metadata);

    fungible_asset::set_frozen_flag(&token_refs.transfer_ref, store, true);
}
```

### Batch Transfer
```move
public entry fun batch_transfer(
    from: &signer,
    recipients: vector<address>,
    amounts: vector<u64>,
) {
    let len = vector::length(&recipients);
    assert!(len == vector::length(&amounts), E_INVALID_INPUT);

    let metadata = get_metadata();
    let i = 0;
    while (i < len) {
        let recipient = *vector::borrow(&recipients, i);
        let amount = *vector::borrow(&amounts, i);
        primary_fungible_store::transfer(from, metadata, recipient, amount);
        i = i + 1;
    };
}
```

## Best Practices

1. **Always use primary stores** for standard tokens (simplifies user experience)
2. **Store refs securely** with `key` ability at a controlled address
3. **Emit events** for all mint/burn/transfer operations
4. **Add view functions** for balance, supply, metadata queries
5. **Handle decimals correctly** (8 decimals is common, 6 for USDC-like)
6. **Consider maximum supply** (none for unlimited, Some(amount) for capped)
7. **Test thoroughly** including edge cases and failures
8. **Use named objects** for deterministic metadata addresses

## Key Differences from Legacy Coin

| Feature | Legacy Coin | Fungible Asset |
|---------|------------|----------------|
| Architecture | Module-based | Object-based |
| Extensibility | Limited | Highly extensible |
| Store management | Manual | Primary store auto-created |
| Refs pattern | Not available | MintRef, BurnRef, TransferRef |
| Composability | Low | High (Object standard) |
| Recommendation | Deprecated | Use this |

## Reference Examples

Located in the same directory as this skill:

- Full implementation: `./aptos-move-docs/move-by-examples/fungible-asset-launchpad/`
- Vesting: `./aptos-move-docs/move-by-examples/fungible-asset-vesting/`
- Voting: `./aptos-move-docs/move-by-examples/fungible-asset-voting/`
- Tax mechanism: `./aptos-move-docs/move-by-examples/fungible-asset-with-buy-sell-tax/`
- Permissions: `./aptos-move-docs/move-by-examples/fungible-asset-with-permission/`
- API reference: `./aptos-move-docs/aptos-dev-llms-full.txt` (search "fungible_asset")
- Framework source: `./aptos-move-docs/aptos-core/aptos-move/framework/aptos-framework/sources/fungible_asset.move`
