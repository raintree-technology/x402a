# x402 on Aptos - Implementation Guide

**x402 Protocol Implementation for Aptos Blockchain**

This guide covers the Aptos-specific implementation of x402, highlighting differences from the EVM-based specification and providing practical examples.

## Overview

While x402 was originally designed for EVM chains (using USDC, ERC-3009, and EIP-712), this implementation adapts the protocol to Aptos using:
- **APT** instead of USDC (native gas token)
- **Ed25519** signatures instead of ECDSA
- **BCS** encoding instead of ABI encoding
- **Move** smart contracts instead of Solidity
- **Petra wallet** message format

---

## Key Differences: EVM vs Aptos

| Aspect | EVM (Original) | Aptos (This Implementation) |
|--------|----------------|----------------------------|
| **Token** | USDC (ERC-20) | APT (native coin) |
| **Signature** | ECDSA (secp256k1) | Ed25519 |
| **Encoding** | ABI (Solidity) | BCS (Binary Canonical Serialization) |
| **Message Format** | EIP-712 typed data | Petra wallet format |
| **Contract** | Solidity | Move |
| **Standard** | ERC-3009 | Custom Move module |

---

## Architecture

```
┌─────────────┐      1. Sign Payment      ┌──────────────┐
│   Client    │─────────────────────────>│  Facilitator │
│  (Browser)  │   Ed25519 + BCS          │   (Server)   │
│   Petra     │                           │              │
└─────────────┘                           └──────────────┘
       │                                          │
       │                                          │
       │ 2. Submit Transaction                    │
       │    entry fun transfer_with_split()       │
       │                                          ▼
       │                                  ┌──────────────┐
       │                                  │   Aptos      │
       │◄─────────────────────────────────│  Blockchain  │
       │  3. Payment Proof (JWT)          │  Move VM     │
       │                                  └──────────────┘
```

---

## Move Smart Contract

**Location**: `packages/core/contract/sources/x402_transfer.move`

### Key Functions

#### `initialize_registry(account: &signer)`
Must be called once per user before making payments. Creates a nonce registry to prevent replay attacks.

```move
public entry fun initialize_registry(account: &signer) {
    let addr = signer::address_of(account);
    if (!exists<NonceRegistry>(addr)) {
        move_to(account, NonceRegistry {
            used_nonces: smart_table::new(),
        });
    };
}
```

**Client-side**: Handled automatically by `useX402Payment` hook on first payment.

#### `transfer_with_authorization(...)`
Single-recipient payment with signature authorization.

```move
public entry fun transfer_with_authorization(
    facilitator: &signer,
    from: address,
    to: address,
    amount: u64,
    nonce: vector<u8>,
    public_key_bytes: vector<u8>,
    signature_bytes: vector<u8>,
) acquires NonceRegistry
```

**Key Points**:
- Facilitator pays gas
- User signs off-chain
- Nonce prevents replay
- Ed25519 signature verification

#### `transfer_with_split(...)`
Multi-recipient payment for platform fee splits.

```move
public entry fun transfer_with_split(
    facilitator: &signer,
    from: address,
    recipients: vector<address>,
    amounts: vector<u64>,
    nonce: vector<u8>,
    public_key_bytes: vector<u8>,
    signature_bytes: vector<u8>,
) acquires NonceRegistry
```

**Example**: Pay artist $0.99 + platform 1.5% = $0.015
- `recipients = [artist_addr, platform_addr]`
- `amounts = [9900000, 150000]` (octas: 1 APT = 100,000,000 octas)

---

## Signature Generation (Client)

**Location**: `packages/core/src/client/signature.ts`

### BCS Message Construction

The most critical part - client and contract MUST construct identical messages.

#### Single Transfer
```typescript
// Message = BCS(from) + BCS(to) + BCS(amount) + nonce
const message = new Uint8Array([
  ...bcs.serializeAddress(from),
  ...bcs.serializeAddress(to),
  ...bcs.serializeU64(amount),
  ...nonce,
]);
```

#### Split Transfer
```typescript
// Message = BCS(from) + BCS(recipients) + BCS(amounts) + nonce
const message = new Uint8Array([
  ...bcs.serializeAddress(from),
  ...bcs.serializeVector(recipients, bcs.serializeAddress),
  ...bcs.serializeVector(amounts, bcs.serializeU64),
  ...nonce,
]);
```

**Critical**: Nonce is appended AFTER BCS encoding, not included as a BCS field.

### Petra Wallet Signing

Petra wallet requires a specific message format:

```typescript
const fullMessage = `APTOS
message: 0x${messageHex}
nonce: undefined`;
```

**Why "nonce: undefined"?**
- Petra's `signMessage()` always adds a nonce field
- We use `undefined` because our nonce is embedded in the message
- Contract expects this exact format for verification

### Complete Signing Flow

```typescript
import { signSplitMessage } from '@x402/aptos-core';

const result = await signSplitMessage(
  wallet,
  userAddress,
  [artistAddress, platformAddress],
  ['9900000', '150000'], // Octas as strings
  nonce
);

// Result: { signature, publicKey }
```

---

## React Integration

**Location**: `packages/react/src/useX402Payment.ts`

### Basic Usage

```typescript
import { useX402Payment } from '@x402/aptos-react';

function TipButton() {
  const { executePayment, isProcessing, paymentStatus } = useX402Payment({
    settlementEndpoint: '/api/x402/settle',
    platformFeePercentage: 0.015, // 1.5%
  });

  const handleTip = async () => {
    const proof = await executePayment({
      amount: 1.0, // 1 APT
      recipientAddress: artistWallet,
      paymentType: 'tip',
      resourceId: 'track_abc123',
      description: 'Tip for awesome track',
    });

    if (proof) {
      // Payment successful, proof is a JWT
      console.log('Payment proof:', proof);
    }
  };

  return (
    <button onClick={handleTip} disabled={isProcessing}>
      {isProcessing ? 'Processing...' : 'Tip 1 APT'}
    </button>
  );
}
```

### Automatic Features

1. **Registry Auto-Initialization**
   - Detects if user's nonce registry exists
   - Prompts user to initialize on first payment
   - Handles transaction and waits for confirmation

2. **Fee Splitting**
   - Calculates platform fee automatically
   - Creates split payment: `[artistAmount, platformFee]`
   - Single signature covers both recipients

3. **Payment Proof**
   - Returns JWT token on success
   - Contains: txHash, from, to, amount, timestamp
   - Use for access control/verification

---

## Server Facilitator

**Location**: `packages/server/src/facilitator.ts`

### Settlement Endpoint

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const aptos = new Aptos(new AptosConfig({ network: Network.TESTNET }));

app.post('/api/x402/settle', async (req, res) => {
  const { paymentHeader, paymentRequirements } = req.body;

  // 1. Decode payment
  const payment = JSON.parse(atob(paymentHeader));

  // 2. Verify signature (optional - contract will do this)
  // 3. Check nonce not used
  const isUsed = await aptos.view({
    function: `${CONTRACT_ADDR}::x402_transfer::is_nonce_used`,
    functionArguments: [payment.payload.from, payment.payload.nonce],
  });

  if (isUsed[0]) {
    return res.status(400).json({ error: 'Nonce already used' });
  }

  // 4. Submit transaction
  const txn = await aptos.transaction.build.simple({
    sender: FACILITATOR_ADDRESS,
    data: {
      function: `${CONTRACT_ADDR}::x402_transfer::transfer_with_split`,
      functionArguments: [
        payment.payload.from,
        payment.payload.to,
        payment.payload.amount,
        payment.payload.nonce,
        payment.payload.publicKey,
        payment.payload.signature,
      ],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: facilitatorAccount,
    transaction: txn,
  });

  // 5. Wait for confirmation
  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });

  // 6. Generate proof
  const proof = generateProofJWT({
    txHash: committedTxn.hash,
    from: payment.payload.from,
    to: payment.payload.to,
    amount: payment.payload.amount,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    txHash: committedTxn.hash,
    proof,
  });
});
```

---

## TOON Integration for Analytics

Use TOON format to serialize payment data for efficient LLM analysis.

### Export Payment History

```typescript
import { encodePaymentData, estimateTokenSavings } from '@x402/aptos-core/utils/toon';

const payments = [
  {
    txHash: '0x123abc...',
    from: '0xuser123',
    to: ['0xartist', '0xplatform'],
    amount: ['9900000', '150000'],
    nonce: 'nonce_123',
    timestamp: '2025-01-15T10:30:00Z',
    status: 'success',
    facilitator: '0xfacilitator',
    platformFee: '150000',
  },
  // ... more payments
];

const toon = encodePaymentData(payments, { delimiter: '\t' });
const savings = estimateTokenSavings(payments);

console.log(`Token savings: ${savings.savingsPercent.toFixed(1)}%`);
// Output: payments[100]{txHash,from,to,amount,nonce,timestamp,status,facilitator,platformFee}:
//   0x123abc...<tab>0xuser123<tab>["0xartist","0xplatform"]<tab>...
```

### LLM-Powered Fraud Detection

```typescript
import { formatForClaude } from '@x402/aptos-core/utils/toon';

const { systemPrompt, userMessage, metadata } = formatForClaude(
  payments,
  'Identify suspicious payment patterns: same payer/recipient, unusual amounts, or rapid transactions',
  { delimiter: '\t' }
);

const response = await anthropic.messages.create({
  model: 'claude-sonnet-4',
  system: systemPrompt,
  messages: [{ role: 'user', content: userMessage }],
});

console.log(`Tokens saved: ${metadata.tokensSaved}`);
console.log('Analysis:', response.content[0].text);
```

---

## Common Issues & Solutions

### Issue #1: Invalid Signature

**Symptom**: `E_INVALID_SIGNATURE` on every transaction

**Cause**: BCS message construction mismatch between client and contract

**Debug**:
```typescript
import { debugBCSMessage } from '@x402/aptos-core';

debugBCSMessage(from, [to1, to2], [amount1, amount2], nonce);
// Logs: Hex-encoded message that contract will verify
```

**Fix**: Ensure client uses same BCS serialization as contract expects

### Issue #2: Nonce Already Used

**Symptom**: `E_NONCE_ALREADY_USED`

**Cause**: Nonce reuse or concurrent payment attempts

**Fix**:
- Generate fresh nonce for each payment
- Use `generateSecureNonce()` (16 bytes crypto-random)
- Don't retry failed payments with same nonce

### Issue #3: Registry Not Initialized

**Symptom**: `E_REGISTRY_NOT_INITIALIZED` on first payment

**Cause**: User hasn't called `initialize_registry()`

**Fix**: `useX402Payment` handles this automatically - prompts user to initialize

### Issue #4: Amount Calculation Wrong

**Symptom**: Amounts don't sum to expected total

**Cause**: Floating point precision or octa conversion

**Fix**:
```typescript
// ✅ Correct: Use BigInt, convert to octas early
const amountOctas = BigInt(Math.floor(amountAPT * 100_000_000));
const platformFee = BigInt(Math.floor(Number(amountOctas) * 0.015));
const artistAmount = amountOctas - platformFee;

// ❌ Wrong: Floating point arithmetic
const artistAmount = amountAPT * 0.985;
const platformFee = amountAPT * 0.015;
```

---

## Testing

### Move Contract Tests

```bash
cd packages/core/contract
aptos move test
```

Tests include:
- Registry initialization
- Nonce checking
- Transfer validation
- Error cases (zero amount, empty recipients, etc.)

### TypeScript Tests

```bash
cd packages/core
npm run test

cd packages/react
npm run test
```

---

## Deployment Checklist

- [ ] Move contract compiled and tested
- [ ] Contract deployed to testnet
- [ ] Contract address updated in env vars
- [ ] Facilitator wallet funded with APT (for gas)
- [ ] Platform fee recipient configured
- [ ] Frontend connects to correct network
- [ ] TOON analytics endpoints tested
- [ ] Payment flow tested end-to-end

---

## Resources

- **Move Contract**: `packages/core/contract/sources/x402_transfer.move`
- **React Hook**: `packages/react/src/useX402Payment.ts`
- **Signature Utils**: `packages/core/src/client/signature.ts`
- **TOON Integration**: `packages/core/src/utils/toon.ts`
- **Original x402 Spec**: https://www.x402.org/
- **Aptos Docs**: https://aptos.dev/

---

## Support

For issues or questions specific to the Aptos implementation, refer to:

- Contract tests for signature verification details
- React hook source for payment flow
- dAudio live app for reference implementation
