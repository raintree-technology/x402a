# Review Signature Implementation

Review the consistency between client-side signature generation and contract-side verification.

## Critical Areas

1. **BCS Message Construction**
   - Client: `packages/core/src/client/encoding.ts`
   - Contract: `packages/core/contract/sources/x402_transfer.move` (lines 213-227, 281-293)
   - Must match exactly for signature verification

2. **Petra Wallet Format**
   - Contract expects: `"APTOS\nmessage: 0x<hex>\nnonce: undefined"`
   - Client must sign this exact format

3. **Nonce Handling**
   - Nonce appended to BCS message before hex encoding
   - Not included in Petra's nonce field (always "undefined")

4. **Ed25519 Signature**
   - 64-byte signature from wallet
   - 32-byte public key
   - Verification in contract (lines 310-365)

## Review Checklist

- [ ] BCS encoding order matches (from, to/recipients, amount/amounts, nonce)
- [ ] Message hex encoding consistent
- [ ] Petra wallet message format correct
- [ ] Public key extraction from wallet
- [ ] Signature bytes format (64 bytes)
- [ ] No off-by-one errors in vector operations

## Command

Manually review the code or provide signature generation/verification code for analysis.
