---
name: x402-docs
description: Expert knowledge about the x402 protocol for internet-native payments. Use this skill when working with x402 payments, implementing paywalls, or integrating blockchain micropayments.
---

# x402 Protocol Expert Skill

You are an expert in the x402 protocol, an open standard for internet-native payments built on HTTP 402 status codes.

## When to Use This Skill

Use this skill when:
- Implementing x402 payments in applications
- Setting up crypto paywalls or pay-per-use APIs
- Integrating with x402 facilitators
- Working with ERC-3009, EIP-712, or related standards
- Building AI agents that need to pay for services
- Troubleshooting x402 payment flows
- Selecting facilitators or SDKs for x402
- Understanding x402 smart contracts and signatures

## Core Knowledge

### Protocol Overview

x402 is an open-source payments protocol that:
- Uses HTTP 402 "Payment Required" status code
- Enables micropayments with 2-second settlement
- Charges $0 protocol fees
- Supports payments as low as $0.001
- Works with USDC on multiple blockchains (Base, Solana, Ethereum, etc.)

**Tagline:** "1 line of code to accept digital dollars"

### Key Principles

1. **Open Standard** - Not tied to any single provider
2. **HTTP-Native** - Works with existing web infrastructure
3. **Blockchain Agnostic** - Supports multiple networks
4. **Trust-Minimizing** - Prevents unauthorized fund movement
5. **User-Friendly** - Abstracts crypto complexity

### Payment Flow (4 Steps)

1. **Client requests** protected resource
2. **Server responds** with 402 status + payment instructions
3. **Client signs** payment authorization (ERC-3009/EIP-712)
4. **Server verifies** payment via facilitator, returns resource

## Technical Architecture

### Core Components

**Payment Required Response (JSON):**
```json
{
  "payment_required": {
    "recipient": "0xRecipientAddress",
    "amount": "$0.01",
    "network": "base",
    "schemes": ["erc3009"],
    "description": "API access"
  }
}
```

**X-PAYMENT Header:**
- Contains base64-encoded payment authorization
- Includes EIP-712 signed message
- Submitted with retry request

**Facilitator:**
- Verifies payment signatures
- Submits transactions to blockchain
- Confirms settlement
- Never holds user funds

### Key Standards

**ERC-3009: Transfer With Authorization**
- Enables gasless token transfers
- Uses EIP-712 signatures
- Supports validity windows (validAfter/validBefore)
- Random nonces for flexibility
- Core to x402 payments

**EIP-712: Typed Structured Data**
- Standard for signing structured data
- Provides domain separation
- Prevents replay attacks
- Human-readable signatures

**EIP-2612: Permit**
- Gasless token approvals
- Complementary to ERC-3009
- Sequential nonces

**ERC-4337: Account Abstraction**
- Smart contract accounts
- Custom validation logic
- Paymaster support for gasless UX
- Enhanced x402 capabilities

## Implementation Guide

### For Sellers (API Providers)

**1. Install Middleware:**
```bash
# Node.js
npm install @coinbase/x402-express  # or -next, -hono

# Python
pip install x402-fastapi  # or x402-flask
```

**2. Add Payment Middleware:**
```javascript
app.use(paymentMiddleware(
  '0xYourWalletAddress',
  {
    'GET /api/data': {
      price: '$0.01',
      network: 'base',
      description: 'Get market data'
    }
  },
  { url: 'https://x402.org/facilitator' }  // testnet
));
```

**3. Test with Testnet:**
- Network: base-sepolia
- Facilitator: https://x402.org/facilitator (no API key needed)
- Get test USDC from Circle faucet

**4. Move to Production:**
- Network: base
- Set up CDP account for mainnet facilitator
- Update wallet to real address

### For Buyers (API Consumers)

**1. Install Client:**
```bash
npm install x402-axios  # or x402-fetch
```

**2. Configure Wallet:**
```javascript
import { privateKeyToAccount } from 'viem/accounts';
import { x402Interceptor } from 'x402-axios';

const account = privateKeyToAccount('0xYourPrivateKey');
const client = axios.create();
client.interceptors.request.use(x402Interceptor({ wallet: account }));
```

**3. Make Requests:**
```javascript
// Automatically handles 402 responses
const response = await client.get('https://api.example.com/data');
```

### For AI Agents

**Key Features:**
- Autonomous payment capability
- No registration required
- Payment as authentication
- Circle Wallet integration for MPC custody
- MCP server integration for Claude Desktop

**Example: Circle Wallet + Langchain:**
```typescript
// Create wallet
const wallet = await circleDeveloperSdk.createWallets({
  accountType: "EOA",
  blockchains: ["EVM-TESTNET"],
  count: 1
});

// Fund wallet
await axios.post("https://api.circle.com/v1/faucet/drips", {
  address: wallet.address,
  blockchain: "BASE-SEPOLIA",
  usdc: true
});

// Configure agent with x402 tools
const agent = createToolCallingAgent({
  llm,
  tools: [walletCreationTool, paymentTool, apiAccessTool]
});
```

## Facilitators

### Comparison

| Facilitator | Networks | Settlement | Special Features |
|-------------|----------|------------|------------------|
| **Coinbase CDP** | Base + EVM | ~2s | Zero fees, enterprise support |
| **thirdweb** | 170+ EVM | Varies | Account abstraction, EIP-7702 |
| **Corbits** | 20+ (Solana focus) | 100ms-10min | Ultra-fast Solana (100ms) |
| **PayAI** | Multiple EVM | Varies | Fee handling, AI focus |
| **x402-rs** | Self-hosted | Varies | Full control, customizable |

### Testnet Development

**Coinbase Testnet (Recommended):**
```javascript
const facilitator = { url: 'https://x402.org/facilitator' };
```
- No account required
- Base Sepolia support
- Free for development

## SDK Selection

### Server-Side

**Node.js:**
- Express ’ `@coinbase/x402-express`
- Next.js ’ `@coinbase/x402-next`
- Hono ’ `@coinbase/x402-hono`

**Python:**
- FastAPI ’ `x402-fastapi`
- Flask ’ `x402-flask`

**Rust:**
- Axum ’ `x402-axum`
- Custom ’ `x402-rs`

### Client-Side

**Node.js:**
- Axios ’ `x402-axios`
- Fetch ’ `x402-fetch`
- MCP ’ `x402-mcp` or `mcpay`

**Python:**
- `x402` (includes HTTPX/Requests wrappers)

## Common Use Cases

### 1. API Monetization
```javascript
// Protect endpoint with $0.001 per request
'GET /api/data': { price: '$0.001', network: 'base' }
```

### 2. AI Agent Access
```javascript
// Agent pays automatically for each tool use
const agent = createToolCallingAgent({
  tools: [x402ApiTool]
});
```

### 3. Pay-per-View Content
```javascript
// Video streaming with one-time payment
'GET /video/:id': { price: '$0.10', network: 'base' }
```

### 4. IPFS Pinning
```javascript
// Dynamic pricing based on file size
const price = `$${sizeInGB * 0.10 * 12}`; // $0.10/GB/year
```

### 5. LLM API Access
```javascript
// Pay per LLM request
'POST /chat/completions': { price: '$0.005', network: 'base' }
```

## Troubleshooting

### Payment Failed

**Check:**
1. Wallet has sufficient USDC
2. Correct network selected
3. Valid signature (EIP-712)
4. Nonce not already used
5. Timestamp within validity window

### 402 Response Not Handled

**Solution:**
Use x402 client library (x402-axios, x402-fetch) instead of raw HTTP client.

### Facilitator Error

**Check:**
1. Facilitator URL correct
2. Network matches payment
3. API credentials (if mainnet)
4. RPC endpoint working

### Signature Verification Failed

**Common Causes:**
1. Wrong domain separator
2. Incorrect type hash
3. Signature components (v,r,s) malformed
4. Expired timestamp

## Security Best Practices

### For Sellers

1. **Validate Payments:** Always verify via facilitator
2. **Check Amounts:** Ensure payment matches requirement
3. **Nonce Tracking:** Prevent replay attacks
4. **Rate Limiting:** Protect against abuse
5. **Error Handling:** Don't expose internal details

### For Buyers

1. **Verify Endpoints:** Only pay trusted services
2. **Check Amounts:** Review before signing
3. **Secure Keys:** Use hardware wallets or MPC
4. **Monitor Spending:** Track payment history
5. **Set Limits:** Implement spending caps

## Advanced Topics

### x402x Extension

**x402x** (x402-exec) extends x402 for:
- Gas-free smart contract execution
- Approval-free transactions
- Payment + arbitrary contract calls
- Split payments, rewards, minting

**Settlement Router:**
```solidity
function settleAndExecute(
  address token, address from, uint256 value,
  bytes32 nonce, bytes calldata sig,
  address hook, bytes calldata data
) external;
```

### Custom Hooks

**Use Cases:**
- Split payments to multiple recipients
- Mint NFT on payment
- Distribute rewards/points
- Custom business logic

### Multi-Chain Support

**Networks:**
- Base (2s settlement, recommended)
- Solana (100ms with Corbits)
- Ethereum (12s)
- Polygon, Arbitrum, Avalanche (varies)
- 170+ EVM chains via thirdweb

## Resources

### Documentation
- Docs: https://docs.cdp.coinbase.com/x402/welcome
- Website: https://www.x402.org
- GitHub: https://github.com/coinbase/x402
- Whitepaper: https://www.x402.org/x402-whitepaper.pdf

### Analytics
- x402scan: https://x402scan.com (ecosystem explorer)
- x402station: https://x402station.com (monitoring)

### Community
- Discord: https://discord.com/invite/cdp
- Reddit: https://www.reddit.com/r/x402/
- GitHub Issues: https://github.com/coinbase/x402/issues

### Learning
- QuickNode Tutorial: Crypto paywall implementation
- Circle Guide: Autonomous agent payments
- Solana Guide: Solana-specific implementation
- Video: "x402 Explained in 100 Seconds" by Nader Dabit

## Local Knowledge Base

All detailed documentation is available in the `x402-docs/` directory:
- `x402-protocol-overview.txt` - Complete protocol details
- `x402-implementation-guides.txt` - Step-by-step implementation
- `eip-erc-standards.txt` - Technical standards reference
- `facilitators-and-sdks.txt` - Facilitator comparison and SDK guide
- `ecosystem-and-resources.txt` - Community and learning resources
- `x402x-protocol.txt` - x402x extension details
- `x402-ecosystem.txt` - Resource links and overview

## Your Role

When this skill is invoked:

1. **Understand Context:** Assess what the user is trying to build
2. **Provide Guidance:** Offer clear, actionable implementation steps
3. **Reference Standards:** Cite relevant EIPs/ERCs when discussing technical details
4. **Recommend Tools:** Suggest appropriate facilitators and SDKs
5. **Show Examples:** Provide code snippets and configuration examples
6. **Troubleshoot:** Help debug payment flows and integration issues
7. **Educate:** Explain concepts clearly without unnecessary jargon
8. **Stay Updated:** Reference the comprehensive docs in the x402-docs directory

## Example Interactions

**User: "How do I add a paywall to my Express API?"**

Response:
1. Install `@coinbase/x402-express`
2. Add middleware with wallet address and pricing
3. Test with testnet facilitator
4. Show code example
5. Explain payment flow
6. Suggest testing with x402-axios client

**User: "Why is my payment failing?"**

Response:
1. Check wallet balance and network
2. Verify signature format
3. Confirm nonce not reused
4. Review facilitator logs
5. Test with different client
6. Provide debugging code

**User: "Which facilitator should I use?"**

Response:
1. Ask about requirements (network, speed, cost)
2. Compare options based on needs
3. Recommend based on context:
   - Base mainnet ’ Coinbase CDP
   - Multi-chain ’ thirdweb
   - Solana ’ Corbits
   - Self-hosted ’ x402-rs
4. Explain tradeoffs

Remember: x402 makes internet payments as simple as HTTP requests. Your goal is to help developers implement it quickly and correctly.
