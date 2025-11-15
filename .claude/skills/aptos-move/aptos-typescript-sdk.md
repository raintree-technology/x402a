# Aptos TypeScript SDK Integration

You are an expert in integrating Aptos Move smart contracts with frontend applications using the TypeScript SDK. You help developers build seamless Web3 experiences.

## SDK Setup

### Installation
```bash
npm install @aptos-labs/ts-sdk
# or
yarn add @aptos-labs/ts-sdk
```

### Basic Configuration
```typescript
import {
  Aptos,
  AptosConfig,
  Network,
  Account,
  Ed25519PrivateKey
} from "@aptos-labs/ts-sdk";

// Configure for different networks
const config = new AptosConfig({
  network: Network.TESTNET // or MAINNET, DEVNET, LOCAL
});

const aptos = new Aptos(config);
```

## Common Operations

### 1. Wallet Connection

#### With Wallet Adapter
```typescript
import { useWallet } from "@aptos-labs/wallet-adapter-react";

function ConnectWallet() {
  const {
    connect,
    disconnect,
    account,
    connected,
    signAndSubmitTransaction
  } = useWallet();

  if (connected && account) {
    return (
      <div>
        <p>Connected: {account.address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    );
  }

  return (
    <button onClick={() => connect("Petra")}>
      Connect Wallet
    </button>
  );
}
```

#### Without Wallet Adapter (Direct)
```typescript
// Check if wallet is installed
const isPetraInstalled = "aptos" in window;

if (isPetraInstalled) {
  const wallet = window.aptos;

  // Connect
  const response = await wallet.connect();
  console.log("Connected:", response.address);

  // Get account
  const account = await wallet.account();
  console.log("Account:", account.address);

  // Sign and submit transaction
  const transaction = {
    type: "entry_function_payload",
    function: `${MODULE_ADDRESS}::${MODULE_NAME}::function_name`,
    arguments: [arg1, arg2],
    type_arguments: [],
  };

  const result = await wallet.signAndSubmitTransaction(transaction);
  console.log("Transaction hash:", result.hash);
}
```

### 2. Calling Entry Functions

```typescript
// Simple entry function call
async function callEntryFunction(
  account: Account,
  functionName: string,
  args: any[]
) {
  const transaction = await aptos.transaction.build.simple({
    sender: account.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::${functionName}`,
      functionArguments: args,
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: account,
    transaction,
  });

  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: committedTxn.hash,
  });

  console.log("Transaction executed:", executedTransaction.hash);
  return executedTransaction;
}

// Example: Initialize a resource
async function initialize(account: Account) {
  return callEntryFunction(account, "initialize", []);
}

// Example: Deposit with amount
async function deposit(account: Account, amount: number) {
  return callEntryFunction(account, "deposit", [amount]);
}

// Example: Transfer to recipient
async function transfer(
  account: Account,
  recipient: string,
  amount: number
) {
  return callEntryFunction(account, "transfer", [recipient, amount]);
}
```

### 3. Calling View Functions (Read-Only)

```typescript
// Query blockchain state without gas
async function getBalance(address: string): Promise<number> {
  const balance = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_balance`,
      functionArguments: [address],
    },
  });

  return Number(balance[0]);
}

// Example: Check if resource exists
async function isInitialized(address: string): Promise<boolean> {
  try {
    const result = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::is_initialized`,
        functionArguments: [address],
      },
    });
    return Boolean(result[0]);
  } catch (error) {
    return false;
  }
}

// Example: Get user data
async function getUserData(address: string) {
  const result = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::get_user_data`,
      functionArguments: [address],
    },
  });

  return {
    value: Number(result[0]),
    timestamp: Number(result[1]),
    active: Boolean(result[2]),
  };
}
```

### 4. Working with Resources

#### Read Resource Directly
```typescript
interface MyResource {
  value: string;
  owner: string;
  created_at: string;
}

async function getResource(address: string): Promise<MyResource | null> {
  try {
    const resource = await aptos.getAccountResource({
      accountAddress: address,
      resourceType: `${MODULE_ADDRESS}::${MODULE_NAME}::MyResource`,
    });

    return resource.data as MyResource;
  } catch (error) {
    console.error("Resource not found:", error);
    return null;
  }
}

// Check if resource exists
async function resourceExists(address: string): Promise<boolean> {
  const resource = await getResource(address);
  return resource !== null;
}
```

### 5. Event Listening

```typescript
// Listen to events emitted by contract
interface TransferEvent {
  from: string;
  to: string;
  amount: string;
}

async function listenToTransferEvents() {
  const eventType = `${MODULE_ADDRESS}::${MODULE_NAME}::TransferEvent`;

  // Get recent events
  const events = await aptos.getEvents({
    eventType,
  });

  events.forEach((event) => {
    const data = event.data as TransferEvent;
    console.log(`Transfer: ${data.from} -> ${data.to}: ${data.amount}`);
  });
}

// Poll for new events
async function pollForEvents(
  eventType: string,
  callback: (event: any) => void,
  intervalMs: number = 5000
) {
  let lastSequenceNumber = 0;

  setInterval(async () => {
    const events = await aptos.getEvents({
      eventType,
    });

    const newEvents = events.filter(
      (e) => Number(e.sequence_number) > lastSequenceNumber
    );

    newEvents.forEach(callback);

    if (newEvents.length > 0) {
      lastSequenceNumber = Number(
        newEvents[newEvents.length - 1].sequence_number
      );
    }
  }, intervalMs);
}
```

### 6. Account Management

```typescript
// Create new account
function createAccount(): Account {
  return Account.generate();
}

// Load account from private key
function loadAccount(privateKeyHex: string): Account {
  const privateKey = new Ed25519PrivateKey(privateKeyHex);
  return Account.fromPrivateKey({ privateKey });
}

// Get account balance (APT)
async function getAccountAPTBalance(address: string): Promise<number> {
  const balance = await aptos.getAccountAPTAmount({
    accountAddress: address,
  });
  return balance;
}

// Fund account from faucet (testnet/devnet only)
async function fundAccount(address: string): Promise<void> {
  await aptos.fundAccount({
    accountAddress: address,
    amount: 100_000_000, // 1 APT = 100M octas
  });
}
```

### 7. Working with Fungible Assets

```typescript
// Get FA balance
async function getFungibleAssetBalance(
  ownerAddress: string,
  assetType: string
): Promise<number> {
  const balance = await aptos.view({
    payload: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::balance_of`,
      functionArguments: [ownerAddress],
    },
  });

  return Number(balance[0]);
}

// Transfer FA
async function transferFungibleAsset(
  from: Account,
  to: string,
  amount: number
) {
  const transaction = await aptos.transaction.build.simple({
    sender: from.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::transfer`,
      functionArguments: [to, amount],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: from,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  return committedTxn.hash;
}
```

### 8. Working with NFTs/Digital Assets

```typescript
// Get NFTs owned by address
async function getOwnedNFTs(ownerAddress: string) {
  // Using Indexer GraphQL
  const query = `
    query GetNFTs($owner: String!) {
      current_token_ownerships_v2(
        where: {
          owner_address: { _eq: $owner }
          amount: { _gt: "0" }
        }
      ) {
        token_data_id
        current_token_data {
          token_name
          token_uri
          collection_id
        }
        amount
      }
    }
  `;

  // Note: Requires GraphQL endpoint
  // You'll need to configure indexer access
}

// Transfer NFT
async function transferNFT(
  from: Account,
  tokenAddress: string,
  to: string
) {
  const transaction = await aptos.transaction.build.simple({
    sender: from.accountAddress,
    data: {
      function: "0x4::aptos_token::transfer",
      functionArguments: [tokenAddress, to],
    },
  });

  const committedTxn = await aptos.signAndSubmitTransaction({
    signer: from,
    transaction,
  });

  await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
  return committedTxn.hash;
}
```

### 9. Transaction Building

#### Simple Transaction
```typescript
async function buildSimpleTransaction(
  sender: Account,
  functionName: string,
  args: any[]
) {
  return await aptos.transaction.build.simple({
    sender: sender.accountAddress,
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::${functionName}`,
      functionArguments: args,
    },
  });
}
```

#### Multi-Agent Transaction
```typescript
async function buildMultiAgentTransaction(
  sender: Account,
  secondarySigner: Account
) {
  return await aptos.transaction.build.multiAgent({
    sender: sender.accountAddress,
    secondarySignerAddresses: [secondarySigner.accountAddress],
    data: {
      function: `${MODULE_ADDRESS}::${MODULE_NAME}::multi_agent_function`,
      functionArguments: [/* args */],
    },
  });
}
```

#### Batch Transactions (Script)
```typescript
// Multiple operations in one transaction
async function batchOperations(account: Account) {
  // Use a script to batch multiple calls atomically
  const script = `
    script {
      use ${MODULE_ADDRESS}::${MODULE_NAME};

      fun main(account: &signer) {
        ${MODULE_NAME}::operation1(account);
        ${MODULE_NAME}::operation2(account);
        ${MODULE_NAME}::operation3(account);
      }
    }
  `;

  // Compile and submit script
  // Note: Requires script compilation
}
```

### 10. Error Handling

```typescript
async function safeTransactionCall<T>(
  fn: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error: any) {
    console.error("Transaction failed:", error);

    // Parse Move abort codes
    if (error.message.includes("ABORT_CODE")) {
      const match = error.message.match(/ABORT_CODE: (\d+)/);
      if (match) {
        const abortCode = parseInt(match[1]);
        return {
          success: false,
          error: `Transaction aborted with code ${abortCode}`,
        };
      }
    }

    return {
      success: false,
      error: error.message || "Unknown error",
    };
  }
}

// Usage
const result = await safeTransactionCall(() =>
  transfer(account, recipient, amount)
);

if (result.success) {
  console.log("Transfer successful:", result.data);
} else {
  console.error("Transfer failed:", result.error);
}
```

## React Hooks

### Custom Hooks for Common Operations

```typescript
import { useState, useEffect } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

// Hook for reading resource
function useResource<T>(resourceType: string) {
  const { account } = useWallet();
  const [resource, setResource] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!account) return;

    setLoading(true);
    aptos
      .getAccountResource({
        accountAddress: account.address,
        resourceType,
      })
      .then((res) => setResource(res.data as T))
      .catch(() => setResource(null))
      .finally(() => setLoading(false));
  }, [account, resourceType]);

  return { resource, loading };
}

// Hook for calling entry function
function useEntryFunction() {
  const { signAndSubmitTransaction } = useWallet();
  const [loading, setLoading] = useState(false);

  const call = async (
    functionName: string,
    args: any[]
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${MODULE_ADDRESS}::${MODULE_NAME}::${functionName}`,
          functionArguments: args,
        },
      });

      await aptos.waitForTransaction({
        transactionHash: response.hash,
      });

      return response.hash;
    } catch (error) {
      console.error("Transaction failed:", error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { call, loading };
}

// Usage in component
function MyComponent() {
  const { resource, loading } = useResource<MyResource>(
    `${MODULE_ADDRESS}::${MODULE_NAME}::MyResource`
  );

  const { call, loading: txLoading } = useEntryFunction();

  const handleDeposit = async () => {
    const hash = await call("deposit", [1000]);
    if (hash) {
      console.log("Deposit successful:", hash);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <p>Balance: {resource?.value || 0}</p>
      <button onClick={handleDeposit} disabled={txLoading}>
        Deposit
      </button>
    </div>
  );
}
```

## Best Practices

1. **Always wait for transactions**: Use `waitForTransaction` to ensure execution
2. **Handle errors gracefully**: Wrap calls in try-catch
3. **Parse abort codes**: Map Move error codes to user-friendly messages
4. **Cache read calls**: Use view functions and cache results
5. **Optimize gas**: Batch operations when possible
6. **Test on devnet first**: Always test before mainnet
7. **Use TypeScript**: Type safety prevents errors
8. **Monitor events**: Track contract activity
9. **Handle wallet disconnection**: Check connection status
10. **Secure private keys**: Never expose in frontend code

## Example: Complete Token Interface

```typescript
// token-service.ts
import { Aptos, AptosConfig, Network, Account } from "@aptos-labs/ts-sdk";

const config = new AptosConfig({ network: Network.TESTNET });
const aptos = new Aptos(config);

const MODULE_ADDRESS = "0x...";
const MODULE_NAME = "my_token";

export class TokenService {
  static async getBalance(address: string): Promise<number> {
    const [balance] = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::balance_of`,
        functionArguments: [address],
      },
    });
    return Number(balance);
  }

  static async transfer(
    from: Account,
    to: string,
    amount: number
  ): Promise<string> {
    const transaction = await aptos.transaction.build.simple({
      sender: from.accountAddress,
      data: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::transfer`,
        functionArguments: [to, amount],
      },
    });

    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: from,
      transaction,
    });

    await aptos.waitForTransaction({ transactionHash: committedTxn.hash });
    return committedTxn.hash;
  }

  static async getTotalSupply(): Promise<number> {
    const [supply] = await aptos.view({
      payload: {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::total_supply`,
        functionArguments: [],
      },
    });
    return Number(supply);
  }
}
```

## Reference Documentation

Located in the same directory as this skill:

- TypeScript SDK docs: `./aptos-move-docs/aptos-dev-llms-full.txt` (search "TypeScript SDK")
- Example integrations: `./aptos-move-docs/move-by-examples/` (check frontend folders)
- Official SDK repo: https://github.com/aptos-labs/aptos-ts-sdk
- Wallet adapter: https://github.com/aptos-labs/aptos-wallet-adapter
