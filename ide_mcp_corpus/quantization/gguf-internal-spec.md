# GGUF Internal Specification

## Overview

GGUF is a format based on the existing GGJT, but makes a few changes to the format to make it more extensible and easier to use. The following features are desired:

- Single-file deployment: they can be easily distributed and loaded, and do not require any external files for additional information.
- Extensible: new features can be added to GGML-based executors/new information can be added to GGUF models without breaking compatibility with existing models.
- mmap compatibility: models can be loaded using mmap for fast loading and saving.
- Easy to use: models can be easily loaded and saved using a small amount of code, with no need for external libraries, regardless of the language used.
- Full information: all information needed to load a model is contained in the model file, and no additional information needs to be provided by the user.

The key difference between GGJT and GGUF is the use of a key-value structure for the hyperparameters (now referred to as metadata), rather than a list of untyped values. This allows for new metadata to be added without breaking compatibility with existing models, and to annotate the model with additional information that may be useful for inference or for identifying the model.

## File Structure

A GGUF file is organized into four major logical regions, read sequentially:

1. HEADER - Magic + Version + Counts
2. METADATA KV PAIRS - Model Configuration
3. TENSOR INFOS - Tensor Descriptors
4. TENSOR DATA - Quantized Weights

## Header

The header is the first 24 bytes of every GGUF file and contains essential identification and counting information.

## Tensor Data Section

The final and largest section contains the actual tensor weights. Data is aligned for efficient memory-mapped access.

## Standardized Tensor Names

To minimize complexity and maximize compatibility, it is recommended that models using the transformer architecture use the following naming convention for their tensors.

## Block Layout Maps

### Q4_0

Standard 4-bit quantization with uniform scaling per block.

### Q4_K_S

Small K-quantization variant with minimal metadata overhead.

### Q4_K_M

Medium K-quantization variant balancing accuracy and size.

### Q5_K_M

5-bit K-quantization with medium block size.

### Q6_K

6-bit quantization for higher precision requirements.

### IQ\* Formats

Importance-weighted quantization formats with adaptive precision.

### LFM Custom Blocks

Liquid AI specific block layouts for their model architecture.

### Qwen Rotary + Fused Attention Blocks

Qwen-specific attention implementation with rotary embeddings and fused operations.

## Memory Mapping

GGUF is designed for memory-mapped access, enabling:

- Zero-copy loading
- Direct tensor access from file
- Efficient memory usage
- Fast model initialization
