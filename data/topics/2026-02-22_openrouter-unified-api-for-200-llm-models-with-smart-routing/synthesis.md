# OpenRouter: Unified API for 200+ LLM Models with Smart Routing

## TL;DR

OpenRouter provides a single OpenAI-compatible API that routes requests to 200+ LLM models across providers (OpenAI, Anthropic, Google, Meta, Mistral, open-source). Smart routing selects the optimal provider based on price, latency, and availability. For agent developers, it eliminates vendor lock-in and provides automatic failover — one API key, every model.

## Key Insights

**One API, Every Model**
A single endpoint (`openrouter.ai/api/v1`) with OpenAI-compatible format. Switch between GPT-4o, Claude, Gemini, Llama, and hundreds of others by changing the model parameter. No separate SDKs, no separate accounts.

**Smart Routing Optimizes Cost and Latency**
When you specify a model family (e.g., `auto`), OpenRouter routes to the cheapest or fastest available provider. Provider outages trigger automatic fallback — critical for production agent systems that can't afford downtime.

**Transparent Pricing with No Markup on Most Models**
OpenRouter passes through provider pricing for most models, making it a genuine aggregator rather than a reseller. Price comparison across providers is built into the dashboard.

## Why This Matters

For production agent systems, provider diversity is a reliability requirement. OpenRouter makes multi-provider access trivial, with smart routing that optimizes for cost or speed. It's become essential infrastructure for teams that need to hedge against provider outages or rapidly test new models.
