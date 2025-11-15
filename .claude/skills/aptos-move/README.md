# Aptos Move Skills for Claude Code

This directory contains 8 specialized skills for Aptos Move smart contract development. These skills provide Claude with deep domain expertise for building, reviewing, testing, and deploying Move contracts on Aptos.

## Available Skills

### 1. `move-contract-generator.md`
**Purpose**: Generate production-ready Move smart contracts

**Capabilities**:
- Create complete Move modules from requirements
- Use modern Aptos patterns (Objects, Fungible Assets, Digital Assets)
- Include proper error handling and access control
- Generate events for state changes
- Add comprehensive documentation

**Use when**: Starting a new contract or adding features

**Example**: "Generate a staking contract that allows users to stake NFTs and earn rewards"

---

### 2. `move-code-reviewer.md`
**Purpose**: Review Move code for issues and improvements

**Capabilities**:
- Identify security vulnerabilities
- Check resource safety and access control
- Verify proper error handling
- Suggest optimizations
- Ensure best practices compliance
- Provide corrected code snippets

**Use when**: Reviewing existing contracts or PRs

**Example**: "Review this Move contract for security issues: [paste code]"

---

### 3. `aptos-fungible-assets.md`
**Purpose**: Expert guidance on Fungible Asset (token) creation

**Capabilities**:
- Create FA tokens with metadata
- Implement minting/burning
- Add vesting schedules
- Implement tax mechanisms
- Add governance/voting
- Handle permissions

**Use when**: Building token systems

**Example**: "Create a governance token with vesting and voting capabilities"

---

### 4. `aptos-digital-assets.md`
**Purpose**: Expert guidance on NFT/Digital Asset creation

**Capabilities**:
- Create NFT collections
- Mint NFTs with properties
- Build NFT marketplaces
- Implement auctions
- Add staking for NFTs
- Dynamic NFT properties

**Use when**: Building NFT projects

**Example**: "Build an NFT marketplace with listing and bidding functionality"

---

### 5. `move-testing.md`
**Purpose**: Generate comprehensive test suites

**Capabilities**:
- Create unit tests for all functions
- Test success and failure cases
- Cover edge cases
- Test multi-user interactions
- Time-based testing
- Event verification

**Use when**: Adding tests to contracts

**Example**: "Generate a test suite for this token contract covering all edge cases"

---

### 6. `aptos-objects.md`
**Purpose**: Expert guidance on the Aptos Object standard

**Capabilities**:
- Create transferable objects
- Use Object refs (ExtendRef, TransferRef, DeleteRef)
- Build composable systems
- Implement object collections
- Create nested objects

**Use when**: Building transferable resources

**Example**: "Create a game item system using Objects where items can be transferred and upgraded"

---

### 7. `move-security.md`
**Purpose**: Deep security analysis and auditing

**Capabilities**:
- Identify vulnerabilities (Critical to Low severity)
- Check for common exploits
- Verify economic safety
- Review upgrade safety
- Provide detailed audit reports
- Suggest fixes

**Use when**: Security auditing contracts

**Example**: "Perform a security audit on this DeFi contract"

---

### 8. `aptos-typescript-sdk.md`
**Purpose**: Integrate Move contracts with TypeScript/React apps

**Capabilities**:
- Setup Aptos SDK
- Connect wallets
- Call entry functions
- Query view functions
- Listen to events
- Handle errors
- Create React hooks

**Use when**: Building frontend integrations

**Example**: "Generate TypeScript code to interact with my token contract"

---

## How to Use Skills

### In Claude Code

Skills are automatically available in Claude Code. Reference them naturally in your requests:

```
"Use the move-contract-generator skill to create a token contract"

"Review this code with the move-code-reviewer skill"

"Help me test this contract using the move-testing skill"
```

### Skill Combinations

Skills can work together for complete workflows:

**Example 1: Full Token Project**
```
1. move-contract-generator: Generate token contract
2. aptos-fungible-assets: Add vesting and governance
3. move-testing: Create test suite
4. move-security: Security audit
5. aptos-typescript-sdk: Build frontend
```

**Example 2: NFT Marketplace**
```
1. aptos-digital-assets: Create NFT + marketplace contracts
2. aptos-objects: Optimize using Object patterns
3. move-testing: Test marketplace logic
4. move-security: Audit for exploits
5. aptos-typescript-sdk: Build UI
```

**Example 3: DeFi Protocol**
```
1. move-contract-generator: Create protocol contracts
2. aptos-fungible-assets: Token integration
3. move-security: Deep security review
4. move-testing: Comprehensive tests
5. aptos-typescript-sdk: Frontend integration
```

## Skill Development Notes

### Knowledge Base
All skills reference the comprehensive documentation located in the same directory:
- `./aptos-move-docs/aptos-dev-llms-full.txt` - Complete Aptos API reference
- `./aptos-move-docs/MOVE_QUICK_REFERENCE.txt` - Quick syntax reference
- `./aptos-move-docs/move-by-examples/` - Practical examples
- `./aptos-move-docs/aptos-core/aptos-move/framework/` - Framework source

### Best Practices Encoded
Each skill includes:
- ✅ Modern Aptos patterns (Objects, FA, DA)
- ✅ Security considerations
- ✅ Error handling
- ✅ Testing requirements
- ✅ Code examples
- ✅ Common pitfalls to avoid

### Continuous Improvement
To keep skills updated:
1. Update documentation: `cd aptos-move-docs && git pull` (in repos)
2. Refresh llms.txt: `curl https://aptos.dev/llms-full.txt > aptos-move-docs/aptos-dev-llms-full.txt`
3. Review new Aptos features and update skills
4. Add learnings from real projects

## Quick Reference: When to Use Which Skill

| Task | Skill |
|------|-------|
| Generate new contract | `move-contract-generator` |
| Review existing code | `move-code-reviewer` |
| Create tokens | `aptos-fungible-assets` |
| Create NFTs | `aptos-digital-assets` |
| Write tests | `move-testing` |
| Use Objects pattern | `aptos-objects` |
| Security audit | `move-security` |
| Build frontend | `aptos-typescript-sdk` |

## Examples by Use Case

### DeFi Development
- Protocol contracts: `move-contract-generator`
- Token integration: `aptos-fungible-assets`
- Security: `move-security`
- Testing: `move-testing`

### NFT Projects
- NFT creation: `aptos-digital-assets`
- Marketplace: `aptos-objects` + `aptos-digital-assets`
- Frontend: `aptos-typescript-sdk`

### Gaming
- Game assets: `aptos-objects`
- In-game currency: `aptos-fungible-assets`
- Item marketplace: `aptos-digital-assets`

### DAOs/Governance
- Governance token: `aptos-fungible-assets`
- Voting system: `move-contract-generator`
- Treasury: `move-security` (audit)

## Support

For issues or improvements:
1. Check documentation: `./aptos-move-docs/README.txt`
2. Review examples: `./aptos-move-docs/move-by-examples/`
3. Consult framework: `./aptos-move-docs/aptos-core/aptos-move/framework/`
4. Search full docs: `./aptos-move-docs/aptos-dev-llms-full.txt`

## Version

- **Created**: 2025-11-12
- **Aptos Version**: Latest (Move 2.0)
- **Documentation Base**: aptos.dev llms-full.txt

---

**Remember**: These skills are powered by comprehensive Aptos documentation and real-world examples. They follow official best practices and modern patterns. Use them to build secure, efficient, and maintainable Move smart contracts! 🚀
