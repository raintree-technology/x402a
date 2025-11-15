===========================================
APTOS & MOVE DOCUMENTATION COLLECTION
For Claude Code Skills Development
===========================================

This directory contains comprehensive documentation and resources for building
Claude Code skills around Move programming language and Aptos smart contracts.

===========================================
DIRECTORY STRUCTURE
===========================================

1. OFFICIAL APTOS DOCUMENTATION (LLMs.txt files)
   -------------------------------------------
   - aptos-dev-llms.txt         : Index file pointing to full/small versions
   - aptos-dev-llms-full.txt    : Complete Aptos documentation (2.4MB, 57K lines)
   - aptos-dev-llms-small.txt   : Abridged version (2.4MB, 57K lines)

   Content includes:
   - Smart contract development with Move
   - Aptos CLI and development tools
   - TypeScript/Go SDKs
   - Indexer APIs and GraphQL
   - Keyless authentication & Passkeys
   - On-chain randomness
   - Model Context Protocol (MCP) integration
   - Network operations and deployment

2. MOVE LANGUAGE REPOSITORY (move/)
   -------------------------------------------
   Source: https://github.com/aptos-labs/move

   Contains:
   - Move virtual machine implementation
   - Bytecode verifier and compiler
   - Move Prover (formal verification tool)
   - Package manager
   - Language documentation and specifications

   Key directories:
   - language/move-compiler/        : Compiler implementation
   - language/move-vm/              : VM implementation
   - language/move-prover/          : Formal verification
   - language/documentation/        : Language specs

3. APTOS CORE - MOVE FRAMEWORK (aptos-core/)
   -------------------------------------------
   Source: https://github.com/aptos-labs/aptos-core
   Sparse checkout: aptos-move/framework and aptos-move/move-examples

   Contains:

   aptos-move/framework/
   - aptos-framework/              : Core framework (80+ modules)
     * Account management
     * Coin and fungible asset operations
     * Consensus and staking
     * Governance and voting
     * Gas and storage
     * Events and transactions
     * Object standard

   - aptos-stdlib/                 : Aptos standard library extensions
   - move-stdlib/                  : Move language standard library
   - aptos-token/                  : Token standard implementation
   - aptos-token-objects/          : Object-based token standard

   aptos-move/move-examples/
   - move-tutorial/                : Step-by-step Move language tutorial
   - Various example contracts demonstrating core concepts

4. MOVE BY EXAMPLES (move-by-examples/)
   -------------------------------------------
   Source: https://github.com/aptos-labs/move-by-examples

   15 practical examples:
   - simple-todo-list              : Basic contract patterns
   - advanced-todo-list            : Complex data structures
   - billboard                     : Custom data management
   - dutch-auction                 : Auction mechanisms
   - friend-tech                   : Social finance patterns
   - fungible-asset-launchpad      : Token creation
   - fungible-asset-vesting        : Time-locked distributions
   - fungible-asset-voting         : Governance patterns
   - fungible-asset-with-buy-sell-tax : Tax mechanisms
   - fungible-asset-with-permission : Access control
   - multidex-router               : Cross-contract calls
   - nft-launchpad                 : NFT creation
   - nft-marketplace               : Trading mechanics
   - surf-for-type-safety          : Type system demos
   - telegram-boilerplate-template : Bot integration

===========================================
KEY CONCEPTS FOR CLAUDE CODE SKILLS
===========================================

MOVE LANGUAGE FUNDAMENTALS:
- Modules and Scripts
- Structs and Resources (linear types)
- Abilities: copy, drop, store, key
- Generics and type parameters
- References and borrowing
- Signers (account authentication)
- Global storage operators (move_to, borrow_global, etc.)

APTOS-SPECIFIC FEATURES:
- Objects: Composable on-chain primitives
- Fungible Assets: Token standard (replaces Coin)
- Digital Assets: NFT standard
- Entry functions: Transaction endpoints
- View functions: Read-only queries
- Events: Indexable state changes
- Tables and smart tables: Key-value storage
- Keyless accounts: Web2 auth integration

SMART CONTRACT PATTERNS:
- Resource-oriented programming
- Module upgrades and compatibility
- Access control patterns
- Treasury and vesting
- Marketplace and auction mechanics
- Governance and voting
- Cross-contract interactions
- Testing strategies

DEVELOPMENT WORKFLOW:
1. Write Move modules (.move files)
2. Define Move.toml package manifest
3. Compile: aptos move compile
4. Test: aptos move test
5. Publish: aptos move publish
6. Interact via TypeScript SDK or CLI

SECURITY CONSIDERATIONS:
- Resource safety (no duplication/deletion)
- Access control with signers
- Integer overflow protection
- Formal verification with Move Prover
- Upgrade policies and immutability
- Reentrancy protection patterns

===========================================
USING THESE RESOURCES FOR CLAUDE CODE
===========================================

1. REFERENCE DOCUMENTATION:
   - Use aptos-dev-llms-full.txt for comprehensive API reference
   - Search through framework docs for specific module usage
   - Reference move-by-examples/ for implementation patterns

2. LEARNING PATH:
   a. Start with aptos-core/aptos-move/move-examples/move-tutorial/
   b. Study the Move Book concepts in aptos-dev-llms-full.txt
   c. Review framework modules in aptos-core/aptos-move/framework/
   d. Explore practical examples in move-by-examples/

3. BUILDING SKILLS:
   Focus areas:
   - Contract structure and organization
   - Resource and asset management
   - Testing and verification
   - Deployment and upgrades
   - SDK integration
   - Common patterns and anti-patterns

4. QUICK REFERENCE:
   - Framework modules: aptos-core/aptos-move/framework/aptos-framework/doc/
   - Standard lib: aptos-core/aptos-move/framework/move-stdlib/doc/
   - Code examples: move-by-examples/
   - Language spec: move/language/documentation/

===========================================
IMPORTANT URLS
===========================================

Official Docs:       https://aptos.dev
Smart Contracts:     https://aptos.dev/build/smart-contracts
Move Book:           https://aptos.dev/build/smart-contracts/book
API Reference:       https://aptos.dev/nodes/aptos-api-spec
TypeScript SDK:      https://aptos.dev/build/sdks/ts-sdk
CLI Installation:    https://aptos.dev/tools/aptos-cli

GitHub Repositories:
- aptos-labs/aptos-core         : Main Aptos blockchain
- aptos-labs/move               : Move language
- aptos-labs/aptos-framework    : Framework mirror
- aptos-labs/move-by-examples   : Practical examples

Community:
- Discord:           https://discord.gg/aptoslabs
- Forum:             https://forum.aptoslabs.com
- GitHub Discussions: https://github.com/aptos-labs/aptos-core/discussions

===========================================
FILE SIZES AND STATISTICS
===========================================

aptos-dev-llms-full.txt:   2.4MB (57,601 lines)
aptos-dev-llms-small.txt:  2.4MB (57,593 lines)
move/ repository:          ~50MB (full language implementation)
aptos-core/ (sparse):      ~100MB (framework + examples)
move-by-examples/:         ~5MB (15 example projects)

Total documentation size:  ~160MB

===========================================
NEXT STEPS
===========================================

1. Read the aptos-dev-llms-full.txt for comprehensive overview
2. Explore move-by-examples/ for practical patterns
3. Study framework source in aptos-core/aptos-move/framework/
4. Practice with move-tutorial examples
5. Build test contracts using learned patterns
6. Review security best practices in documentation

===========================================
MAINTENANCE
===========================================

To update these resources:

1. Update llms.txt files:
   curl -s https://aptos.dev/llms-full.txt > aptos-dev-llms-full.txt
   curl -s https://aptos.dev/llms-small.txt > aptos-dev-llms-small.txt

2. Update repositories:
   cd move && git pull
   cd aptos-core && git pull
   cd move-by-examples && git pull

Last updated: 2025-11-12
