# NVMe SSD Memory Bandwidth

## Overview

NVMe (Non-Volatile Memory Express) is a data transfer protocol designed specifically for flash storage and SSDs, introduced in 2011 as an alternative to SATA and SAS protocols. NVMe delivers significantly higher throughput and lower latency than its predecessors.

## Performance Specifications

### Bandwidth by PCIe Generation

- PCIe 3.0: 8 GT/s per lane (1 GB/s per lane)
- PCIe 4.0: 16 GT/s per lane (2 GB/s per lane)
- PCIe 5.0: 32 GT/s per lane (4 GB/s per lane)
- PCIe 6.0: 64 GT/s per lane (8 GB/s per lane)

### Real-World Throughput

- PCIe 4.0 drives: Up to 7 GB/s (e.g., Samsung 990 Pro)
- PCIe 5.0 drives: Up to 14 GB/s (e.g., Kioxia CM7, Micron 9550)
- Theoretical maximum (PCIe 6.0, 16 lanes): Up to 256 GB/s
- Typical consumer drives: 3,000-7,500 MB/s

### IOPS Performance

- SATA SSDs: Up to 100,000 IOPS
- SAS SSDs: 200,000-400,000 IOPS (average)
- NVMe PCIe 4.0: Up to 1.4 million IOPS (Samsung 990 Pro)
- NVMe PCIe 5.0: Up to 3.3 million IOPS (Micron 9550)

### Latency

- SATA SSDs: Typically > 100 µs
- SAS SSDs: Can fall below 100 µs but still limited by protocol
- NVMe SSDs: Can achieve < 20 µs for top drives
- Some NVMe drives: Closer to 100 µs or higher

## Protocol Comparison

### Command Queues

- SATA: 1 queue, up to 32 commands
- SAS: 1 queue, up to 256 commands
- NVMe: Up to 65,535 queues, up to 65,535 commands per queue

### CPU Efficiency

- NVMe requires fewer than half the CPU instructions compared to SATA/SAS
- Uses RDMA over PCIe bus to map I/O commands directly to host shared memory
- Each CPU instruction cycle supports higher IOPS and reduces software stack latency

### Bandwidth Limits

- SATA: 6 Gbps
- SAS: 12 Gbps
- NVMe: Scales with PCIe generation (theoretically up to 256 GB/s with PCIe 6.0)

## Key Differentiators

### Parallelism

NVMe's extensive queuing mechanism enables better use of SSD parallel processing capabilities. Tens of thousands of parallel command queues can run simultaneously.

### Direct Memory Access

NVMe uses RDMA over PCIe to map I/O commands and responses directly to host memory, reducing CPU overhead.

### Protocol Design

- SATA and SAS were designed for HDDs
- NVMe was designed from the ground up specifically for SSDs
- NVMe uses a streamlined command set optimized for flash storage

## Workload Impact

Performance metrics vary significantly based on:
- Read vs. write operations
- Random vs. sequential access
- Queue depth
- Drive-specific optimizations

## Comparison to RAM

DDR4 3200MHz bandwidth: 25.6 GB/s (25,600 MB/s)
NVMe SSD @ 7 GB/s: Significantly slower than RAM
NVMe SSD @ 14 GB/s: Still ~2x slower than DDR4-3200

NVMe SSDs are not suitable as direct RAM replacement despite high throughput due to latency differences and access patterns.
