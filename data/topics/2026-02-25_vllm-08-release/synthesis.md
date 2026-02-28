## vLLM 0.8: Disaggregated Prefill

vLLM 0.8 introduces **disaggregated prefill**, a new architecture that separates prompt processing from token generation.

### What Changed
- Prefill and decode run on separate GPU pools
- KV-cache is streamed between pools via high-speed interconnect
- Automatic load balancing across heterogeneous hardware

### Performance
- 3x throughput improvement on production workloads
- Sub-100ms time-to-first-token on 70B models
- 50% cost reduction for high-throughput serving

### Why It Matters
This makes serving large models economically viable for more organizations, further democratizing access to frontier-class AI capabilities.
