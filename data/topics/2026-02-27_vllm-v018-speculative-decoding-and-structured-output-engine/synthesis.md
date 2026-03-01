# vLLM v0.18: Speculative Decoding and Structured Output Engine

## TL;DR

vLLM v0.18 introduces speculative decoding for 2-3x throughput improvement on compatible models, plus a native structured output engine that guarantees JSON schema conformance without external tools. Combined with existing PagedAttention and continuous batching, vLLM remains the highest-throughput open-source LLM serving solution, now processing 30+ requests/second on a single A100 for Llama-3.1 70B.

## Key Insights

**Speculative Decoding Goes Mainstream**
Using a small draft model to predict tokens verified by the large model, speculative decoding achieves 2-3x throughput gains with zero quality loss. vLLM's implementation is model-agnostic — pair any large model with a compatible draft model.

**Native Structured Output Guarantees Schema Conformance**
The built-in guided decoding engine constrains generation to valid JSON matching a provided schema. For agent tool-calling, this eliminates parsing failures and retry loops — every output is guaranteed valid.

**PagedAttention + Continuous Batching = Industry Standard**
vLLM pioneered PagedAttention (virtual memory for KV cache) and continuous batching. These innovations, now standard across inference engines, allow 10-24x more concurrent requests than naive implementations.

## Why This Matters

For anyone running LLMs in production — whether for agent pipelines, chat applications, or batch processing — vLLM v0.18 delivers meaningful speedups through speculative decoding while solving the structured output problem that plagues tool-calling agents. It's the backbone of most serious self-hosted LLM deployments.
