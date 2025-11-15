# Aptos Digital Assets Expert

You are an expert in the Aptos Digital Asset (DA) standard - the modern NFT standard built on the Object model. You help developers create NFT collections, marketplaces, and advanced digital asset systems.

## Core Concepts

### Digital Asset Architecture

1. **Collection**: Group of related NFTs
   - Collection name and description
   - Creator royalty settings
   - Supply limits (optional)
   - Mutable/immutable configuration

2. **Token (NFT)**: Individual digital asset
   - Unique within collection
   - Metadata (name, description, URI)
   - Properties/traits
   - Ownership via Objects

3. **Object-Based**: Built on Aptos Objects
   - Each NFT is an Object
   - Transferable by default
   - Extensible with custom resources
   - Composable

4. **Royalties**: Creator earnings
   - Set at collection or token level
   - Enforced on-chain
   - Numerator/denominator format

## Standard Collection + NFT Pattern

```move
module my_addr::my_nfts {
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_framework::object::{Self, Object};
    use std::option::{Self, Option};
    use std::string::{Self, String};
    use std::signer;

    /// Errors
    const E_NOT_CREATOR: u64 = 1;
    const E_COLLECTION_NOT_FOUND: u64 = 2;

    /// Collection configuration
    struct CollectionConfig has key {
        creator: address,
        total_minted: u64,
        max_supply: Option<u64>,
    }

    /// Create a collection
    public entry fun create_collection(
        creator: &signer,
        description: String,
        name: String,
        uri: String,
        max_supply: Option<u64>,
        royalty_numerator: u64,
        royalty_denominator: u64,
    ) {
        let creator_addr = signer::address_of(creator);

        // Create collection with royalty
        if (option::is_some(&max_supply)) {
            collection::create_fixed_collection(
                creator,
                description,
                *option::borrow(&max_supply),
                name,
                option::some(royalty_numerator, royalty_denominator)),
                uri,
            );
        } else {
            collection::create_unlimited_collection(
                creator,
                description,
                name,
                option::some(royalty_numerator, royalty_denominator)),
                uri,
            );
        };

        // Store collection config
        move_to(creator, CollectionConfig {
            creator: creator_addr,
            total_minted: 0,
            max_supply,
        });
    }

    /// Mint an NFT
    public entry fun mint_nft(
        creator: &signer,
        collection: String,
        description: String,
        name: String,
        uri: String,
        property_keys: vector<String>,
        property_types: vector<String>,
        property_values: vector<vector<u8>>,
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        assert!(exists<CollectionConfig>(creator_addr), E_COLLECTION_NOT_FOUND);

        let config = borrow_global_mut<CollectionConfig>(creator_addr);

        // Check supply limit
        if (option::is_some(&config.max_supply)) {
            let max = *option::borrow(&config.max_supply);
            assert!(config.total_minted < max, E_MAX_SUPPLY_REACHED);
        };

        // Create token
        let constructor_ref = token::create(
            creator,
            collection,
            description,
            name,
            option::none(), // royalty (use collection default)
            uri,
        );

        // Add properties if provided
        if (vector::length(&property_keys) > 0) {
            let property_mutator_ref = token::generate_mutator_ref(&constructor_ref);
            let i = 0;
            let len = vector::length(&property_keys);
            while (i < len) {
                token::add_typed_property(
                    &property_mutator_ref,
                    *vector::borrow(&property_keys, i),
                    *vector::borrow(&property_types, i),
                    *vector::borrow(&property_values, i),
                );
                i = i + 1;
            };
        };

        config.total_minted = config.total_minted + 1;
    }

    /// Transfer NFT (by token name)
    public entry fun transfer_nft(
        from: &signer,
        collection: String,
        name: String,
        to: address,
    ) {
        let token_address = token::create_token_address(
            &signer::address_of(from),
            &collection,
            &name,
        );
        let token = object::address_to_object<token::Token>(token_address);
        object::transfer(from, token, to);
    }

    /// Burn NFT
    public entry fun burn_nft(
        owner: &signer,
        collection: String,
        name: String,
    ) {
        let token_address = token::create_token_address(
            &signer::address_of(owner),
            &collection,
            &name,
        );
        let token = object::address_to_object<token::Token>(token_address);
        token::burn(owner, token);
    }

    /// View functions
    #[view]
    public fun get_collection_supply(creator: address): u64 acquires CollectionConfig {
        assert!(exists<CollectionConfig>(creator), E_COLLECTION_NOT_FOUND);
        borrow_global<CollectionConfig>(creator).total_minted
    }

    #[test(creator = @my_addr)]
    public fun test_nft_creation(creator: &signer) acquires CollectionConfig {
        use aptos_framework::account;

        account::create_account_for_test(@my_addr);

        // Create collection
        create_collection(
            creator,
            string::utf8(b"My Collection"),
            string::utf8(b"MYCOL"),
            string::utf8(b"https://collection.uri"),
            option::some(100),
            5, // 5% royalty
            100,
        );

        // Mint NFT
        mint_nft(
            creator,
            string::utf8(b"MYCOL"),
            string::utf8(b"Token #1"),
            string::utf8(b"TOKEN1"),
            string::utf8(b"https://token1.uri"),
            vector::empty(),
            vector::empty(),
            vector::empty(),
        );

        assert!(get_collection_supply(@my_addr) == 1, 0);
    }
}
```

## Advanced Patterns

### 1. NFT Marketplace

```move
struct Listing has key {
    seller: address,
    price: u64,
    token: Object<token::Token>,
}

public entry fun list_for_sale(
    seller: &signer,
    token: Object<token::Token>,
    price: u64,
) {
    let seller_addr = signer::address_of(seller);

    // Transfer token to marketplace
    object::transfer(seller, token, @my_addr);

    // Create listing
    let listing_addr = object::object_address(&token);
    move_to(seller, Listing {
        seller: seller_addr,
        price,
        token,
    });
}

public entry fun buy(
    buyer: &signer,
    listing_addr: address,
) acquires Listing {
    let listing = move_from<Listing>(listing_addr);

    // Transfer payment (simplified - use Coin or FungibleAsset in production)
    // coin::transfer<AptosCoin>(buyer, listing.seller, listing.price);

    // Transfer NFT to buyer
    object::transfer_raw(@my_addr, object::object_address(&listing.token), signer::address_of(buyer));

    // Cleanup
    let Listing { seller: _, price: _, token: _ } = listing;
}

public entry fun cancel_listing(
    seller: &signer,
    listing_addr: address,
) acquires Listing {
    let listing = move_from<Listing>(listing_addr);
    assert!(listing.seller == signer::address_of(seller), E_NOT_OWNER);

    // Return NFT to seller
    object::transfer_raw(@my_addr, object::object_address(&listing.token), listing.seller);

    let Listing { seller: _, price: _, token: _ } = listing;
}
```

### 2. Auction System

```move
use aptos_framework::timestamp;

struct Auction has key {
    seller: address,
    token: Object<token::Token>,
    starting_price: u64,
    highest_bid: u64,
    highest_bidder: Option<address>,
    end_time: u64,
}

public entry fun create_auction(
    seller: &signer,
    token: Object<token::Token>,
    starting_price: u64,
    duration: u64,
) {
    let end_time = timestamp::now_seconds() + duration;

    // Transfer token to contract
    object::transfer(seller, token, @my_addr);

    move_to(seller, Auction {
        seller: signer::address_of(seller),
        token,
        starting_price,
        highest_bid: starting_price,
        highest_bidder: option::none(),
        end_time,
    });
}

public entry fun place_bid(
    bidder: &signer,
    auction_addr: address,
    bid_amount: u64,
) acquires Auction {
    let auction = borrow_global_mut<Auction>(auction_addr);

    // Validate bid
    assert!(timestamp::now_seconds() < auction.end_time, E_AUCTION_ENDED);
    assert!(bid_amount > auction.highest_bid, E_BID_TOO_LOW);

    // Return previous bid (simplified - handle coin returns in production)
    if (option::is_some(&auction.highest_bidder)) {
        let prev_bidder = *option::borrow(&auction.highest_bidder);
        // Return funds to prev_bidder
    };

    // Update auction
    auction.highest_bid = bid_amount;
    auction.highest_bidder = option::some(signer::address_of(bidder));
}

public entry fun finalize_auction(
    seller: &signer,
    auction_addr: address,
) acquires Auction {
    let auction = move_from<Auction>(auction_addr);
    assert!(timestamp::now_seconds() >= auction.end_time, E_AUCTION_NOT_ENDED);

    if (option::is_some(&auction.highest_bidder)) {
        let winner = *option::borrow(&auction.highest_bidder);
        // Transfer payment to seller
        // Transfer NFT to winner
        object::transfer_raw(@my_addr, object::object_address(&auction.token), winner);
    } else {
        // No bids - return NFT to seller
        object::transfer_raw(@my_addr, object::object_address(&auction.token), auction.seller);
    };

    let Auction { seller: _, token: _, starting_price: _, highest_bid: _, highest_bidder: _, end_time: _ } = auction;
}
```

### 3. Staking NFTs

```move
struct StakedNFT has key {
    owner: address,
    token: Object<token::Token>,
    staked_at: u64,
    rewards_claimed: u64,
}

public entry fun stake_nft(
    owner: &signer,
    token: Object<token::Token>,
) {
    let owner_addr = signer::address_of(owner);

    // Transfer to staking contract
    object::transfer(owner, token, @my_addr);

    move_to(owner, StakedNFT {
        owner: owner_addr,
        token,
        staked_at: timestamp::now_seconds(),
        rewards_claimed: 0,
    });
}

public entry fun claim_rewards(
    owner: &signer,
) acquires StakedNFT {
    let staked = borrow_global_mut<StakedNFT>(signer::address_of(owner));

    let time_staked = timestamp::now_seconds() - staked.staked_at;
    let rewards = time_staked * REWARDS_PER_SECOND;
    let claimable = rewards - staked.rewards_claimed;

    // Mint/transfer rewards
    staked.rewards_claimed = rewards;
}

public entry fun unstake_nft(
    owner: &signer,
) acquires StakedNFT {
    let staked = move_from<StakedNFT>(signer::address_of(owner));

    // Claim remaining rewards
    let time_staked = timestamp::now_seconds() - staked.staked_at;
    let rewards = time_staked * REWARDS_PER_SECOND;
    let claimable = rewards - staked.rewards_claimed;
    // Transfer rewards

    // Return NFT
    object::transfer_raw(@my_addr, object::object_address(&staked.token), staked.owner);

    let StakedNFT { owner: _, token: _, staked_at: _, rewards_claimed: _ } = staked;
}
```

### 4. Dynamic NFT Properties

```move
public entry fun update_nft_property(
    creator: &signer,
    token: Object<token::Token>,
    key: String,
    type_: String,
    value: vector<u8>,
) {
    // Only creator can update
    let creator_addr = signer::address_of(creator);

    // Get mutator ref (stored during creation)
    // property_mutator_ref required
    // token::update_typed_property(&mutator_ref, key, type_, value);
}

/// Level up NFT (gaming use case)
public entry fun level_up(
    owner: &signer,
    token: Object<token::Token>,
) {
    // Verify ownership
    assert!(object::is_owner(token, signer::address_of(owner)), E_NOT_OWNER);

    // Update level property
    // Requires mutator ref stored during minting
}
```

### 5. Bundled NFTs (Composability)

```move
struct Bundle has key {
    tokens: vector<Object<token::Token>>,
}

public entry fun create_bundle(
    owner: &signer,
    tokens: vector<Object<token::Token>>,
) {
    // Transfer all tokens to bundle
    let i = 0;
    let len = vector::length(&tokens);
    while (i < len) {
        let token = *vector::borrow(&tokens, i);
        object::transfer(owner, token, @my_addr);
        i = i + 1;
    };

    move_to(owner, Bundle { tokens });
}

public entry fun unbundle(
    owner: &signer,
) acquires Bundle {
    let bundle = move_from<Bundle>(signer::address_of(owner));

    // Return all tokens
    let i = 0;
    let len = vector::length(&bundle.tokens);
    while (i < len) {
        let token = *vector::borrow(&bundle.tokens, i);
        object::transfer_raw(@my_addr, object::object_address(&token), signer::address_of(owner));
        i = i + 1;
    };

    let Bundle { tokens: _ } = bundle;
}
```

## Common Operations

### Query NFT Owner
```move
#[view]
public fun get_nft_owner(token: Object<token::Token>): address {
    object::owner(token)
}
```

### Check Collection Exists
```move
#[view]
public fun collection_exists(creator: address, collection_name: String): bool {
    let collection_addr = collection::create_collection_address(&creator, &collection_name);
    object::object_exists<collection::Collection>(collection_addr)
}
```

### Get Token URI
```move
#[view]
public fun get_token_uri(token: Object<token::Token>): String {
    token::uri(token)
}
```

### Freeze/Unfreeze Transfer
```move
public entry fun freeze_token_transfer(
    creator: &signer,
    token: Object<token::Token>,
) {
    // Requires TransferRef stored during creation
    // object::disable_ungated_transfer(&transfer_ref);
}
```

## Best Practices

1. **Use Objects** - Digital Assets are Object-based, leverage this
2. **Set royalties** - Support creator earnings
3. **Add properties** - Rich metadata for NFTs
4. **Emit events** - Track minting, transfers, sales
5. **Consider mutability** - Decide what can change
6. **Test thoroughly** - Especially marketplace logic
7. **Handle royalty payments** - Enforce in marketplace
8. **Gas efficiency** - Batch operations where possible

## Key Differences from Token V1

| Feature | Token V1 | Digital Assets (Token V2) |
|---------|----------|---------------------------|
| Architecture | Resource-based | Object-based |
| Transfer | Complex | Simple (Object transfer) |
| Extensibility | Limited | High (add resources to Objects) |
| Properties | Basic | Rich typed properties |
| Composability | Low | High |
| Recommendation | Legacy | Use this |

## Reference Examples

Located in the same directory as this skill:

- NFT marketplace: `./aptos-move-docs/move-by-examples/nft-marketplace/`
- NFT launchpad: `./aptos-move-docs/move-by-examples/nft-launchpad/`
- API reference: `./aptos-move-docs/aptos-dev-llms-full.txt` (search "digital asset" or "aptos_token_objects")
- Framework source: `./aptos-move-docs/aptos-core/aptos-move/framework/aptos-token-objects/`
