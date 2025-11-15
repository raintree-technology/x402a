# x402s Shelby Deployment Guide

**Status**: ✅ READY FOR DEPLOYMENT

## What is x402s?

x402s bridges **x402a Aptos payments** with **Shelby Protocol storage** using HTTP 402.

- Users pay in APT → Get Shelby session with chunksets
- Session-based access control for Shelby storage
- Built on SHELBYNET (Aptos-based network)

---

## Quick Start

### 1. Get Geomi API Key (Recommended)

Visit **https://geomi.dev** to get your Shelby API key:

1. Create account
2. Click "API Resource"
3. Select `Shelbynet` network
4. Generate key (format: `aptoslabs_***`)

> **Note**: Works in anonymous mode without key, but with lower rate limits

### 2. Configure Environment

Update `.env`:

```bash
# Shelby Configuration
SHELBY_API_KEY=aptoslabs_YOUR_KEY_HERE  # From geomi.dev
SHELBY_NETWORK=SHELBYNET
SHELBY_PAYMENT_RECIPIENT=0x719c8c157cd82e012b57aba5ab65a970316b21a957b9340de89a10b5393168db

# Pricing (0.001 APT per chunkset)
SHELBY_OCTAS_PER_CHUNKSET=100000
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Build Packages

```bash
bun run build
```

---

## Server Implementation

### Create Shelby Gateway

```typescript
// lib/shelby-gateway.ts
import { X402Facilitator } from 'x402a/server';
import { ShelbyGateway } from 'x402s/server';

export const shelbyGateway = new ShelbyGateway({
  facilitator: new X402Facilitator({
    privateKey: process.env.x402_facilitator_private_key!,
    contractAddress: process.env.contract_address!,
    network: 'testnet',
  }),
  network: 'SHELBYNET',
  apiKey: process.env.SHELBY_API_KEY,  // Optional
  pricing: {
    octasPerChunkset: process.env.SHELBY_OCTAS_PER_CHUNKSET || "100000",
    minPaymentOctas: "1000000",  // 0.01 APT minimum
    maxChunksetsPerSession: 1000,
  }
});
```

### Add Middleware (Next.js)

```typescript
// middleware.ts
import { createShelbyMiddleware } from 'x402s-next/middleware';
import { shelbyGateway } from './lib/shelby-gateway';

export default createShelbyMiddleware({
  gateway: shelbyGateway,
  payTo: process.env.SHELBY_PAYMENT_RECIPIENT!,
  routes: {
    "/api/protected": {
      price: "10000000",        // 0.1 APT
      chunksets: 100,           // Gets 100 chunksets
      description: "Protected API Access",
      chunksetsPerRequest: 1,   // Each request = 1 chunkset
    }
  }
});

export const config = {
  matcher: ['/api/protected/:path*']
};
```

### Protected API Route

```typescript
// app/api/protected/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Middleware already verified payment/session
  const sessionId = request.headers.get('X-Shelby-Session');
  const chunksetsRemaining = request.headers.get('X-Shelby-Chunksets-Remaining');

  return NextResponse.json({
    message: "Access granted!",
    session: {
      id: sessionId,
      chunksetsRemaining: Number(chunksetsRemaining),
    }
  });
}
```

---

## Client Implementation

```typescript
import { useShelbySession } from 'x402s/client';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

function MyComponent() {
  const { signTransaction } = useWallet();

  const {
    session,
    createSession,
    needsRefill,
    isCreating
  } = useShelbySession({
    createSessionEndpoint: '/api/shelby/sessions',
    getSessionEndpoint: '/api/shelby/sessions',
  });

  const handlePayment = async () => {
    // 1. Build transaction
    const txRes = await fetch('/api/facilitator/build', {
      method: 'POST',
      body: JSON.stringify({
        from: userAddress,
        to: process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT,
        amount: "10000000", // 0.1 APT
      })
    });
    const { transactionPayload } = await txRes.json();

    // 2. Sign with wallet
    const authenticator = await signTransaction(transactionPayload);

    // 3. Create session
    await createSession({
      from: userAddress,
      to: process.env.NEXT_PUBLIC_PAYMENT_RECIPIENT,
      amount: "10000000",
      authenticator,
      ...transactionPayload
    });
  };

  return (
    <div>
      {needsRefill ? (
        <button onClick={handlePayment} disabled={isCreating}>
          Pay 0.1 APT to Access
        </button>
      ) : (
        <div>
          <p>Session active</p>
          <p>Chunksets: {session?.chunksetsRemaining}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Deployment Checklist

### Environment Variables

- [x] `SHELBY_API_KEY` - From geomi.dev (optional)
- [x] `SHELBY_NETWORK=SHELBYNET`
- [x] `SHELBY_PAYMENT_RECIPIENT` - Your Aptos address
- [x] `SHELBY_OCTAS_PER_CHUNKSET` - Pricing (default: 100000)
- [x] `x402_facilitator_private_key` - Facilitator key
- [x] `contract_address` - x402a contract address

### Verification

```bash
# 1. Build all packages
bun run build

# 2. Type check
bun run typecheck

# 3. Run tests
bun run test

# 4. Start dev server
cd examples/shelby-demo
bun run dev
```

### Deploy to Vercel

```bash
# Push to GitHub
git add .
git commit -m "Add x402s Shelby integration"
git push

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

---

## Testing Flow

### 1. Request Protected Resource

```bash
curl http://localhost:3000/api/protected
```

Response:
```json
HTTP 402 Payment Required

{
  "x402Version": 1,
  "scheme": "exact",
  "maxAmountRequired": "10000000",
  "resource": "/api/protected",
  "payTo": "0x719c...",
  "metadata": {
    "chunksets": 100,
    "chunksetsPerRequest": 1
  }
}
```

### 2. Make Payment

- Use Petra wallet
- Sign transaction (user keeps control)
- Facilitator submits & pays gas
- Session created with 100 chunksets

### 3. Access Resource

```bash
curl http://localhost:3000/api/protected \
  -H "X-Shelby-Session: shelby_1234..."
```

Response:
```json
HTTP 200 OK

{
  "message": "Access granted!",
  "session": {
    "id": "shelby_1234...",
    "chunksetsRemaining": 99
  }
}
```

---

## Network Configuration

### SHELBYNET Details

- **Network**: SHELBYNET (Aptos-based)
- **Aptos RPC**: `https://api.shelbynet.shelby.xyz/v1`
- **Shelby RPC**: `https://api.shelbynet.shelby.xyz/shelby`
- **Indexer**: `https://api.shelbynet.shelby.xyz/v1/graphql`

### Contract Addresses

- **x402a Contract**: `0x966eb1d2d3ed1e199f7d92335b5bb40f7a79dbbfb142ed951035bf78ba1b9744`
- **Facilitator**: `0x719c8c157cd82e012b57aba5ab65a970316b21a957b9340de89a10b5393168db`

---

## Pricing Examples

| APT Payment | Chunksets | Cost per Chunkset | Use Case |
|-------------|-----------|-------------------|----------|
| 0.01 APT    | 10        | 0.001 APT         | Light browsing |
| 0.1 APT     | 100       | 0.001 APT         | Regular usage |
| 1.0 APT     | 1000      | 0.001 APT         | Power user |

**Chunkset size**: ~10 MiB of data (erasure coded)

---

## Troubleshooting

### "Invalid session ID"
- Session expired (24 hours)
- Session depleted (no chunksets left)
- **Solution**: Make new payment

### "Insufficient chunksets"
- Session running low
- **Solution**: Create new session or refill (make another payment)

### "Payment verification failed"
- Transaction not confirmed on-chain
- Invalid signature
- **Solution**: Check wallet connection, retry payment

### Build errors
```bash
# Clear cache and rebuild
bun run clean
bun install
bun run build
```

---

## Next Steps

1. **Get Geomi API key** → https://geomi.dev
2. **Update `.env`** with your key
3. **Deploy example app** to test flow
4. **Monitor usage** via logs
5. **Adjust pricing** based on usage patterns

---

## Resources

- [Shelby Protocol Docs](https://docs.shelby.xyz)
- [Geomi Platform](https://geomi.dev)
- [x402a Documentation](./packages/x402a/README.md)
- [Aptos Documentation](https://aptos.dev)

---

**Built with**: x402a + Shelby Protocol + Aptos
**Status**: Testnet/SHELBYNET ready
**Version**: x402s v0.1.0
