# vLLM v0.16 Adds WebSocket Realtime API for Self-Hosted Voice Applications

## TL;DR

vLLM v0.16.0 introduces a WebSocket Realtime API that mirrors OpenAI's Realtime API, providing a fully self-hosted alternative for voice-enabled applications. This release also includes async scheduling improvements with pipeline parallelism and speculative decoding enhancements, enabling cost-effective deployment of real-time voice/agent applications without dependency on external services.

## Key Developments

### 1. WebSocket Realtime API

The new WebSocket Realtime API provides feature parity with OpenAI's Realtime API, enabling:

- **Low-latency streaming** for conversational AI and voice applications
- **Bidirectional communication** over persistent WebSocket connections
- **Drop-in replacement** capability for existing OpenAI-integrated applications
- Support for **audio input/output** workflows typical in voice assistants

### 2. Async Scheduling with Pipeline Parallelism

The async scheduling improvements introduce:

- Better handling of concurrent requests through improved async architecture
- **Pipeline parallelism** for distributing inference across multiple devices
- More efficient resource utilization under high-throughput workloads

### 3. Speculative Decoding Enhancements

Speculative decoding improvements provide:

- Reduced token generation latency through speculative token prediction
- Better integration with the new realtime infrastructure
- Improved overall throughput for streaming responses

## Why This Matters

The WebSocket Realtime API eliminates the hard dependency on OpenAI for real-time voice and agentic applications, enabling cost-effective self-hosted deployments with the same interface while significantly improving throughput and reducing cost-per-request.