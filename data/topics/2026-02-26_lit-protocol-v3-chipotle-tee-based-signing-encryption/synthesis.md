## TL;DR

Lit Protocol v3 "Chipotle" represents a fundamental architectural shift from threshold cryptography to TEE-based execution, delivering programmable signing and encryption through standard REST APIs. This eliminates SDK dependencies and enables AI agents to manage on-chain keys via simple HTTP calls, dramatically reducing latency and cost for agentic DeFi workflows.

## Key Developments

**1. TEE-Based Execution Model**

The upgrade replaces multi-node threshold signing with single TEE (Trusted Execution Environment) execution. This consolidates cryptographic operations into a trusted hardware enclave, removing the coordination overhead of distributed key generation while maintaining security guarantees.

**2. HTTP-Native API Design**

Programmable cryptographic operations are now accessible via standard REST endpoints, removing the need for custom SDK integrations. Developers can embed signing and encryption directly into HTTP-native workflows using familiar web primitives—ideal for AI agents operating in standard HTTP environments.

**3. AI Agent Optimization**

The architecture specifically targets AI agent use cases: autonomous DeFi strategies, cross-chain operations, and programmatic asset management. By exposing keys through simple HTTP calls, agents can now perform on-chain actions without specialized cryptographic libraries.

## Why this matters

This shift makes cryptographic key management accessible to any HTTP-capable agent, potentially unlocking a new class of autonomous DeFi applications that were previously bottlenecked by complex threshold signing infrastructure.