/**
 * Payment types for x402s
 */

/**
 * Shelby payment information with session mapping
 */
export interface ShelbyPayment {
	/** User's Aptos address */
	from: string;
	/** Recipient address */
	to: string;
	/** Payment amount in octas */
	amount: string;
	/** Shelby session ID created from this payment */
	sessionId?: string;
	/** Number of chunksets this payment purchased */
	chunksetsPurchased?: number;
	/** Transaction hash on Aptos */
	txHash?: string;
}

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
	/** Whether payment is valid */
	valid: boolean;
	/** Shelby session created/updated */
	session?: {
		sessionId: string;
		chunksetsRemaining: number;
	};
	/** Error message if verification failed */
	error?: string;
	/** Transaction hash on Aptos blockchain */
	txHash?: string;
}

/**
 * Pricing configuration for converting APT to chunksets
 */
export interface PricingConfig {
	/** How many octas (10^-8 APT) per chunkset */
	octasPerChunkset: string;
	/** Minimum payment amount in octas */
	minPaymentOctas: string;
	/** Maximum chunksets per session */
	maxChunksetsPerSession: number;
}
