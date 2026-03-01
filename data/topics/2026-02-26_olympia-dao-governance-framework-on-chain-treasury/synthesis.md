# TL;DR

ECIP-1113 implements the Olympia DAO governance framework for Ethereum Classic, establishing a production-ready on-chain governance system with modular Governor and timelock executor architecture. The framework introduces Sybil-resistant one-address-one-vote, identity aging requirements, ETC-domain binding, and non-transferable voting rights—all designed to prevent governance capture. The treasury contract serves as the sole authorized caller for withdrawals, creating a secure, auditable governance structure that moves beyond simple token voting models.

---

## Key Insights

**1. Modular Governor-Timelock Architecture**
The framework separates governance logic into a modular Governor contract paired with a timelock executor. This pattern allows proposers to queue actions through the timelock, giving the community a mandatory delay window to react before execution—critical for responding to exploits or malicious proposals.

**2. Anti-Capture Mechanisms**
Olympia DAO embeds multiple defense layers against governance capture:

- **Identity aging**: Addresses must satisfy a time-based requirement before gaining voting power, preventing sudden vote accumulation by attackers
- **ETC-domain binding**: Voting rights are tied to the Ethereum Classic domain, restricting participation to actors with established ETC identity
- **Non-transferable voting**: Votes cannot be delegated or sold, eliminating mercenary voting and bought governance influence

**3. Treasury as Single Withdrawal Authority**
Unlike DAOs where anyone can trigger withdrawals via proposals, Olympia restricts withdrawal calls exclusively to the treasury contract itself. This creates an immutable execution path: proposals must pass governance, then the treasury autonomously executes the withdrawal, removing intermediary trust assumptions.

---

## Why This Matters

This framework demonstrates that DAO governance can evolve beyond naive token voting into sophisticated, attack-resilient systems—with direct implications for how Ethereum Classic protocols secure and govern treasury assets on-chain.