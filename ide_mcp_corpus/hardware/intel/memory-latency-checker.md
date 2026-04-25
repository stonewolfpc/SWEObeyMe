# Intel Memory Latency Checker

## Introduction

An important factor in determining application performance is the time required for the application to fetch data from the processor's cache hierarchy and from the memory subsystem. In a multi-socket system where Non-Uniform Memory Access (NUMA) is enabled, local memory latencies and cross-socket memory latencies will vary significantly.

Besides latency, bandwidth (b/w) also plays a big role in determining performance. Measuring these latencies and b/w is important to establish a baseline for the system under test, and for performance analysis.

Intel Memory Latency Checker (Intel MLC) is a tool used to measure memory latencies and b/w, and how they change with increasing load on the system. It also provides several options for more fine-grained investigation where b/w and latencies from a specific set of cores to caches or memory can be measured as well.

## What the Tool Measures

- Memory latencies at different load levels
- Memory bandwidth under various conditions
- Cache hierarchy performance
- NUMA local vs remote memory access
- Latency and bandwidth from specific cores to caches/memory

## How It Works

The tool uses controlled memory access patterns to:

- Measure actual read/write latencies
- Determine sustained bandwidth
- Detect cache behavior under load
- Identify NUMA effects
- Profile prefetch behavior

## Installation

Intel MLC supports both Linux and Windows.

## Usage for Model Loading Performance

When optimizing for LLM model loading:

- Measure baseline memory bandwidth
- Test with different quantization formats
- Profile KV cache memory access patterns
- Identify bottlenecks in tensor loading
- Compare Q4_K_M vs Q4_0 bandwidth requirements
- Test AVX2 vs AVX512 throughput differences

## Cache Behavior Analysis

- Cache thrashing detection
- Prefetch effectiveness
- Block size tuning recommendations
- Cache-friendly access pattern validation
