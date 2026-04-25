# Qwen Tensor Shapes and Architecture

## Overview

The TensorRT LLM Qwen implementation can be found in models/qwen. The TensorRT LLM Qwen example code is located in examples/models/core/qwen. There is one main file:

- convert_checkpoint.py to build the TensorRT engine(s) needed to run the Qwen model.

In addition, there are two shared files in the parent folder examples for inference and evaluation:

- run.py to run the inference on an input text
- summarize.py to summarize the articles in the cnn_dailymail dataset

## Qwen3

Qwen3 and Qwen3.6 are multimodal mixture-of-experts models featuring a gated delta networks architecture.

### Downloading the Model Weights
### Quick start
### Evaluation
### Model Quantization

### Benchmark

### Serving

### Dynamo

## Qwen3-Next

### NVFP4 quantization

## Notes and Troubleshooting
