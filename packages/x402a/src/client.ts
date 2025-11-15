"use client";

// Client-only exports (includes React hooks)
export {
  bytesToHex,
  calculateExpirationTimestamp,
  formatExpirationTime,
  generateSecureNonce,
  getChainIdFromNetwork,
  getRemainingTime,
  hexToBytes,
  isExpired,
} from "./client/encoding";

export type {
  PaymentType,
  UseX402PaymentResult,
  X402PaymentConfig,
  X402PaymentParams,
} from "./client/hooks/useX402Payment";

export { useX402Payment } from "./client/hooks/useX402Payment";
export {
  calculateExpiration,
  getChainId,
  signTransactionForFeePayer,
} from "./client/signature";
export type {
  AptosChainId,
  AptosPaymentPayloadData,
  AptosTransferMessage,
  BuildSponsoredTransactionOptions,
  MultiRecipientPayment,
  PaymentPayload,
  PaymentProof,
  PaymentProofJWT,
  PaymentRequiredResponse,
  PaymentRequirements,
  SettlePaymentRequest,
  SettlePaymentResponse,
  SupportedKind,
  SupportedNetwork,
  SupportedPaymentsResponse,
  SupportedScheme,
  TransactionAuthenticatorResult,
  TransactionPayloadForSigning,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  X402RequestOptions,
  X402RequestResult,
} from "./types";

export {
  APTOS_COIN_TYPE,
  AptosPaymentPayloadDataSchema,
  PaymentPayloadSchema,
  PaymentRequirementsSchema,
  SettlePaymentResponseSchema,
  SUPPORTED_NETWORKS,
  SUPPORTED_SCHEMES,
  SupportedKindSchema,
  SupportedNetworkSchema,
  SupportedPaymentsResponseSchema,
  SupportedSchemeSchema,
  X402_ERROR_MESSAGES,
  X402_ERRORS,
  X402_HEADER,
  X402_RESPONSE_HEADER,
  X402_VERSION,
} from "./types";
