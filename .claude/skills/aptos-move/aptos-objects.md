# Aptos Objects Expert

You are an expert in the Aptos Object standard - a powerful primitive for creating composable, transferable, and extensible on-chain resources. Objects are the foundation of modern Aptos development.

## Core Concepts

### What are Objects?

Objects are on-chain containers that:
- Have a unique address
- Can own other resources
- Are transferable by default
- Support deletion (with DeleteRef)
- Enable composability
- Form the basis of Fungible Assets and Digital Assets

### Object vs Traditional Resource

| Feature | Traditional Resource | Object |
|---------|---------------------|--------|
| Address | Account-bound | Independent address |
| Transfer | Not transferable | Transferable by default |
| Ownership | Implicit (at address) | Explicit (owner field) |
| Deletion | Only with move_from | With DeleteRef |
| Composability | Limited | High |
| Use case | Account state | Transferable items, tokens, NFTs |

## Creating Objects

### 1. Basic Object Creation

```move
use aptos_framework::object::{Self, Object, ConstructorRef};
use std::signer;

struct MyObject has key {
    value: u64,
}

/// Create a new object
public fun create_object(creator: &signer): Object<MyObject> {
    // Create object (generates random address)
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Get object signer to move resources to the object
    let object_signer = object::generate_signer(&constructor_ref);

    // Move resource to object
    move_to(&object_signer, MyObject {
        value: 0,
    });

    // Return object reference
    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}
```

### 2. Named Objects (Deterministic Addresses)

```move
/// Create object with deterministic address
public fun create_named_object(creator: &signer, seed: vector<u8>): Object<MyObject> {
    // Address will be derived from creator address + seed
    let constructor_ref = object::create_named_object(creator, seed);

    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, MyObject {
        value: 0,
    });

    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}

/// Get deterministic address
#[view]
public fun get_named_object_address(creator: address, seed: vector<u8>): address {
    object::create_object_address(&creator, seed)
}
```

### 3. Sticky Objects (Account-Bound)

```move
/// Create object that cannot be transferred
public fun create_sticky_object(creator: &signer): Object<MyObject> {
    // Create account-bound object
    let constructor_ref = object::create_sticky_object(signer::address_of(creator));

    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, MyObject {
        value: 0,
    });

    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}
```

## Object Refs (Capabilities)

Refs are capabilities that enable privileged operations on Objects:

### 1. ExtendRef (Add Resources Later)

```move
struct MyObjectRefs has key {
    extend_ref: object::ExtendRef,
}

public fun create_with_extend_ref(creator: &signer): Object<MyObject> {
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate ExtendRef to add resources later
    let extend_ref = object::generate_extend_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);
    move_to(&object_signer, MyObject { value: 0 });

    // Store extend_ref for later use
    move_to(creator, MyObjectRefs { extend_ref });

    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}

struct ExtraData has key {
    data: u64,
}

/// Add resource to existing object
public fun add_extra_data(creator: &signer, extra: u64) acquires MyObjectRefs {
    let refs = borrow_global<MyObjectRefs>(signer::address_of(creator));

    // Generate signer from extend_ref
    let object_signer = object::generate_signer_for_extending(&refs.extend_ref);

    // Add new resource
    move_to(&object_signer, ExtraData {
        data: extra,
    });
}
```

### 2. TransferRef (Control Transfers)

```move
struct MyObjectWithTransferRef has key {
    transfer_ref: object::TransferRef,
}

public fun create_with_transfer_control(creator: &signer): Object<MyObject> {
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate TransferRef for transfer control
    let transfer_ref = object::generate_transfer_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);
    move_to(&object_signer, MyObject { value: 0 });

    move_to(creator, MyObjectWithTransferRef { transfer_ref });

    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}

/// Freeze transfers (e.g., while staked)
public fun freeze_transfer(admin: &signer, obj: Object<MyObject>) acquires MyObjectWithTransferRef {
    let refs = borrow_global<MyObjectWithTransferRef>(signer::address_of(admin));
    object::disable_ungated_transfer(&refs.transfer_ref);
}

/// Unfreeze transfers
public fun unfreeze_transfer(admin: &signer, obj: Object<MyObject>) acquires MyObjectWithTransferRef {
    let refs = borrow_global<MyObjectWithTransferRef>(signer::address_of(admin));
    object::enable_ungated_transfer(&refs.transfer_ref);
}

/// Forced transfer (admin override)
public fun admin_transfer(
    admin: &signer,
    obj: Object<MyObject>,
    to: address,
) acquires MyObjectWithTransferRef {
    let refs = borrow_global<MyObjectWithTransferRef>(signer::address_of(admin));
    object::transfer_with_ref(object::generate_linear_transfer_ref(&refs.transfer_ref), to);
}
```

### 3. DeleteRef (Enable Deletion)

```move
struct MyObjectWithDelete has key {
    delete_ref: object::DeleteRef,
}

public fun create_deletable_object(creator: &signer): Object<MyObject> {
    let constructor_ref = object::create_object(signer::address_of(creator));

    // Generate DeleteRef
    let delete_ref = object::generate_delete_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);
    move_to(&object_signer, MyObject { value: 0 });

    move_to(creator, MyObjectWithDelete { delete_ref });

    object::object_from_constructor_ref<MyObject>(&constructor_ref)
}

/// Delete the object
public fun delete_object(owner: &signer) acquires MyObjectWithDelete, MyObject {
    let refs = move_from<MyObjectWithDelete>(signer::address_of(owner));

    let object_addr = object::address_from_delete_ref(&refs.delete_ref);

    // Must remove all resources first
    let MyObject { value: _ } = move_from<MyObject>(object_addr);

    // Delete the object
    object::delete(refs.delete_ref);
}
```

## Common Patterns

### 1. Game Item System

```move
struct GameItem has key {
    name: String,
    rarity: u8,
    power: u64,
    durability: u64,
}

struct ItemRefs has key {
    extend_ref: object::ExtendRef,
}

/// Create game item as object
public fun create_item(
    creator: &signer,
    name: String,
    rarity: u8,
    power: u64,
): Object<GameItem> {
    let constructor_ref = object::create_object(signer::address_of(creator));
    let extend_ref = object::generate_extend_ref(&constructor_ref);

    let object_signer = object::generate_signer(&constructor_ref);
    move_to(&object_signer, GameItem {
        name,
        rarity,
        power,
        durability: 100,
    });

    let object_addr = object::address_from_constructor_ref(&constructor_ref);
    let item_obj = object::address_to_object<GameItem>(object_addr);

    // Store refs at item address
    move_to(&object_signer, ItemRefs { extend_ref });

    item_obj
}

/// Transfer item
public entry fun transfer_item(
    from: &signer,
    item: Object<GameItem>,
    to: address,
) {
    object::transfer(from, item, to);
}

/// Upgrade item (modify resource in object)
public entry fun upgrade_item(
    owner: &signer,
    item: Object<GameItem>,
    power_increase: u64,
) acquires GameItem {
    // Verify ownership
    assert!(object::is_owner(item, signer::address_of(owner)), E_NOT_OWNER);

    let item_addr = object::object_address(&item);
    let game_item = borrow_global_mut<GameItem>(item_addr);
    game_item.power = game_item.power + power_increase;
}
```

### 2. Nested Objects (Composability)

```move
struct Container has key {
    contents: vector<Object<Item>>,
}

struct Item has key {
    value: u64,
}

/// Create container that holds other objects
public fun create_container(creator: &signer): Object<Container> {
    let constructor_ref = object::create_object(signer::address_of(creator));
    let object_signer = object::generate_signer(&constructor_ref);

    move_to(&object_signer, Container {
        contents: vector::empty(),
    });

    object::object_from_constructor_ref<Container>(&constructor_ref)
}

/// Add item to container
public fun add_to_container(
    owner: &signer,
    container: Object<Container>,
    item: Object<Item>,
) acquires Container {
    // Transfer item to container
    let container_addr = object::object_address(&container);
    object::transfer(owner, item, container_addr);

    // Update container contents
    let container_data = borrow_global_mut<Container>(container_addr);
    vector::push_back(&mut container_data.contents, item);
}
```

### 3. Object Collection

```move
struct Collection has key {
    objects: vector<Object<MyObject>>,
    count: u64,
}

public fun create_collection(creator: &signer) {
    move_to(creator, Collection {
        objects: vector::empty(),
        count: 0,
    });
}

public fun mint_to_collection(
    creator: &signer,
    value: u64,
) acquires Collection {
    let obj = create_object(creator);

    let collection = borrow_global_mut<Collection>(signer::address_of(creator));
    vector::push_back(&mut collection.objects, obj);
    collection.count = collection.count + 1;
}

#[view]
public fun get_collection_size(addr: address): u64 acquires Collection {
    borrow_global<Collection>(addr).count
}
```

### 4. Object Marketplace

```move
struct Listing has key {
    seller: address,
    price: u64,
    object: Object<MyObject>,
}

public entry fun list_object(
    seller: &signer,
    object: Object<MyObject>,
    price: u64,
) {
    let seller_addr = signer::address_of(seller);

    // Transfer object to marketplace
    object::transfer(seller, object, @marketplace);

    // Create listing
    move_to(seller, Listing {
        seller: seller_addr,
        price,
        object,
    });
}

public entry fun buy_object(
    buyer: &signer,
    seller: address,
) acquires Listing {
    let listing = move_from<Listing>(seller);

    // Transfer payment (simplified - use Coin/FungibleAsset in production)
    // coin::transfer<AptosCoin>(buyer, listing.seller, listing.price);

    // Transfer object to buyer
    object::transfer_raw(@marketplace, object::object_address(&listing.object), signer::address_of(buyer));

    let Listing { seller: _, price: _, object: _ } = listing;
}
```

## Object Queries

### Check Ownership
```move
#[view]
public fun is_owned_by(obj: Object<MyObject>, addr: address): bool {
    object::is_owner(obj, addr)
}

#[view]
public fun get_owner(obj: Object<MyObject>): address {
    object::owner(obj)
}
```

### Check if Object Exists
```move
#[view]
public fun object_exists(addr: address): bool {
    object::object_exists<MyObject>(addr)
}
```

### Get Object Address
```move
#[view]
public fun get_object_address(obj: Object<MyObject>): address {
    object::object_address(&obj)
}
```

### Check if Transferable
```move
#[view]
public fun is_transferable(obj: Object<MyObject>): bool {
    object::ungated_transfer_allowed(obj)
}
```

## Best Practices

1. **Use Objects for transferable items** - Game items, NFTs, composable assets
2. **Use traditional resources for account state** - User profiles, configuration
3. **Store refs securely** - Keep ExtendRef, DeleteRef, TransferRef safe
4. **Name objects when needed** - For deterministic addresses
5. **Clean up properly** - Remove all resources before deleting
6. **Verify ownership** - Always check before modifying
7. **Consider transfer control** - Use TransferRef for freezing/forced transfers
8. **Leverage composability** - Objects can own other objects

## Common Mistakes

### ❌ Not Verifying Ownership
```move
// BAD
public fun modify(obj: Object<MyObject>) acquires MyObject {
    let data = borrow_global_mut<MyObject>(object::object_address(&obj));
    data.value = 999; // Anyone can call this!
}

// GOOD
public fun modify(owner: &signer, obj: Object<MyObject>) acquires MyObject {
    assert!(object::is_owner(obj, signer::address_of(owner)), E_NOT_OWNER);
    let data = borrow_global_mut<MyObject>(object::object_address(&obj));
    data.value = 999;
}
```

### ❌ Forgetting to Generate Refs
```move
// BAD - Cannot extend or delete later
public fun create_object(creator: &signer): Object<MyObject> {
    let constructor_ref = object::create_object(signer::address_of(creator));
    // No refs generated - locked forever
    // ...
}

// GOOD - Generate refs if needed
public fun create_object(creator: &signer): Object<MyObject> {
    let constructor_ref = object::create_object(signer::address_of(creator));
    let extend_ref = object::generate_extend_ref(&constructor_ref);
    let delete_ref = object::generate_delete_ref(&constructor_ref);
    // Store refs for later use
    // ...
}
```

### ❌ Incorrect Deletion
```move
// BAD - Cannot delete without DeleteRef
public fun delete_object(obj: Object<MyObject>) {
    // object::delete() requires DeleteRef!
}

// GOOD
public fun delete_object(owner: &signer) acquires MyObjectRefs, MyObject {
    let refs = move_from<MyObjectRefs>(signer::address_of(owner));
    let object_addr = object::address_from_delete_ref(&refs.delete_ref);

    // Remove all resources first
    let MyObject { value: _ } = move_from<MyObject>(object_addr);

    // Then delete
    object::delete(refs.delete_ref);
}
```

## Reference Documentation

Located in the same directory as this skill:

- Object standard source: `./aptos-move-docs/aptos-core/aptos-move/framework/aptos-framework/sources/object.move`
- API reference: `./aptos-move-docs/aptos-dev-llms-full.txt` (search "object")
- Example usage: `./aptos-move-docs/move-by-examples/` (Fungible Assets & Digital Assets use Objects)
- Quick reference: `./aptos-move-docs/MOVE_QUICK_REFERENCE.txt`
