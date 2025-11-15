/**
 * x402s - HTTP 402 Payment Required integration for Shelby Protocol
 *
 * This package bridges x402a's Aptos micropayments with Shelby's
 * session-based storage access system.
 *
 * @packageDocumentation
 */

// Re-export types
export type * from "./types/index.js";

// Re-export server components
export type { ShelbyGatewayConfig } from "./server/index.js";
export { ShelbyGateway } from "./server/index.js";

// Re-export client components
export type { UseShelbySessionConfig, UseShelbySessionReturn } from "./client/index.js";
export { useShelbySession } from "./client/index.js";
