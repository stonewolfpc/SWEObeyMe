# Intel Memory Bandwidth Allocation (MBA)

## Introduction

In today's complex data center and enterprise deployments, conditions may arise where memory bandwidth is constrained under heavy system load, for instance when consolidating many virtual machines onto a server system. In other cases, the performance or responsiveness of certain applications might depend on having a given amount of memory bandwidth available to perform at an acceptable level, and the presence of other consolidated applications may lead to performance interference effects.

Intel Resource Director Technology (Intel RDT) provides a series of technologies to provide increased monitoring insight into how shared system resources such as the last-level cache and memory bandwidth are used and controls over the last-level cache. Previously available Intel RDT features do not provide control over memory bandwidth, however.

The Intel Xeon Scalable processors introduce Memory Bandwidth Allocation (MBA), which provides new levels of control over how memory bandwidth is distributed across running applications. MBA enables improved prioritization, bandwidth management and is a valuable tool to help control data center noisy neighbors.

## Memory Bandwidth Allocation Architecture (MBA)

The MBA feature provides approximate and indirect per-core control over memory bandwidth. A new programmable bandwidth controller has been introduced between each core and the shared high-speed interconnect which connects the cores in Intel Xeon processors. This enables bandwidth downstream of shared resources such as memory bandwidth to be controlled.

MBA is complementary to existing Intel RDT features such as Cache Allocation Technology (CAT). For instance, CAT may be used to control the last-level cache, while MBA may be used to control memory bandwidth.

## Usage Considerations

MBA is particularly useful for:
- Memory bandwidth allocation for model loading and inference workloads
- Preventing noisy neighbor effects in multi-tenant environments
- Prioritizing critical workloads that require guaranteed memory bandwidth
- Optimizing performance for AI/ML workloads with high memory bandwidth requirements

The programmable controller allows fine-tuning of memory bandwidth allocation per core, enabling system administrators to optimize resource allocation for specific workloads.
