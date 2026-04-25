# C++ Hardware Monitoring with cppuprofile

## Overview

cppuprofile is a C++ library for monitoring CPU, Memory and execution time targeting Linux embedded devices. It provides system memory and CPU usage monitoring, time execution recording, and GPU monitoring capabilities.

## System Memory and CPU Usage Monitoring

```cpp
#include <uprofile/uprofile.h>

...
uprofile::start("uprofile.log");
uprofile::startSystemMemoryMonitoring(200);
uprofile::startCPUUsageMonitoring(200);
...
uprofile::stop();
```

## Record Time Execution

```cpp
uprofile::timeBegin("my_custom_function");
...
uprofile::timeEnd("my_custom_function");
```

### Limit the Size of the Profiling File

```cpp
uprofile::start("uprofile.log", 500000 /* max file size in bytes */);
```

This will generate two rotating files with the most recent events. With the above example, both files will be uprofile_0.log and uprofile_1.log.

## GPU Monitoring

The library also supports GPU metrics monitoring like usage and memory. Since GPU monitoring is specific to each vendor, an interface IGPUMonitor is available to abstract each vendor monitor system.

To monitor a specific GPU, you must subclass IGPUMonitor:

```cpp
#include <uprofile/igpumonitor.h>

class MyGPUMonitor: public uprofile::IGPUMonitor {
public:
    const std::vector<float>& getUsage() const override;
    void getMemory(std::vector<int>& usedMem, std::vector<int>& totalMem) override;
}
```

As you can see from the interface methods, cppuprofile supports multi-gpu monitoring.

And then inject it at runtime to the uprofile monitoring system:

```cpp
uprofile::addGPUMonitor(new MyGPUMonitor);
uprofile::start("uprofile.log");
uprofile::startGPUMemoryMonitoring(200);
uprofile::startGPUUsageMonitoring(200);
```

## Supported GPU Monitoring

Here is the list of GPUs supported by cppuprofile:

- NVidia Graphics Cards (through nvidia-smi). Pass -DGPU_MONITOR_NVIDIA=ON as compile option and inject uprofile::NvidiaMonitor from monitors/nvidiamonitor.h as GPUMonitor. The nvidia-smi tool should be installed into /usr/bin directory.

## Windows Support Limitations

The library compiles on Windows but only time execution is supported so far. Monitoring metrics like CPU Usage and system, process and nvidia GPU memory are not supported on Windows.
