/**
 * ShelbyGateway - Integrates x402a payments with Shelby Protocol sessions
 *
 * This class bridges HTTP 402 micropayments (via x402a) with Shelby's
 * session-based storage access system.
 */

import type { X402Facilitator } from "x402a/server";
import type { SubmitPaymentOptions } from "x402a";
import type {
	ShelbySession,
	CreateSessionFromPaymentOptions,
	PaymentVerificationResult,
	PricingConfig,
} from "../types/index.js";
import { ShelbyNodeClient, type ShelbyClientConfig } from "@shelby-protocol/sdk/node";
import pino from "pino";

/**
 * Configuration for ShelbyGateway
 */
export interface ShelbyGatewayConfig {
	/** x402a facilitator instance for handling Aptos payments */
	facilitator: X402Facilitator;
	/** Shelby client instance (optional - will create default if not provided) */
	shelbyClient?: ShelbyNodeClient;
	/** Pricing configuration for converting APT → chunksets */
	pricing: PricingConfig;
	/** Optional logger */
	logger?: pino.Logger;
	/** Shelby network (defaults to SHELBYNET) */
	network?: "SHELBYNET";
	/** Optional Shelby API key for higher rate limits */
	apiKey?: string;
}

/**
 * ShelbyGateway bridges x402a payments with Shelby sessions
 *
 * @example
 * ```typescript
 * import { X402Facilitator } from 'x402a/server';
 * import { ShelbyNodeClient } from '@shelby-protocol/sdk/node';
 * import { ShelbyGateway } from 'x402s/server';
 *
 * const gateway = new ShelbyGateway({
 *   facilitator: new X402Facilitator({
 *     privateKey: process.env.FACILITATOR_PRIVATE_KEY,
 *     contractAddress: process.env.CONTRACT_ADDRESS,
 *   }),
 *   shelbyClient: new ShelbyNodeClient({
 *     network: Network.SHELBYNET,
 *     apiKey: process.env.SHELBY_API_KEY,
 *   }),
 *   pricing: {
 *     octasPerChunkset: "100000", // 0.001 APT per chunkset
 *     minPaymentOctas: "1000000", // 0.01 APT minimum
 *     maxChunksetsPerSession: 1000,
 *   }
 * });
 *
 * // Accept payment and create Shelby session
 * const result = await gateway.createSessionFromPayment({
 *   userAddress: "0x123...",
 *   signedTransaction: "0xabc...",
 *   amount: "10000000", // 0.1 APT
 * });
 * ```
 */
export class ShelbyGateway {
	private facilitator: X402Facilitator;
	private pricing: PricingConfig;
	private logger: pino.Logger;
	private sessions: Map<string, ShelbySession>; // In-memory session cache
	private shelbyClient: ShelbyNodeClient;

	constructor(config: ShelbyGatewayConfig) {
		this.facilitator = config.facilitator;
		this.pricing = config.pricing;
		this.logger =
			config.logger ||
			pino({
				name: "x402s-gateway",
				level: process.env.LOG_LEVEL || "info",
			});
		this.sessions = new Map();

		// Initialize Shelby client
		const shelbyConfig: ShelbyClientConfig = {
			network: config.network || "SHELBYNET",
		};

		// Add API key if provided (optional - works in anonymous mode without it)
		if (config.apiKey) {
			shelbyConfig.apiKey = config.apiKey;
		}

		this.shelbyClient = config.shelbyClient || new ShelbyNodeClient(shelbyConfig);

		this.logger.info(
			{
				network: config.network || "SHELBYNET",
				hasApiKey: !!config.apiKey,
				shelbySDK: this.shelbyClient ? "initialized" : "not available",
			},
			"ShelbyGateway initialized",
		);
	}

	/**
	 * Verify x402a payment and create/fund Shelby session
	 *
	 * Flow:
	 * 1. Submit signed transaction via x402a facilitator
	 * 2. Verify payment succeeded on-chain
	 * 3. Calculate chunksets based on payment amount
	 * 4. Create Shelby session with those chunksets
	 * 5. Return session info to client
	 */
	async createSessionFromPayment(
		paymentOptions: SubmitPaymentOptions,
	): Promise<PaymentVerificationResult> {
		const requestId = this.generateRequestId();
		const log = this.logger.child({ requestId, userAddress: paymentOptions.from });

		try {
			log.info("Processing payment for Shelby session creation");

			// Step 1: Submit payment via x402a
			const paymentResult = await this.facilitator.submitPayment(paymentOptions);

			if (!paymentResult.success || !paymentResult.txHash) {
				log.error({ error: paymentResult.error }, "Payment submission failed");
				return {
					valid: false,
					error: paymentResult.error || "Payment submission failed",
				};
			}

			log.info({ txHash: paymentResult.txHash }, "Payment submitted successfully");

			// Step 2: Calculate chunksets from payment amount
			const chunksets = this.calculateChunksets(paymentOptions.amount);

			if (chunksets === 0) {
				return {
					valid: false,
					error: "Payment amount too low to purchase any chunksets",
					txHash: paymentResult.txHash,
				};
			}

			// Step 3: Create Shelby session
			// NOTE: This is a placeholder - actual Shelby SDK integration needed
			const amountInOctas =
				typeof paymentOptions.amount === "string" ? paymentOptions.amount : paymentOptions.amount[0] || "0";
			const session = await this.createShelbySession({
				userAddress: paymentOptions.from,
				amountInOctas,
				txHash: paymentResult.txHash,
				octasPerChunkset: this.pricing.octasPerChunkset,
			});

			log.info(
				{
					sessionId: session.sessionId,
					chunksets: session.chunksetsRemaining,
				},
				"Shelby session created",
			);

			// Cache session
			this.sessions.set(session.sessionId, session);

			return {
				valid: true,
				session: {
					sessionId: session.sessionId,
					chunksetsRemaining: session.chunksetsRemaining,
				},
				txHash: paymentResult.txHash,
			};
		} catch (error) {
			log.error({ error }, "Error creating session from payment");
			return {
				valid: false,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Get session information
	 */
	async getSession(sessionId: string): Promise<ShelbySession | null> {
		// Check cache first
		const cached = this.sessions.get(sessionId);
		if (cached) {
			return cached;
		}

		// TODO: Query Shelby API for session
		// For now, return null
		return null;
	}

	/**
	 * Use a session (decrement chunksets)
	 */
	async useSession(
		sessionId: string,
		chunksetsToConsume: number,
	): Promise<{ success: boolean; chunksetsRemaining?: number; error?: string }> {
		const session = await this.getSession(sessionId);

		if (!session) {
			return { success: false, error: "Session not found" };
		}

		if (session.chunksetsRemaining < chunksetsToConsume) {
			return { success: false, error: "Insufficient chunksets in session" };
		}

		// TODO: Call Shelby API to use session
		// POST /v1/sessions/{sessionId}/use

		// Update local cache
		session.chunksetsRemaining -= chunksetsToConsume;
		this.sessions.set(sessionId, session);

		return {
			success: true,
			chunksetsRemaining: session.chunksetsRemaining,
		};
	}

	/**
	 * Calculate how many chunksets can be purchased with payment amount
	 */
	private calculateChunksets(amount: string | string[]): number {
		const amountStr = typeof amount === "string" ? amount : amount[0] || "0";
		const amountInOctas = BigInt(amountStr);
		const octasPerChunkset = BigInt(this.pricing.octasPerChunkset);

		const chunksets = Number(amountInOctas / octasPerChunkset);

		return Math.min(chunksets, this.pricing.maxChunksetsPerSession);
	}

	/**
	 * Create Shelby session via SDK
	 *
	 * NOTE: Shelby SDK (v0.0.5) doesn't expose session APIs yet.
	 * For now we create a virtual session tracked locally.
	 * The shelbyClient is initialized and ready for future blob upload/download operations.
	 */
	private async createShelbySession(
		options: CreateSessionFromPaymentOptions,
	): Promise<ShelbySession> {
		const chunksets = Number(
			BigInt(options.amountInOctas) / BigInt(options.octasPerChunkset || this.pricing.octasPerChunkset),
		);

		// Create virtual session
		// When Shelby adds session APIs, we'll integrate here:
		// const response = await this.shelbyClient.rpc.sessions.create({
		//   userIdentity: options.userAddress,
		//   chunksets,
		//   fundingTx: options.txHash,
		// });

		const session: ShelbySession = {
			sessionId: this.generateSessionId(),
			userAddress: options.userAddress,
			chunksetsRemaining: chunksets,
			createdAt: Date.now(),
			expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
			fundingTxHash: options.txHash,
		};

		// Store session
		this.sessions.set(session.sessionId, session);

		this.logger.info(
			{
				sessionId: session.sessionId,
				userAddress: options.userAddress,
				chunksets,
				txHash: options.txHash,
			},
			"Virtual Shelby session created",
		);

		return session;
	}

	/**
	 * Generate unique session ID
	 */
	private generateSessionId(): string {
		return `shelby_${Date.now()}_${Math.random().toString(36).substring(7)}`;
	}

	/**
	 * Generate request ID for logging
	 */
	private generateRequestId(): string {
		return `req_${Date.now()}_${Math.random().toString(36).substring(7)}`;
	}
}
