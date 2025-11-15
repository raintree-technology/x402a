# Deploy to Testnet

Deploy the x402 Move contract to Aptos testnet.

## Prerequisites

1. Aptos CLI installed (`aptos --version`)
2. Testnet profile configured (`aptos init --profile testnet`)
3. Testnet APT for gas fees (use faucet if needed)

## Steps

1. Navigate to contract directory
2. Compile the contract
3. Deploy to testnet
4. Verify deployment
5. Update contract address in environment variables

## Commands

```bash
# Navigate to contract
cd packages/core/contract

# Test first
aptos move test

# Compile
aptos move compile --named-addresses x402_transfer=<YOUR_ACCOUNT>

# Deploy
aptos move publish --profile testnet --named-addresses x402_transfer=<YOUR_ACCOUNT>

# Verify
aptos account list --profile testnet
```

## Post-Deployment

Update the deployed contract address in:
- `packages/core/contract/Move.toml` (addresses section)
- Environment variables for frontend/backend
- Documentation
