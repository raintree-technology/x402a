// Import types from main package to avoid duplication
import type { AptosPaymentPayloadData, PaymentPayload, PaymentRequirements } from "x402a/server";

export const X402_HEADER = "X-Payment";
export const X402_RESPONSE_HEADER = "X-Payment-Response";
export const X402_VERSION = 1;

// Re-export types for convenience
export type { PaymentRequirements, PaymentPayload, AptosPaymentPayloadData };

export function parsePaymentHeader(paymentHeader: string): PaymentPayload {
  try {
    const decoded = Buffer.from(paymentHeader, "base64").toString("utf-8");
    return JSON.parse(decoded) as PaymentPayload;
  } catch (_error) {
    throw new Error("Invalid payment header format");
  }
}
