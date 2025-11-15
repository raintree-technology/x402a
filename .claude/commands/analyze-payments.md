# Analyze Payment Data

Analyze payment transaction data using TOON format for efficient LLM processing.

## Purpose

Convert payment history, transaction logs, or analytics data to TOON format for:
- Pattern detection (fraud, abuse, usage trends)
- Payment success/failure analysis
- User behavior insights
- Cost optimization recommendations

## Usage

Provide payment data as JSON, and Claude will:

1. Convert to TOON format for token-efficient analysis
2. Analyze patterns and anomalies
3. Generate insights and recommendations
4. Return results in both TOON and JSON formats

## Example Input

```json
{
  "payments": [
    {
      "txHash": "0x123...",
      "from": "0xABC...",
      "to": "0xDEF...",
      "amount": 1000000,
      "timestamp": "2025-01-15T10:30:00Z",
      "status": "success",
      "nonce": "abc123"
    }
  ]
}
```

## TOON Output

```toon
payments[100]{txHash,from,to,amount,timestamp,status,nonce}:
  0x123...,0xABC...,0xDEF...,1000000,2025-01-15T10:30:00Z,success,abc123
  ...
```

This reduces token usage by 40-60% compared to JSON, making analysis more cost-effective.
