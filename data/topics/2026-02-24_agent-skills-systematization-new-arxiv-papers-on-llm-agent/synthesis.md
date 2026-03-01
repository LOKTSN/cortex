## TL;DR

Three recent arXiv papers (Agent Skills for LLMs, SoK: Agentic Skills, and Tool-R0) advance the formalization of LLM agent architectures by exploring modular skill systems, systematic skill taxonomies beyond tool use, and self-evolving agents capable of zero-shot tool learning—collectively signaling a maturing research direction focused on scalable, production-ready agent deployment.

## Key Insights

1. **Modular Skill Architecture Gains Traction**: "Agent Skills for LLMs" proposes treating agent capabilities as composable, pluggable modules rather than monolithic systems. This approach mirrors software engineering principles (separation of concerns, modularity), potentially enabling more maintainable and extensible agent deployments. The work emphasizes that skill definition, composition, and invocation should be explicit and systematic—a departure from earlier implicit skill embedding approaches.

2. **Systematization Extends Beyond Tool Use**: The "SoK: Agentic Skills" paper broadens the definition of agentic skills beyond mere tool invocation. It introduces a taxonomy encompassing reasoning patterns, memory management, self-reflection, and multi-agent coordination. This systematization matters because it provides a shared vocabulary for comparing agent architectures and identifies gaps in current evaluation frameworks—critical for advancing rigorous benchmarking.

3. **Self-Evolving Capability Addresses Production Bottleneck**: Tool-R0 introduces self-evolving agents that can generate and integrate new skills without requiring explicit training data or human annotation. This directly tackles a key production limitation: the cold-start problem where agents fail when encountering novel tools or workflows. By enabling zero-shot tool learning, Tool-R0 moves toward agents that adapt dynamically to evolving API ecosystems.

## Why This Matters

As LLM agents transition from research prototypes to production systems, these papers collectively address fundamental challenges in scalability, adaptability, and architectural rigor—making them essential reading for teams building robust, real-world agent deployments.