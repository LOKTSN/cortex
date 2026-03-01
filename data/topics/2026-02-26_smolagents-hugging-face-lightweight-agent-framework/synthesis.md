# smolagents: Hugging Face's Lightweight Agent Framework

## TL;DR

smolagents is Hugging Face's official agent library — a minimal, opinionated framework where agents write Python code to use tools instead of generating JSON function calls. This "code agent" approach is more flexible than traditional tool calling: agents can compose tools, use variables, write loops, and handle errors naturally. It integrates tightly with the Hugging Face ecosystem and supports any LLM backend.

## Key Insights

**Code Agents > JSON Tool Calling**
Instead of generating structured JSON for each tool call, smolagents' CodeAgent writes executable Python. This means agents can compose multiple tool calls, use intermediate variables, write conditionals, and handle errors — all in a single generation step. Research shows this approach outperforms JSON tool calling by 30% on complex tasks.

**Minimal API Surface**
The entire framework has three core concepts: Agent (the reasoning loop), Tool (a callable with a description), and Model (any LLM). No graphs, no chains, no complex abstractions. A complete agent fits in 20 lines of code.

**Multi-Agent with ManagedAgent**
Complex tasks are delegated to sub-agents via `ManagedAgent`. The manager agent orchestrates specialists, each with their own tools and instructions — clean separation without the ceremony of heavier frameworks.

## Why This Matters

For developers who find LangChain too heavy and raw API calls too primitive, smolagents hits the sweet spot. Code-based tool use is more powerful than JSON schemas, and the Hugging Face integration provides access to thousands of models and datasets out of the box.
