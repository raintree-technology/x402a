/**
 * Shelby session types for x402s integration
 */

/**
 * Shelby session information
 */
export interface ShelbySession {
	/** Unique session identifier */
	sessionId: string;
	/** User's Aptos address */
	userAddress: string;
	/** Number of chunksets remaining in this session */
	chunksetsRemaining: number;
	/** Session creation timestamp */
	createdAt: number;
	/** Session expiration timestamp */
	expiresAt: number;
	/** Original payment transaction hash that funded this session */
	fundingTxHash?: string;
}

/**
 * Configuration for creating a Shelby session from x402a payment
 */
export interface CreateSessionFromPaymentOptions {
	/** User's Aptos address */
	userAddress: string;
	/** Payment amount in octas */
	amountInOctas: string;
	/** Transaction hash of the x402a payment */
	txHash: string;
	/** Conversion rate: how many octas per chunkset */
	octasPerChunkset?: string;
}

/**
 * Session pool statistics
 */
export interface SessionPoolStats {
	/** Total active sessions */
	activeSessions: number;
	/** Total chunksets available across all sessions */
	totalChunksetsAvailable: number;
	/** Number of sessions created in last hour */
	sessionsCreatedLastHour: number;
}

/**
 * Chunkset usage information
 */
export interface ChunksetUsage {
	/** Session ID */
	sessionId: string;
	/** Number of chunksets consumed */
	chunksetsUsed: number;
	/** Timestamp of usage */
	usedAt: number;
	/** Operation that consumed chunksets (e.g., 'search', 'upload', 'download') */
	operation: string;
}
