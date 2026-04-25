# Debugging Theory

## Overview

This document covers logging patterns, tracing, profiling, breakpoint strategies, post-mortem debugging, memory leak detection, and race condition debugging. These concepts enable MasterControl to become a debugging mentor.

## Logging Patterns

### Log Levels

- **TRACE**: Very detailed information
- **DEBUG**: Debugging information
- **INFO**: Informational messages
- **WARN**: Warning messages
- **ERROR**: Error messages
- **FATAL**: Fatal errors

### Structured Logging

#### JSON Logging

```json
{
  "timestamp": "2024-04-24T20:00:00Z",
  "level": "INFO",
  "message": "User logged in",
  "userId": "123",
  "ip": "192.168.1.1"
}
```

#### Benefits

- **Parseable**: Machine-parseable
- **Queryable**: Easy to query
- **Structured**: Consistent structure
- **Enriched**: Rich context

### Logging Best Practices

- **Context**: Include context
- **Structured**: Use structured logging
- **Appropriate Level**: Use appropriate level
- **No Secrets**: Don't log secrets
- **Performance**: Consider performance impact

### Log Aggregation

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Splunk**: Enterprise logging
- **CloudWatch**: AWS logging
- **Loki**: Grafana logging

## Tracing

### Distributed Tracing

- **Trace**: Single request across services
- **Span**: Single operation
- **Span Context**: Propagated across services
- **Trace ID**: Identifies trace

### OpenTelemetry

```javascript
const { trace, context } = require('@opentelemetry/api');

const tracer = trace.getTracer('my-service');

// Create span
const span = tracer.startSpan('operation');
span.setAttribute('user.id', '123');

// End span
span.end();
```

### Jaeger

- **Collector**: Collects traces
- **Agent**: Receives traces
- **UI**: Web UI for visualization
- **Storage**: Storage backend

### Zipkin

- **Collector**: Collects traces
- **Storage**: Storage backend
- **UI**: Web UI
- **Query**: Query traces

### Tracing Best Practices

- **Propagate Context**: Propagate trace context
- **Spans**: Create spans for operations
- **Attributes**: Add attributes to spans
- **Sampling**: Use appropriate sampling

## Profiling

### CPU Profiling

- **Sampling**: Statistical sampling
- **Instrumentation**: Precise instrumentation
- **Flame Graphs**: Visualize call stacks
- **Hotspots**: Identify hotspots

### Memory Profiling

- **Heap**: Heap memory
- **Stack**: Stack memory
- **Leaks**: Memory leaks
- **Allocation**: Allocation patterns

### Profiling Tools

#### CPU Profiling

- **perf**: Linux CPU profiler
- **VTune**: Intel profiler
- **pprof**: Go profiler
- **py-spy**: Python profiler

#### Memory Profiling

- **Valgrind**: Memory debugging
- **heaptrack**: Heap tracking
- **jemalloc**: Memory allocator
- **DHAT**: Heap analysis tool

#### Application Profiling

- **pprof**: Go profiler
- **py-spy**: Python profiler
- **pyflame**: Python flame graph
- **perf**: Linux profiler

### Profiling Workflow

1. **Baseline**: Profile baseline
2. **Profile**: Profile after changes
3. **Compare**: Compare results
4. **Optimize**: Optimize bottlenecks
5. **Verify**: Verify improvements

## Breakpoint Strategies

### Breakpoint Types

- **Line Breakpoint**: Stop at specific line
- **Conditional Breakpoint**: Stop when condition met
- **Function Breakpoint**: Stop at function entry
- **Exception Breakpoint**: Stop on exception
- **Data Breakpoint**: Stop when data changes

### Conditional Breakpoints

```javascript
// Stop only when userId equals 123
debugger;
if (userId === 123) {
  debugger;
}
```

### Logpoints

- **Log Message**: Log message instead of breaking
- **No Stop**: Continue execution
- **Conditional**: Conditional logging
- **Performance**: Less overhead than breakpoints

### Watchpoints

- **Watch Variable**: Watch variable value
- **Watch Expression**: Watch expression
- **Break on Change**: Break when value changes
- **Hardware**: Hardware watchpoints

### Breakpoint Best Practices

- **Strategic**: Place strategically
- **Conditional**: Use conditions
- **Temporary**: Remove when done
- **Document**: Document breakpoints

## Post-Mortem Debugging

### Core Dumps

- **Core Dump**: Memory snapshot at crash
- **Enable**: Enable core dumps
- **Analyze**: Analyze with debugger
- **Symbolic**: Use symbolic information

#### Linux Core Dumps

```bash
# Enable core dumps
ulimit -c unlimited

# Analyze core dump
gdb executable core
```

#### Windows Mini Dumps

- **Mini Dump**: Partial memory dump
- **Full Dump**: Full memory dump
- **WinDbg**: Windows debugger
- **Process**: Process Explorer

### Crash Reporting

- **Sentry**: Crash reporting
- **Bugsnag**: Crash reporting
- **Crashlytics**: Mobile crash reporting
- **Breakpad**: Google's crash reporter

### Post-Mortem Analysis

1. **Reproduce**: Try to reproduce
2. **Logs**: Analyze logs
3. **Dumps**: Analyze dumps
4. **Root Cause**: Find root cause
5. **Fix**: Fix issue
6. **Prevent**: Prevent recurrence

## Memory Leak Detection

### Memory Leak Types

- **Unfreed Memory**: Memory not freed
- **Growing Cache**: Cache grows indefinitely
- **Circular References**: Circular references prevent GC
- **Event Listeners**: Event listeners not removed

### Detection Tools

#### Valgrind

```bash
# Detect memory leaks
valgrind --leak-check=full ./program
```

#### heaptrack

```bash
# Track heap allocations
heaptrack ./program
```

#### AddressSanitizer

```bash
# Compile with ASan
gcc -fsanitize=address -g program.c -o program

# Run with ASan
./program
```

### Memory Leak Patterns

#### Common Leaks

- **Forgotten Free**: Forgot to free memory
- **Reference Cycle**: Reference cycle
- **Global Variables**: Global variables
- **Caches**: Unbounded caches

#### Detection Strategies

- **Monitor**: Monitor memory usage
- **Profile**: Profile memory allocations
- **Analyze**: Analyze growth patterns
- **Test**: Test for leaks

### Fixing Memory Leaks

- **Free Memory**: Free memory when done
- **Weak References**: Use weak references
- **Cache Limits**: Limit cache size
- **Object Pools**: Use object pools

## Race Condition Debugging

### Race Condition Types

- **Data Race**: Concurrent access to shared data
- **Race Condition**: Timing-dependent behavior
- **Deadlock**: Circular waiting
- **Livelock**: Busy waiting

### Detection Tools

#### ThreadSanitizer (TSan)

```bash
# Compile with TSan
gcc -fsanitize=thread -g program.c -o program

# Run with TSan
./program
```

#### Helgrind

```bash
# Detect data races
valgrind --tool=helgrind ./program
```

#### Java Thread Analysis

- **VisualVM**: Java profiler
- **JConsole**: Java monitoring
- **YourKit**: Java profiler
- **JProfiler**: Java profiler

### Debugging Race Conditions

- **Reproduce**: Try to reproduce
- **Add Logging**: Add logging
- **Use Tools**: Use race detection tools
- **Analyze**: Analyze execution

### Fixing Race Conditions

- **Locks**: Use locks
- **Atomic Operations**: Use atomic operations
- **Immutable Data**: Use immutable data
- **Message Passing**: Use message passing

## Debugging Strategies

### Debugging Workflow

1. **Reproduce**: Reproduce the issue
2. **Isolate**: Isolate the problem
3. **Hypothesize**: Form hypothesis
4. **Test**: Test hypothesis
5. **Fix**: Fix the issue
6. **Verify**: Verify the fix

### Binary Search Debugging

- **Half**: Eliminate half the code
- **Repeat**: Repeat until found
- **Git Bisect**: Use git bisect
- **Comment Out**: Comment out code

### Rubber Duck Debugging

- **Explain**: Explain code to duck
- **Think**: Think through problem
- **Insight**: Gain insight
- **Solve**: Solve problem

### Debugging Mindset

- **Curiosity**: Be curious
- **Systematic**: Be systematic
- **Patient**: Be patient
- **Persistent**: Be persistent

## Debugging Tools

### Debuggers

- **GDB**: GNU Debugger
- **LLDB**: LLDB Debugger
- **WinDbg**: Windows Debugger
- **Visual Studio**: Visual Studio Debugger

### IDE Debuggers

- **VS Code**: VS Code Debugger
- **IntelliJ**: IntelliJ Debugger
- **Eclipse**: Eclipse Debugger
- **Xcode**: Xcode Debugger

### Browser Debugging

- **Chrome DevTools**: Chrome Developer Tools
- **Firefox DevTools**: Firefox Developer Tools
- **Safari Web Inspector**: Safari Inspector
- **Edge DevTools**: Edge Developer Tools

## Best Practices

### Logging

- **Structured**: Use structured logging
- **Levels**: Use appropriate levels
- **Context**: Include context
- **Performance**: Consider performance

### Debugging

- **Small Steps**: Debug in small steps
- **Reproduce**: Reproduce issue
- **Isolate**: Isolate problem
- **Document**: Document findings

### Performance

- **Profile**: Profile before optimizing
- **Measure**: Measure improvements
- **Bottlenecks**: Focus on bottlenecks
- **Verify**: Verify improvements

### Memory

- **Monitor**: Monitor memory usage
- **Detect**: Detect leaks early
- **Fix**: Fix leaks promptly
- **Test**: Test for leaks
