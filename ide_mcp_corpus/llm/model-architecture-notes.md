# Model Family Architecture Notes

## Mistral Architecture

### Key Parameters

- Hidden dimension: 4096
- Number of layers: 32
- Attention heads: 32
- KV heads: 8 (grouped query attention)
- Feed-forward hidden dimension: 14336
- Vocabulary size: 32000
- Context length: 8192 tokens (sliding window of 4096)
- Total parameters: 7.3 billion

### Architectural Innovations

- Sliding Window Attention (SWA)
- Rolling Buffer KV Cache
- Pre-fill Chunking
- Grouped Query Attention (GQA)
- RMSNorm for layer normalization
- SwiGLU for feed-forward network
- Rotary Position Embeddings (RoPE)

### Sliding Window Attention

Limits the computational burden of attention while preserving the model's ability to reason over long contexts. Instead of allowing every token to attend to every other token (O(N²) complexity), SWA restricts attention to a sliding window of tokens.

### Rolling Buffer KV Cache

Efficient memory management technique that reuses KV cache memory by rolling through tokens, reducing memory requirements for long sequences.

### Pre-fill Chunking

Divides the pre-fill phase into chunks to manage memory and compute efficiently during initial context processing.

## Qwen Architecture

### Key Features

- Grouped Query Attention (GQA)
- SwiGLU activation
- Multilingual tokenization
- Supports interleaved sliding window attention (SWA) via HuggingFace config fields (layer_types, max_window_layers)
- Optimized for Chinese and English performance

### SWA Support

Qwen3 architecture supports interleaved sliding window attention, which is already natively supported by HuggingFace Transformers.

## Phi Architecture

### Characteristics

- Latency-focused design
- Smaller KV cache
- Efficient for edge deployment
- Optimized for lower resource environments

## Common Architecture Quirks

### Rotary Position Embeddings (RoPE)

- Base frequency (rope_theta) typically 10000.0
- Different models may use different frequency scaling
- Edge cases at sequence boundaries require special handling

### Grouped Query Attention

- Reduces KV cache memory by sharing KV heads across query heads
- Typical ratios: 4:1 or 8:1 (query:KV heads)
- Requires specialized attention kernel implementations

### Sliding Window Variations

- Fixed window size (e.g., 4096 tokens)
- Interleaved window (some layers have full attention, others have window)
- Independent Sliding Window Attention (ISWA)
- Unified KV cache with SWA support
