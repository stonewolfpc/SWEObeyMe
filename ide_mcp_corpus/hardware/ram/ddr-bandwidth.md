# DDR DDR2 DDR3 DDR4 and DDR5 Bandwidth by Generation

## Overview

Here is a simple table with the memory bandwidth for a single channel DIMM by generation. In a system, there are often many memory channels, and one does not achieve peak bandwidth on all platforms and scenarios, but it is still interesting to look at.

## Key Points

When folks in the industry say that DDR5-4800 found in AMD EPYC 9004 Genoa and 4th Gen Intel Xeon Scalable Sapphire Rapids is a big deal, this is why. Memory bandwidth per DIMM gets a ~50% boost. That is why we say that AMD EPYC Genoa, with 50% more memory channels, has the capability to do more than 2x the DDR4-3200 "Rome/Milan" generation bandwidth. Likewise, the Intel Xeon Sapphire Rapids may have eight memory channels (omitting that technically DDR5 is two 40+8 channels while DDR4 is 72+8), it has 50% more theoretical bandwidth than the previous-gen Ice Lake Xeons.

## Performance Comparison

The chart shows the progression of memory bandwidth across DDR generations:

- DDR3: Lower bandwidth, older technology
- DDR4: Standard for many current systems
- DDR5: ~50% bandwidth increase over DDR4, with higher frequencies and more banks allowing lower latency random access

DDR5 also has more banks, allowing lower latency random access and thus higher real-world throughput compared to DDR4 even at the same frequency. This is especially important for memory-intensive workloads like AI model loading and inference.
