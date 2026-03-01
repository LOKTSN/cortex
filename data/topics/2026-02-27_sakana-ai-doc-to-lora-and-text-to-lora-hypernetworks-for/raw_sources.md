# Raw Sources — Sakana AI Doc-to-LoRA and Text-to-LoRA: Hypernetworks for Instant LLM Adaptation

## Sakana AI Doc-to-LoRA Announcement
- **URL**: https://www.marktechpost.com/2026/02/27/sakana-ai-introduces-doc-to-lora-and-text-to-lora-hypernetworks-that-instantly-internalize-long-contexts-and-adapt-llms-via-zero-shot-natural-language/
- **Type**: secondary

## Doc-to-LoRA Paper
- **URL**: https://arxiv.org/abs/2602.15902
- **Type**: primary

## Doc-to-LoRA Code
- **URL**: https://github.com/SakanaAI/Doc-to-LoRA
- **Type**: primary


## Candidate Summary
Sakana AI introduces Doc-to-LoRA and Text-to-LoRA - lightweight hypernetworks that generate LoRA adapters in a single forward pass. Doc-to-LoRA internalizes long contexts into model parameters (12GB KV cache reduced to <50MB), while Text-to-LoRA adapts to new tasks via natural language descriptions.

## Why It Matters
Significant breakthrough in amortized LLM customization. Enables sub-second adaptation vs. 40-100 seconds for traditional context distillation. Reduces memory footprint by 240x for long documents. Supports cross-modal transfer from VLM to text-only LLM.