# xFormers Attention Mechanism

## Overview

xFormers is a PyTorch extension library providing composable and optimized Transformer blocks. It offers memory-efficient attention implementations including Flash Attention variants.

## Memory-Efficient Attention

### Available Implementations

xFormers provides multiple implementations of memory-efficient attention:
- Flash Attention implementation
- Non-autograd implementations for inference-only scenarios
- Partial attention support for specific use cases

### Key Features

- Reduces memory bandwidth requirements from O(N²) to O(N)
- Tiling-based computation to avoid full attention matrix materialization
- Online softmax computation
- Recomputation strategies for memory savings

## Attention Biases

xFormers supports various attention bias types that can be used as the `attn_bias` argument in `xformers.ops.memory_efficient_attention`:

- Bias classes define alternative inputs for attention masks
- When using `xformers.ops.AttentionBias` instead of a `torch.Tensor`, the mask matrix does not need to be materialized
- This reduces memory overhead for sparse or structured attention patterns

## Integration with Diffusers

Hugging Face Diffusers recommends xFormers for both inference and training:

- Optimizations in attention blocks provide faster speed
- Reduced memory consumption
- Use `enable_xformers_memory_efficient_attention()` to enable

## vLLM Integration

vLLM provides xFormers backend implementation:

- For encoder/decoder models, `XFormersImpl.forward()` handles both self- and cross-attention
- Self-attention: query, key, and value must be non-None
- Cross-attention: Query must be non-None; key and value get cached during prefill

## Use Cases

- Training large transformer models with limited GPU memory
- Inference with long sequences
- Models requiring custom attention patterns (via attention biases)
- Diffusion model optimization

## Performance Characteristics

- Memory savings proportional to sequence length
- Speed improvements from reduced memory bandwidth pressure
- Trade-offs between memory and compute for certain attention patterns
