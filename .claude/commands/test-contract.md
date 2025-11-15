# Test Move Contract

Run all tests for the x402 Move smart contract located at `packages/core/contract/`.

## Steps

1. Navigate to the contract directory
2. Run the Aptos Move test suite
3. Report test results including:
   - Number of tests passed/failed
   - Any error messages
   - Coverage of core functionality (signature verification, nonce protection, transfers)

## Expected Tests

- Registry initialization
- Nonce checking and replay protection
- Transfer validation (registry required, non-zero amounts)
- Split transfer validation (recipient/amount matching)
- Error handling (invalid signatures, used nonces, etc.)

## Command

```bash
cd packages/core/contract && aptos move test
```
