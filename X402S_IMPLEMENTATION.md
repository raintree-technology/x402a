# x402s - Shelby Protocol Integration

## Decision: ✅ Separate Package in Monorepo

**Verdict**: It's **easier** and **better** to create **x402s as a new package** within the existing x402a monorepo.

### Why x402s as a Separate Package?

| Factor | Integrate into x402a | New x402s Package | Winner |
|--------|---------------------|-------------------|---------|
| **Complexity** | High (mixing two payment models) | Low (focused purpose) | ⭐ **x402s** |
| **Maintainability** | Medium (conditional logic everywhere) | High (single responsibility) | ⭐ **x402s** |
| **Time to MVP** | 1-2 weeks | **3-5 days** | ⭐ **x402s** |
| **Code reuse** | High | **High** (imports x402a as dep) | ⭐ **Tie** |
| **User clarity** | Confusing | Clear (Shelby-specific) | ⭐ **x402s** |
| **Bundle size** | Larger | Smaller (tree-shakeable) | ⭐ **x402s** |

### Why in the Same Monorepo?

✅ **Shared tooling** (Turbo, Biome, Vitest, Playwright)
✅ **Workspace dependencies** (`"x402a": "workspace:*"` - no npm publish needed)
✅ **Single CI/CD** pipeline
✅ **Consistent configs** (tsconfig, vitest)
✅ **Easy cross-package changes** (update both in same PR)
✅ **30 minutes to scaffold** vs 3-4 hours for separate repo

---

## What Was Built

### Package Structure

```
x402a/  (monorepo)
├── packages/
│   ├── x402a/              # Existing: Generic HTTP 402 for Aptos
│   ├── x402a-next/         # Existing: Next.js middleware for x402a
│   ├── x402a-contract/     # Existing: Move smart contracts
│   ├── x402a-tools/        # Existing: CLI tools
│   │
│   ├── x402s/              # NEW: Shelby integration ⭐
│   │   ├── src/
│   │   │   ├── types/      # Session, payment types
│   │   │   ├── server/     # ShelbyGateway class
│   │   │   ├── client/     # useShelbySession hook
│   │   │   ├── index.ts    # Main exports
│   │   │   ├── server.ts   # Server-only exports
│   │   │   └── client.ts   # Client-only exports
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   │
│   └── x402s-next/         # NEW: Next.js middleware for Shelby ⭐
│       ├── src/
│       │   └── middleware/
│       │       └── shelby-router.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── turbo.json              # Updated with x402s packages
└── package.json            # Updated workspaces + scripts
```

### Key Files Created

#### 1. **x402s Core SDK** (`packages/x402s/`)

**Types** (`src/types/`):
- `session.ts` - Shelby session types
- `payment.ts` - Payment verification types
- `index.ts` - Type exports

**Server** (`src/server/`):
- `ShelbyGateway.ts` - Main class that:
  - Accepts x402a payments
  - Verifies on Aptos blockchain
  - Converts APT → chunksets
  - Creates/manages Shelby sessions
  - Tracks usage

**Client** (`src/client/hooks/`):
- `useShelbySession.ts` - React hook for:
  - Session state management
  - Payment triggers
  - Auto-refresh
  - Low chunkset warnings

#### 2. **x402s-next Middleware** (`packages/x402s-next/`)

**Middleware** (`src/middleware/`):
- `shelby-router.ts` - Next.js middleware that:
  - Checks for existing Shelby session
  - Falls back to x402a payment
  - Verifies payments & creates sessions
  - Tracks chunkset consumption
  - Returns HTTP 402 when needed

### Package Dependencies

```json
// packages/x402s/package.json
{
  "dependencies": {
    "x402a": "workspace:*",      // ⭐ Local workspace reference!
    "@aptos-labs/ts-sdk": "^1.30.0",
    "pino": "^10.1.0",
    "zod": "^3.22.4"
  },
  "peerDependencies": {
    "@shelby-protocol/sdk": "*",  // Optional (SDK not published yet)
    "react": ">=18.0.0"
  }
}
```

---

## Architecture

### Payment Flow

```
1. CLIENT requests /api/search
2. MIDDLEWARE checks for X-Shelby-Session header
3. If NO SESSION:
   ├─ Return HTTP 402 with payment requirements
   ├─ Client pays via x402a (signs transaction)
   ├─ Facilitator submits to Aptos blockchain
   ├─ Gateway verifies payment
   └─ Create Shelby session with chunksets
4. If HAS SESSION:
   ├─ Verify chunksets available
   ├─ Consume chunksets for request
   └─ Allow request through
5. SESSION INFO attached to request headers
```

### Integration Points

**x402s** integrates two systems:

1. **x402a** (Aptos micropayments)
   - Per-transaction payments
   - User signs each time
   - Facilitator pays gas

2. **Shelby** (Session-based storage)
   - Pre-funded sessions
   - Chunkset consumption tracking
   - Storage/compute access

**Bridge Logic**:
```typescript
Payment (APT) → Verify on Aptos → Calculate chunksets → Create Shelby session
```

---

## Current Status

### ✅ Completed

- [x] Package structure created
- [x] TypeScript configuration
- [x] Core types defined
- [x] ShelbyGateway server class
- [x] useShelbySession React hook
- [x] Next.js middleware scaffold
- [x] README documentation
- [x] Monorepo integration (turbo.json, workspaces)
- [x] **x402s package builds successfully** ⭐

### ⚠️ Needs Completion

- [ ] **x402s-next TypeScript errors** (logging type issues)
- [ ] Shelby SDK integration (when published)
- [ ] Example application
- [ ] Unit tests
- [ ] Integration tests
- [ ] Shelby API client wrapper

### 🔧 Known Issues

1. **Shelby SDK not available yet**
   - Made `@shelby-protocol/sdk` an optional peer dependency
   - Placeholder code commented for when SDK is ready

2. **x402s-next build errors**
   - Pino logger type strictness
   - Need to refine logging calls or simplify

3. **Placeholder implementations**
   - `ShelbyGateway.createShelbySession()` - needs real Shelby API calls
   - `ShelbyGateway.getSession()` - needs Shelby API integration
   - `ShelbyGateway.useSession()` - needs Shelby API integration

---

## Next Steps

### Immediate (to get building)

1. **Fix x402s-next TypeScript errors**
   ```bash
   cd packages/x402s-next/src/middleware
   # Simplify logging or use console.log temporarily
   # Remove extra metadata from log.info() calls
   ```

2. **Install Shelby SDK when available**
   ```bash
   bun add @shelby-protocol/sdk
   ```

3. **Implement real Shelby API calls**
   - Replace placeholder functions in `ShelbyGateway.ts`
   - Use `@shelby-protocol/sdk` for session management

### Short-term (1-2 weeks)

4. **Create example app**
   ```bash
   mkdir examples/shelby-search-demo
   # Next.js app demonstrating x402s integration
   ```

5. **Write tests**
   - Unit tests for ShelbyGateway
   - Integration tests for middleware
   - E2E tests with Playwright

6. **Add CI/CD**
   - Update GitHub Actions to test x402s packages
   - Add publishing workflow

### Medium-term (1 month)

7. **Production hardening**
   - Error handling improvements
   - Retry logic for Aptos/Shelby API calls
   - Rate limiting
   - Session persistence (database)

8. **Documentation**
   - API reference docs
   - Tutorial guides
   - Video walkthrough

9. **Performance optimization**
   - Session caching strategy
   - Batch operations
   - Connection pooling

---

## Usage Example (When Complete)

### Server Setup

```typescript
// middleware.ts
import { createShelbyMiddleware } from 'x402s-next/middleware';
import { ShelbyGateway } from 'x402s/server';
import { X402Facilitator } from 'x402a/server';
import { ShelbyNodeClient, Network } from '@shelby-protocol/sdk/node';

const gateway = new ShelbyGateway({
  facilitator: new X402Facilitator({
    privateKey: process.env.FACILITATOR_PRIVATE_KEY!,
    contractAddress: process.env.CONTRACT_ADDRESS!,
  }),
  shelbyClient: new ShelbyNodeClient({
    network: Network.SHELBYNET,
    apiKey: process.env.SHELBY_API_KEY!,
  }),
  pricing: {
    octasPerChunkset: "100000",      // 0.001 APT per chunkset
    minPaymentOctas: "1000000",      // 0.01 APT minimum
    maxChunksetsPerSession: 1000,
  }
});

export default createShelbyMiddleware({
  gateway,
  payTo: process.env.PAYMENT_RECIPIENT_ADDRESS!,
  routes: {
    "/api/search": {
      price: "10000000",        // 0.1 APT
      chunksets: 100,
      description: "Shelby Search",
    }
  }
});
```

### Client Usage

```typescript
import { useShelbySession } from 'x402s/client';

function SearchPage() {
  const { session, createSession, needsRefill } = useShelbySession({
    createSessionEndpoint: '/api/shelby/sessions',
    getSessionEndpoint: '/api/shelby/sessions',
  });

  return (
    <div>
      {needsRefill ? (
        <button onClick={handlePayment}>Pay to Search</button>
      ) : (
        <p>Chunksets: {session?.chunksetsRemaining}</p>
      )}
    </div>
  );
}
```

---

## Conclusion

**Answer to "Would it be easier to integrate into x402a or make x402s?"**

✅ **Make x402s as a SEPARATE PACKAGE in the SAME MONOREPO**

**Benefits**:
1. ⭐ **Clean separation** - Each package has one clear purpose
2. ⭐ **Code reuse** - x402s imports x402a via workspace dependency
3. ⭐ **Faster development** - No conditional logic or mode switching
4. ⭐ **Better DX** - Users install what they need (`npm install x402s`)
5. ⭐ **Independent versioning** - Can ship x402s updates without x402a changes
6. ⭐ **Shared infrastructure** - Same Turbo, Biome, CI/CD setup

**The monorepo becomes**: **HTTP 402 for Aptos** - containing both generic implementation (x402a) and specific integrations (x402s for Shelby).

---

## Getting Started

### Build x402s

```bash
# Install dependencies
bun install

# Build just x402s
bun run build --filter=x402s

# Build all packages
bun run build

# Run tests (when implemented)
bun run test --filter=x402s
```

### Publish (when ready)

```bash
# Publish x402s to npm
bun run publish:x402s

# Publish x402s-next
bun run publish:x402s-next

# Publish all packages
bun run publish:all
```

---

## Resources

- [Shelby Protocol Docs](https://docs.shelby.xyz)
- [Shelby TypeScript SDK](https://docs.shelby.xyz/sdks/typescript)
- [x402a Documentation](./packages/x402a/README.md)
- [Aptos Documentation](https://aptos.dev)

---

**Status**: Experimental v0.1.0
**Network**: Testnet only
**Production**: Not recommended yet

Built by Raintree Technology
