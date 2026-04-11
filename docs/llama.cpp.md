# llama.cpp

> **License**: MIT License
> **Source**: https://github.com/ggml-org/llama.cpp
> **Redistributed with attribution as required by MIT License**

## Introduction

llama.cpp is a C/C++ implementation of LLM inference with a focus on performance and portability. It is designed to run efficiently on a wide variety of hardware, from consumer laptops to high-end servers.

## Key Features

- **Multiple Backend Support**: Metal (Apple Silicon), CUDA (NVIDIA), ROCm/HIP (AMD), Vulkan, OpenCL, SYCL (Intel), and CPU
- **GGUF Format**: Native support for the GGUF (GGML Universal Format) file format
- **Quantization**: Support for various quantization schemes (Q4_0, Q4_K_M, Q5_K_M, Q8_0, etc.)
- **Token Generation**: Efficient token generation with various sampling methods
- **Server Mode**: HTTP server mode for remote inference
- **Cross-Platform**: Runs on Windows, macOS, Linux, and mobile devices

## Quick Start

### Building from Source

```bash
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp

# CPU build
make

# CUDA build
make GGML_CUDA=1

# Metal build (macOS)
make GGML_METAL=1
```

### Running Inference

```bash
# Download a GGUF model from Hugging Face
# Example: llama-3-8b-instruct

# Run inference
./llama-cli -m models/llama-3-8b-instruct.gguf -p "Hello, my name is"

# Interactive mode
./llama-cli -m models/llama-3-8b-instruct.gguf -cnv
```

## Architecture

### Components

1. **ggml**: Low-level tensor library for ML operations
2. **llama**: High-level LLM inference engine
3. **sampling**: Token sampling strategies
4. **tokenization**: Text-to-tokens conversion

### Model Loading

Models are loaded in GGUF format, which contains:
- Model weights (tensors)
- Metadata (hyperparameters, vocabulary, etc.)
- Tokenizer data

## Supported Backends

| Backend | Target devices |
| --- | --- |
| Metal | Apple Silicon |
| CUDA | NVIDIA GPU |
| HIP | AMD GPU |
| Vulkan | GPU (cross-platform) |
| SYCL | Intel GPU |
| OpenCL | GPU (various vendors) |
| BLAS | CPU (optimized) |

## API Usage

### Basic Inference (C/C++)

```cpp
#include "llama.h"

// Load model
llama_model_params model_params = llama_model_default_params();
llama_model* model = llama_load_model_from_file("model.gguf", model_params);

// Create context
llama_context_params ctx_params = llama_context_default_params();
llama_context* ctx = llama_new_context_with_model(model, ctx_params);

// Tokenize input
std::vector<llama_token> tokens;
// ... tokenization code ...

// Generate tokens
for (int i = 0; i < n_predict; i++) {
    llama_token new_token_id = llama_sample_token(ctx, ...);
    // ... process token ...
}
```

## Building Custom Inference Engine

To build a custom model loader/inference engine:

1. **Link against ggml**: Include ggml headers and link the library
2. **Load GGUF**: Use GGUF parsing utilities
3. **Initialize Backend**: Set up your compute backend (CUDA, Metal, etc.)
4. **Load Weights**: Map tensors to GPU/CPU memory
5. **Implement Forward Pass**: Define the model architecture and forward pass
6. **Token Generation**: Implement sampling strategies

See the `examples/` directory in the llama.cpp repository for reference implementations.

## Resources

- [GitHub Repository](https://github.com/ggml-org/llama.cpp)
- [GGUF Specification](https://github.com/ggml-org/ggml/blob/master/docs/gguf.md)
- [GGML Repository](https://github.com/ggml-org/ggml)
- [Hugging Face GGUF Models](https://huggingface.co/models?library=gguf)

## Version

This documentation corresponds to llama.cpp as of April 2026.
