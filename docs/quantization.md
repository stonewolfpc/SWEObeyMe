# Model Quantization Guide

> **Source**: https://github.com/ggml-org/llama.cpp/tree/master/tools/quantize

## Overview

Quantization is the process of reducing the precision of model weights to decrease memory usage and improve inference speed. This guide covers the quantization methods available in llama.cpp and GGML-based inference engines.

## Why Quantize?

- **Reduced Memory Usage**: 4-bit quantized models use ~1/4 the memory of FP16
- **Faster Inference**: Less data to transfer and process
- **Lower Power Consumption**: Critical for mobile and edge devices
- **Smaller Model Size**: Easier distribution and storage

## Quantization Formats

### K-Quantization (Recommended)

K-quants provide excellent quality at low bit rates by mixing quantization levels:

| Format | Bits/Weight | Description                | Use Case              |
| ------ | ----------- | -------------------------- | --------------------- |
| Q4_K_M | 4           | Medium 4-bit (recommended) | Balanced quality/size |
| Q4_K_S | 4           | Small 4-bit                | Maximum compression   |
| Q5_K_M | 5           | Medium 5-bit               | Higher quality        |
| Q5_K_S | 5           | Small 5-bit                | Quality/size balance  |
| Q6_K   | 6           | 6-bit                      | High quality          |
| Q8_0   | 8           | 8-bit (legacy)             | Near-FP16 quality     |

### Legacy Formats

| Format | Bits/Weight | Notes                                    |
| ------ | ----------- | ---------------------------------------- |
| Q4_0   | 4           | Original 4-bit, faster but lower quality |
| Q4_1   | 4.5         | Improved 4-bit with bias                 |
| Q5_0   | 5           | Original 5-bit                           |
| Q5_1   | 5.5         | Improved 5-bit with bias                 |
| Q8_0   | 8           | Original 8-bit                           |
| F16    | 16          | Half precision, no quantization          |
| F32    | 32          | Full precision, no quantization          |

## Quantization Process

### Using llama.cpp quantize Tool

```bash
# Basic quantization to Q4_K_M
./llama-quantize model-f16.gguf model-q4_k_m.gguf Q4_K_M

# Quantize with specific tensor types
./llama-quantize model-f16.gguf model-mixed.gguf Q4_K_M --output-tensor-type F32

# Quantize with layer pruning
./llama-quantize model-f16.gguf model-pruned.gguf Q4_K_M --tensor-type attn_v=Q5_K_M --tensor-type ffn_down=Q5_K_M
```

### Python Conversion

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

# Load model
model = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-2-7b")
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b")

# Convert to GGUF using llama.cpp convert script
# See: https://github.com/ggml-org/llama.cpp/tree/master/convert
```

## Best Practices

### Choosing a Format

1. **Q4_K_M**: Best balance for most use cases (~4 bits/weight)
2. **Q5_K_M**: When quality is critical (~5 bits/weight)
3. **Q8_0**: Near-lossless, but larger (~8 bits/weight)
4. **F16**: When quantization artifacts are unacceptable

### Important Tensors

Some tensors are more sensitive to quantization:

- **output.weight**: Keep at higher precision (F16 or Q5_K_M)
- **token_embd.weight**: Use Q4_K_M or higher
- **attention tensors**: Generally tolerant of quantization
- **feed-forward tensors**: Can use aggressive quantization

### Mixed Quantization Strategy

```bash
# Keep output tensor at F16, quantize rest to Q4_K_M
./llama-quantize model.gguf output.gguf Q4_K_M --output-tensor-type F16

# Use different quantization for different layers
./llama-quantize model.gguf output.gguf Q4_K_M \
  --tensor-type attn_v=Q5_K_M \
  --tensor-type attn_output=Q5_K_M \
  --tensor-type ffn_down=Q5_K_M
```

## Perplexity Testing

Measure quality degradation with perplexity:

```bash
# Calculate perplexity on a test dataset
./llama-perplexity -m model-q4_k_m.gguf -f test.txt

# Compare with base model
./llama-perplexity -m model-f16.gguf -f test.txt
```

Lower perplexity = better quality. Small increases (5-10%) are usually acceptable.

## Memory Requirements

| Model Size | F16    | Q4_K_M | Q5_K_M | Q8_0  |
| ---------- | ------ | ------ | ------ | ----- |
| 7B         | 14 GB  | 4 GB   | 5 GB   | 7 GB  |
| 13B        | 26 GB  | 7.5 GB | 9.5 GB | 13 GB |
| 70B        | 140 GB | 40 GB  | 50 GB  | 70 GB |

Note: Additional memory required for context/kv-cache.

## Implementing Custom Quantization

To implement your own quantization:

1. **Choose Quantization Type**: Decide on bit depth and method
2. **Group Weights**: Typically group by 32 or 128 values
3. **Calculate Scales**: Determine per-group scaling factors
4. **Quantize**: Convert FP32/FP16 to lower precision
5. **Dequantize**: Implement reverse conversion for inference

### Example: Simple 4-bit Quantization

```python
import numpy as np

def quantize_q4(weights):
    """
    Simple 4-bit quantization (per-group)
    """
    group_size = 32
    shape = weights.shape

    # Reshape into groups
    weights_flat = weights.reshape(-1)
    num_groups = len(weights_flat) // group_size
    weights_grouped = weights_flat[:num_groups * group_size].reshape(num_groups, group_size)

    # Calculate scales and mins
    wmin = weights_grouped.min(axis=1, keepdims=True)
    wmax = weights_grouped.max(axis=1, keepdims=True)
    scale = (wmax - wmin) / 15.0  # 4-bit = 16 values (0-15)

    # Quantize
    quantized = np.round((weights_grouped - wmin) / scale).astype(np.uint8)

    # Pack into bytes (2 values per byte)
    packed = np.zeros(num_groups * group_size // 2, dtype=np.uint8)
    for i in range(0, group_size, 2):
        packed[i//2] = (quantized[:, i] & 0x0F) | ((quantized[:, i+1] & 0x0F) << 4)

    return {
        'data': packed,
        'scales': scale.flatten(),
        'mins': wmin.flatten(),
        'shape': shape
    }

def dequantize_q4(quantized_dict):
    """
    Dequantize 4-bit weights back to float
    """
    data = quantized_dict['data']
    scales = quantized_dict['scales']
    mins = quantized_dict['mins']
    shape = quantized_dict['shape']

    # Unpack bytes
    low = data & 0x0F
    high = (data >> 4) & 0x0F
    quantized = np.stack([low, high], axis=1).flatten()

    # Dequantize
    group_size = 32
    num_groups = len(quantized) // group_size
    quantized_grouped = quantized[:num_groups * group_size].reshape(num_groups, group_size)

    scales = scales.reshape(-1, 1)
    mins = mins.reshape(-1, 1)

    weights = quantized_grouped * scales + mins

    return weights.reshape(shape)
```

## Advanced Topics

### Importance Matrix Quantization

For better quality, quantize based on activation importance:

```bash
# Generate importance matrix
./llama-imatrix -m model.gguf -f calibration.txt -o imatrix.dat

# Quantize using importance matrix
./llama-quantize --imatrix imatrix.dat model.gguf output.gguf Q4_K_M
```

### Re-quantization

Convert between quantization formats:

```bash
# Re-quantize from Q4_K_M to Q5_K_M
./llama-quantize model-q4_k_m.gguf model-q5_k_m.gguf Q5_K_M --allow-requantize
```

Note: Each re-quantization loses some quality. Avoid multiple conversions.

## Troubleshooting

### Poor Quality Output

1. Try Q5_K_M instead of Q4_K_M
2. Keep output tensor at F16
3. Use importance matrix quantization
4. Check calibration data matches your use case

### Out of Memory

1. Use more aggressive quantization (Q4_K_S)
2. Reduce context length
3. Use memory-mapped model loading
4. Enable swap/paging

### Slow Inference

1. Ensure GPU offloading is enabled (`-ngl 999`)
2. Use appropriate batch size
3. Check if quantized tensors are GPU-resident
4. Try different quantization format (Q4_0 is fastest)

## Resources

- [llama.cpp Quantization](https://github.com/ggml-org/llama.cpp/tree/master/tools/quantize)
- [GGUF Format](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
- [The Case for 4-bit Precision](https://arxiv.org/abs/2212.09720)
- [GPTQ Paper](https://arxiv.org/abs/2210.17323)

## Version

This guide reflects quantization methods available in llama.cpp as of April 2026.
