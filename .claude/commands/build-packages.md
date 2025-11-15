# Build All Packages

Build all TypeScript packages in the monorepo (core, server, react) using tsup.

## Steps

1. Build `@x402/aptos-core` - Browser-side protocol implementation
2. Build `@x402/aptos-server` - Server-side facilitator
3. Build `@x402/aptos-react` - React hooks

## Output

Each package will create a `dist/` directory with:
- `index.js` - CommonJS bundle
- `index.mjs` - ESM bundle
- `index.d.ts` - TypeScript declarations

## Command

```bash
npm run build
```

Or build individual packages:

```bash
cd packages/core && npm run build
cd packages/server && npm run build
cd packages/react && npm run build
```
