**TL;DR:**
SGLang 26.01 introduces a custom RadixAttention GPU kernel for efficient KV Cache management in prefix caching scenarios, along with expanded model support including SANA diffusion model integration and openai/gpt-oss architectures. The release includes a Q1 2026 Nvidia collaboration roadmap prioritizing Nemotron V3 day-0 support, reinforcing SGLang's position as the preferred runtime for structured reasoning and agent-based workflows—complementing vLLM's throughput-oriented approach.

**Key Developments:**

1. **RadixAttention GPU Kernel** — The new custom kernel optimizes KV Cache management specifically for prefix caching scenarios, addressing computational overhead in complex generation pipelines where prefix tokens are reused across multiple requests. This directly improves efficiency for multi-turn dialogues and agentic workflows.

2. **Expanded Model Support** — Release 26.01 integrates SANA diffusion model support alongside openai/gpt-oss model compatibility, extending SGLang's reach across multimodal and generative architectures. This broadens the framework's applicability for developers building diverse AI applications.

3. **Nvidia Collaboration Roadmap** — The Q1 2026 roadmap outlines day-0 support for Nemotron V3 through direct Nvidia partnership, ensuring hardware-optimized performance at launch and reinforcing SGLang's enterprise readiness for cutting-edge models.

**Why this matters:**
The RadixAttention kernel directly addresses efficiency bottlenecks in agentic and multi-turn reasoning workloads where prefix reuse is critical, positioning SGLang as the specialized runtime for complex interactive applications while maintaining architectural complementarity with throughput-optimized alternatives.