# LFM (Liquid AI) Quantization Formats

## Model Formats - Quantization

### GGUF
Supports Q4_0, Q4_K_M, Q5_K_M, Q6_K, Q8_0, BF16, and F16. Q4_K_M offers the best balance of size and quality.

### MLX
Available in 3bit, 4bit, 5bit, 6bit, 8bit, and BF16. 8bit is recommended.

### ONNX
Supports FP32, FP16, Q4, and Q8 (MoE models also support Q4F16). Q4 is recommended for most deployments.

## Quantization Types

### GGUF Quantization
- Q4_0
- Q4_K_M
- Q5_K_M
- Q6_K
- Q8_0
- BF16
- F16

### MLX Quantization
- 3bit
- 4bit
- 5bit
- 6bit
- 8bit
- BF16

### ONNX Quantization
- FP32
- FP16
- Q4
- Q8
- Q4F16 (for MoE models)

Note: Q4_K_M is the most popular and offers the best balance of size and quality for GGUF format.
