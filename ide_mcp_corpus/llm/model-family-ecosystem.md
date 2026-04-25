# Model Family Ecosystem Knowledge

## Overview

This document provides comprehensive ecosystem knowledge for major LLM model families, including tokenizer behavior, RoPE scaling, KV cache layout, attention quirks, quantization compatibility, known bugs, performance bottlenecks, and conversion pitfalls.

## LLaMA 3

### Tokenizer

- Uses SentencePiece tokenizer (same as LLaMA 2)
- Vocabulary size: 128,256
- BOS token ID: 1
- EOS token ID: 2
- Pad token: Same as EOS token (can cause unexpected behavior)

### RoPE Scaling

- Base `rope_theta`: 500,000 (for extended context)
- Default context: 8,192 tokens
- Extended context: 128,000+ tokens with RoPE scaling
- Scaling methods: linear, dynamic NTK-aware scaling

### KV Cache Layout

- Standard per-layer, per-head KV cache
- Grouped Query Attention (GQA): num_key_value_heads < num_attention_heads
- KV cache size: 2 × num_layers × num_kv_heads × head_dim × seq_len

### Attention Quirks

- Uses GQA for memory efficiency
- Standard causal attention mask
- No sliding window attention

### Quantization Compatibility

- Excellent compatibility with GGUF formats
- Q4_K_M, Q5_K_M, Q6_K recommended
- AWQ and GPTQ supported
- FP8 KV cache quantization supported

### Known Bugs

- Attention mask issues when pad token = eos token
- RoPE scaling artifacts at extreme context lengths

### Performance Bottlenecks

- KV cache memory at long contexts
- Memory bandwidth bound at batch size 1

### Conversion Pitfalls

- RoPE scaling parameters must be preserved during conversion
- KV head configuration must be correctly mapped

## Mistral

### Tokenizer

- Uses SentencePiece tokenizer
- Vocabulary size: 32,000
- BOS token ID: 1
- EOS token ID: 2

### RoPE Scaling

- Base `rope_theta`: 10,000
- Sliding window: 4,096 tokens
- Max position embeddings: 131,072
- Supports RoPE scaling for extended context

### KV Cache Layout

- Rolling buffer KV cache for sliding window attention
- Grouped Query Attention: 32 query heads, 8 KV heads (4:1 ratio)
- KV cache size reduced by 4x compared to MHA

### Attention Quirks

- Sliding Window Attention (SWA): Each token attends to previous 4,096 tokens
- Information propagates across layers despite window
- Rolling buffer reuses KV cache memory

### Quantization Compatibility

- Excellent GGUF support
- Q4_K_M, Q5_K_M recommended
- Sliding window reduces memory pressure for quantization

### Known Bugs

- None significant; architecture is stable

### Performance Bottlenecks

- Prefill can be slower than LLaMA due to attention mask complexity
- Decode is fast due to small KV cache

### Conversion Pitfalls

- Sliding window parameter must be preserved
- KV head ratio must be correctly configured

## Qwen

### Tokenizer

- Uses custom tokenizer (tiktoken for Qwen3)
- Vocabulary size: 151,936 (Qwen2), 100,352 (Qwen3)
- Multilingual optimized

### RoPE Scaling

- Base `rope_theta`: 10,000
- Supports interleaved sliding window attention
- Max context: 32,768+ tokens with scaling

### KV Cache Layout

- Grouped Query Attention
- Supports interleaved sliding window (ISWA)
- KV cache compression techniques

### Attention Quirks

- Interleaved sliding window attention supported via HuggingFace config
- Some layers use full attention, others use window
- Rotary position embeddings with custom scaling

### Quantization Compatibility

- Good GGUF support
- Q4_K_M, Q5_K_M recommended
- Flash Attention 2 recommended for acceleration

### Known Bugs

- Tokenizer inconsistencies between versions
- Attention mask edge cases with ISWA

### Performance Bottlenecks

- Prefill can be memory-intensive
- KV cache at long contexts

### Conversion Pitfalls

- Tokenizer vocabulary must match exactly
- ISWA configuration fields must be preserved

## Phi

### Tokenizer

- Phi-3-mini: Uses LLaMA-2 tokenizer (vocabulary 32,064)
- Phi-3-small: Uses tiktoken tokenizer (vocabulary 100,352)
- BOS tokens removed in chat template
- Additional tokens for chat template

### RoPE Scaling

- Base `rope_theta`: 10,000
- Default context: 4K (mini), 8K (small)
- Long context version: 128K via LongRope

### KV Cache Layout

- Grouped Query Attention: 4 queries share 1 key
- Alternative layers of dense and block-sparse attention
- Block-sparse attention for KV cache optimization

### Attention Quirks

- Block-sparse attention pattern
- Mixed dense/sparse layers
- Optimized for edge deployment

### Quantization Compatibility

- Excellent for edge deployment
- AWQ, GPTQ supported
- INT4 quantization well-supported
- ONNX Runtime INT4 DML optimized

### Known Bugs

- Chat template BOS handling quirks
- Block-sparse attention implementation variations

### Performance Bottlenecks

- Small model size limits capacity
- Block-sparse attention kernel efficiency

### Conversion Pitfalls

- Chat template must be preserved
- Block-sparse pattern must be correctly mapped

## Gemma

### Tokenizer

- Uses SentencePiece tokenizer
- Vocabulary size: 256,000
- Multilingual support (140+ languages)

### RoPE Scaling

- Supports extended context
- Context window: 128K (small), 256K (medium)
- Custom RoPE implementation

### KV Cache Layout

- Hybrid KV cache (dense + compression)
- Alternating local sliding-window and global full-context attention
- Sliding windows: 512 tokens (small), 1024 tokens (large)

### Attention Quirks

- Alternating attention pattern (sliding window vs full context)
- Hybrid attention for memory efficiency
- Mixture-of-Experts (MoE) in larger models

### Quantization Compatibility

- Default precision: 16-bit
- Lower precision quantization supported
- GGUF formats available

### Known Bugs

- Attention mask complexity with alternating patterns
- MoE routing edge cases

### Performance Bottlenecks

- KV cache memory at 256K context
- MoE expert loading overhead

### Conversion Pitfalls

- Alternating attention pattern must be preserved
- MoE routing configuration critical

## DeepSeek

### Tokenizer

- Custom tokenizer
- Vocabulary size: ~100K
- Optimized for code and reasoning

### RoPE Scaling

- Multi-Head Latent Attention (MLA) architecture
- Compressed KV cache (90% reduction)
- Context: 1M tokens (DeepSeek-V4)

### KV Cache Layout

- Multi-Head Latent Attention (MLA)
- Compressed sparse attention
- Heavily compressed attention variant
- KV cache size: 10% of standard MHA

### Attention Quirks

- MLA: Stores compressed latent representations instead of full K/V
- Compressed sparse attention pattern
- Risk of needle-in-haystack failures with aggressive compression

### Quantization Compatibility

- MLA inherently compressed
- Additional quantization on top of compression
- FP8 training supported

### Known Bugs

- Needle-in-haystack retrieval failures with extreme compression
- MLA reconstruction errors

### Performance Bottlenecks

- MLA decompression overhead
- Compression quality vs speed trade-off

### Conversion Pitfalls

- MLA compression parameters must be preserved
- Latent dimension configuration critical

## LFM (Liquid AI)

### Tokenizer

- Custom tokenizer
- Vocabulary size: ~64K
- Optimized for on-device deployment

### RoPE Scaling

- Standard RoPE implementation
- Context: 4K-8K typical
- Supports extended context

### KV Cache Layout

- Hybrid architecture: gated short convolution + GQA blocks
- Attention-to-convolution ratio: ~1:3
- Low memory footprint

### Attention Quirks

- Hardware-in-the-loop architecture search
- GQA blocks interspersed with convolution
- Fast prefill and decode

### Quantization Compatibility

- Excellent GGUF support
- Q4_0, Q4_K_M, Q5_K_M, Q6_K, Q8_0, F16
- Optimized for llama.cpp

### Known Bugs

- BOS token double-prepend in formatter
- Convolution block edge cases

### Performance Bottlenecks

- Convolution kernel efficiency
- MoE routing overhead (LFM2)

### Conversion Pitfalls

- Hybrid architecture must be preserved
- Attention/convolution ratio critical
- MoE expert configuration (LFM2)

## LFM2 (Liquid AI Mixture-of-Experts)

### Tokenizer

- Same as LFM
- Vocabulary: ~64K

### RoPE Scaling

- Standard RoPE
- Context: 4K-8K typical

### KV Cache Layout

- MoE with 24B total, 2.3B active parameters
- Same hybrid backbone as LFM
- Top-4 routing

### Attention Quirks

- MoE architecture with sparse activation
- First 2 layers dense for stability
- 10 attention layers out of 40 total

### Quantization Compatibility

- Excellent GGUF support
- Q4_K_M recommended
- Active parameter count tracks latency

### Known Bugs

- MoE routing edge cases
- Expert loading failures

### Performance Bottlenecks

- MoE expert switching overhead
- Expert loading bandwidth

### Conversion Pitfalls

- MoE expert count and routing must be preserved
- Active vs total parameter distinction critical
