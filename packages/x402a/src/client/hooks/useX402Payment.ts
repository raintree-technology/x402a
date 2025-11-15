import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState } from "react";
import { generateSecureNonce } from "../encoding";
import { calculateExpiration, getChainId, signTransactionForFeePayer } from "../signature";

declare global {
  interface Window {
    X402_CONTRACT_ADDRESS?: string;
    X402_PLATFORM_ADDRESS?: string;
    X402_FACILITATOR_ADDRESS?: string;
  }
}

const DEFAULT_PLATFORM_FEE_PERCENTAGE = 0.015; // 1.5%

export type PaymentType = "stream" | "tip" | "comment" | "purchase";

export interface X402PaymentParams {
  /** Amount in APT (e.g., 0.01 for comments, 1.5 for tips) */
  amount: number;
  /** Primary recipient address (artist, creator) */
  recipientAddress: string;
  /** Payment type for tracking */
  paymentType: PaymentType;
  /** Resource identifier (track blob, comment ID, etc.) */
  resourceId: string;
  /** Optional description */
  description?: string;
}

export interface X402PaymentConfig {
  /** API endpoint for building transactions (default: /api/facilitator/build) */
  buildEndpoint?: string;
  /** API endpoint for verifying payments (default: /api/facilitator/verify) */
  verifyEndpoint?: string;
  /** API endpoint for initialization (default: /api/facilitator/init) */
  initEndpoint?: string;
  /** Platform fee percentage (default: 0.015 = 1.5%) */
  platformFeePercentage?: number;
  /** Platform fee recipient address (overrides env var) */
  platformAddress?: string;
  /** Contract address (overrides env var) */
  contractAddress?: string;
  /** Network (default: aptos-testnet) */
  network?: string;
  /** Toast notification function */
  toast?: {
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
  };
}

export interface UseX402PaymentResult {
  executePayment: (params: X402PaymentParams) => Promise<string | null>;

  /** Whether payment is currently processing */
  isProcessing: boolean;

  /** Current payment status */
  paymentStatus: "idle" | "signing" | "settling" | "success" | "error";

  /** Transaction hash (available after settlement) */
  txHash: string | null;
}

export function useX402Payment(config: X402PaymentConfig = {}): UseX402PaymentResult {
  const wallet = useWallet();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "signing" | "settling" | "success" | "error"
  >("idle");
  const [txHash, setTxHash] = useState<string | null>(null);

  const {
    buildEndpoint = "/api/facilitator/build",
    verifyEndpoint = "/api/facilitator/verify",
    initEndpoint = "/api/facilitator/init",
    platformFeePercentage = DEFAULT_PLATFORM_FEE_PERCENTAGE,
    platformAddress,
    contractAddress,
    network = "aptos-testnet",
    toast,
  } = config;

  const executePayment = async (params: X402PaymentParams): Promise<string | null> => {
    const { amount, recipientAddress, paymentType, resourceId, description } = params;

    if (!wallet.connected || !wallet.account) {
      toast?.error("Please connect your wallet");
      return null;
    }

    if (amount <= 0) {
      toast?.error("Invalid payment amount");
      return null;
    }

    setIsProcessing(true);
    setPaymentStatus("signing");
    setTxHash(null);

    try {
      const userAddress = wallet.account.address.toString();

      // 1. Check if registry is initialized
      const initResponse = await fetch(initEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userAddress }),
      });

      if (!initResponse.ok) {
        throw new Error("Failed to check payment registry");
      }

      const initResult = await initResponse.json();

      if (!initResult.success) {
        throw new Error("Failed to initialize payment registry");
      }

      if (initResult.requiresTransaction) {
        toast?.info("Setting up your payment account...");

        const contractAddr =
          contractAddress ||
          (typeof window !== "undefined" ? window.X402_CONTRACT_ADDRESS : undefined);

        if (!contractAddr) {
          throw new Error("Payment system not configured");
        }

        if (!wallet.signAndSubmitTransaction) {
          throw new Error("Wallet does not support transactions");
        }

        await wallet.signAndSubmitTransaction({
          data: {
            function: `${contractAddr}::x402_transfer::initialize_registry`,
            functionArguments: [],
          },
        });

        toast?.success("Payment account ready!");
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // 2. Calculate amounts
      const amountOctas = BigInt(Math.floor(amount * 100_000_000)); // Convert APT to octas
      const platformFee = BigInt(Math.floor(Number(amountOctas) * platformFeePercentage));
      const recipientAmount = amountOctas - platformFee;

      const platformAddr =
        platformAddress ||
        (typeof window !== "undefined"
          ? window.X402_PLATFORM_ADDRESS || window.X402_FACILITATOR_ADDRESS
          : undefined) ||
        recipientAddress; // Fallback to recipient

      const nonce = generateSecureNonce();
      const validUntil = calculateExpiration(3600); // 1 hour
      const chainId = getChainId(network);

      // 3. Build transaction from facilitator
      const buildResponse = await fetch(buildEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: userAddress,
          to: [recipientAddress, platformAddr],
          amount: [recipientAmount.toString(), platformFee.toString()],
          nonce,
          validUntil,
          chainId,
        }),
      });

      if (!buildResponse.ok) {
        const buildError = await buildResponse.json();
        throw new Error(buildError.error || "Failed to build transaction");
      }

      const buildData = await buildResponse.json();
      const transactionPayload = buildData.transactionPayload;

      // 4. Sign transaction
      const authResult = await signTransactionForFeePayer(wallet, transactionPayload);

      setPaymentStatus("settling");

      // 5. Create payment payload
      const paymentPayload = {
        x402Version: 1,
        scheme: "exact",
        network,
        payload: {
          from: userAddress,
          to: [recipientAddress, platformAddr],
          amount: [recipientAmount.toString(), platformFee.toString()],
          nonce,
          authenticator: authResult.authenticator,
          publicKey: authResult.publicKey,
          validUntil,
          chainId,
        },
      };

      const paymentHeader = btoa(JSON.stringify(paymentPayload));

      // 6. Verify/submit payment
      const verifyResponse = await fetch(verifyEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          x402Version: 1,
          paymentHeader,
          paymentRequirements: {
            scheme: "exact",
            network,
            maxAmountRequired: amountOctas.toString(),
            resource: `${paymentType}:${resourceId}`,
            description: description || `${paymentType} payment`,
            payTo: recipientAddress,
            asset: "0x1::aptos_coin::AptosCoin",
          },
        }),
      });

      if (!verifyResponse.ok) {
        const error = await verifyResponse.json();
        throw new Error(error.error || "Payment verification failed");
      }

      const result = await verifyResponse.json();

      if (!result.success) {
        throw new Error(result.error || "Payment failed");
      }

      setPaymentStatus("success");
      setTxHash(result.txHash || authResult.transactionHash);

      const feePercentDisplay = (platformFeePercentage * 100).toFixed(1);
      toast?.success(`Payment confirmed! (${feePercentDisplay}% platform fee)`);

      return result.proof || result.txHash;
    } catch (error) {
      console.error("[useX402Payment] Payment failed:", error);
      setPaymentStatus("error");

      const errorMessage = error instanceof Error ? error.message : "Payment failed";
      toast?.error(errorMessage);

      return null;
    } finally {
      setIsProcessing(false);

      setTimeout(() => {
        setPaymentStatus("idle");
        setTxHash(null);
      }, 5000);
    }
  };

  return {
    executePayment,
    isProcessing,
    paymentStatus,
    txHash,
  };
}
