#!/bin/bash

# Verification script to check if x402a contract deployment was successful

set -e

CONTRACT_ADDRESS="0xc7e1ae48502e9d236288827ade5ac916ccd7454f2136856cdf002820494c7f36"
NETWORK="testnet"

echo "======================================"
echo "x402a Contract Deployment Verification"
echo "======================================"
echo ""
echo "Contract: $CONTRACT_ADDRESS"
echo "Network: $NETWORK"
echo ""

echo "Step 1: Checking if contract is deployed..."
RESPONSE=$(curl -s "https://api.${NETWORK}.aptoslabs.com/v1/accounts/${CONTRACT_ADDRESS}/modules")

if [[ "$RESPONSE" == "[]" ]]; then
    echo "❌ Contract not found at $CONTRACT_ADDRESS"
    echo ""
    echo "Please deploy the contract first:"
    echo "  cd packages/x402a-contract"
    echo "  ./deploy-testnet.sh"
    exit 1
fi

echo "✅ Contract found!"
echo ""

echo "Step 2: Checking for correct entry functions..."
FUNCTIONS=$(echo "$RESPONSE" | jq -r '.[0].abi.exposed_functions[] | select(.is_entry==true) | .name' 2>/dev/null)

echo "Entry functions found:"
echo "$FUNCTIONS" | sed 's/^/  - /'
echo ""

# Check for required functions
REQUIRED_FUNCTIONS=(
    "initialize_registry"
    "transfer_sponsored"
    "transfer_sponsored_split"
)

MISSING_FUNCTIONS=()
for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if ! echo "$FUNCTIONS" | grep -q "^${func}$"; then
        MISSING_FUNCTIONS+=("$func")
    fi
done

if [ ${#MISSING_FUNCTIONS[@]} -eq 0 ]; then
    echo "✅ All required functions present!"
    echo ""
    echo "Required functions:"
    for func in "${REQUIRED_FUNCTIONS[@]}"; do
        echo "  ✓ $func"
    done
else
    echo "❌ Missing required functions:"
    for func in "${MISSING_FUNCTIONS[@]}"; do
        echo "  ✗ $func"
    done
    echo ""
    echo "This means an OLD version of the contract is deployed."
    echo "Please redeploy using: cd packages/x402a-contract && ./deploy-testnet.sh"
    exit 1
fi

echo ""
echo "Step 3: Checking function signatures..."

# Check transfer_sponsored signature
TRANSFER_SPONSORED_SIG=$(echo "$RESPONSE" | jq -r '.[0].abi.exposed_functions[] | select(.name=="transfer_sponsored") | .params | join(", ")')
EXPECTED_SIG="&signer, address, u64, vector<u8>, u64, u8"

if [[ "$TRANSFER_SPONSORED_SIG" == "$EXPECTED_SIG" ]]; then
    echo "✅ transfer_sponsored signature correct"
    echo "   Params: $TRANSFER_SPONSORED_SIG"
else
    echo "⚠️  transfer_sponsored signature mismatch"
    echo "   Expected: $EXPECTED_SIG"
    echo "   Got:      $TRANSFER_SPONSORED_SIG"
fi

echo ""
echo "======================================"
echo "Verification Complete!"
echo "======================================"
echo ""
echo "View in Explorer:"
echo "https://explorer.aptoslabs.com/account/$CONTRACT_ADDRESS?network=$NETWORK"
echo ""
echo "Module details:"
echo "https://explorer.aptoslabs.com/account/$CONTRACT_ADDRESS/modules/code/x402_transfer?network=$NETWORK"
echo ""
echo "Ready to test the example:"
echo "  cd examples/nextjs-app-router"
echo "  bun dev"
echo ""
