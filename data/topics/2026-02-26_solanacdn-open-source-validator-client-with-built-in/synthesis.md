## TL;DR

Pipe Network launched **SolanaCDN**, a free open-source validator client forked from Agave (Solana's reference validator implementation) with integrated CDN acceleration. The solution delivers **3.8x faster shred propagation** across Solana's network, achieving 78ms P50 latency versus the 300ms baseline—by routing data through 35,000+ global points of presence (PoP) nodes before reaching the validator.

---

## Key Insights

### Built Into the Validator Stack
SolanaCDN isn't a separate middleware layer—it's embedded directly into the validator client itself. By forking Agave, the team maintained full compatibility with Solana's consensus while adding a non-consensus CDN routing layer. Validators simply run SolanaCDN instead of the standard Agave client, and the CDN acceleration activates automatically for incoming shreds (Solana's block fragments).

### Massive Geographic Reach
The 35,000+ PoP nodes represent a significant infrastructure expansion. Traditional validators rely on peer-to-peer gossip, which disadvantages those geographically distant from block producers. SolanaCDN routes shreds through nearby edge nodes first, then delivers to the validator—effectively giving every validator a globally distributed ingress network regardless of their physical location.

### Fail-Safe Design
The CDN layer is **non-consensus**—it only accelerates data delivery, never participates in voting or fork choice. If the CDN fails or is compromised, validators seamlessly fall back to standard P2P gossip. This design choice removes a potential attack surface while still providing meaningful performance gains.

---

## Why This Matters

By reducing shred propagation latency across all validators, SolanaCDN directly improves block finalization times and reduces fork occurrences—strengthening network security and throughput without modifying Solana's core consensus protocol.