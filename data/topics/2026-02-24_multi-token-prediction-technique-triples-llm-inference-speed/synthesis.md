## TL;DR

Researchers from the University of Maryland, Lawrence Livermore National Labs, Columbia University, and TogetherAI have developed a multi-token prediction technique that transforms standard next-token language models into parallel decoders, achieving 3x+ inference speedup on reasoning benchmarks with minimal accuracy loss—eliminating the need for auxiliary draft models, speculative decoding infrastructure, or specialized inference code.

## Key Insights

**Parallel Decoding via Masked Self-Distillation**  
The technique introduces a specialized mask token that enables the model to predict multiple tokens in a single forward pass. By training with online self-distillation, the model learns to generate token sequences in parallel rather than sequentially, fundamentally altering the decoding architecture without requiring additional components.

**Weight-Baked Acceleration**  
Unlike speculative decoding approaches that rely on auxiliary draft models and verification pipelines, this method bakes the speedup directly into the model weights. This removes the overhead of maintaining separate verification mechanisms and specialized inference runtimes, simplifying production deployment significantly.

**Reasoning Model Optimization**  
The approach specifically targets reasoning models that generate hundreds to thousands of tokens per response—a major bottleneck in latency-sensitive production environments. On reasoning benchmarks, the 3x+ speedup comes with negligible accuracy degradation, making it viable for real-world deployment where both speed and correctness matter.

## Why This Matters

This technique removes the architectural complexity of speculative decoding while delivering comparable speedups, offering a streamlined path to sub-second latency for large-scale reasoning model deployment.