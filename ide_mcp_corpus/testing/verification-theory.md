# Testing & Verification Theory

## Overview

This document covers property-based testing, invariant testing, metamorphic testing, concurrency testing, symbolic execution, and formal verification basics. These techniques enable unbreakable tools, unbreakable loaders, unbreakable runtimes, and "never guess again" confidence.

## Property-Based Testing

### Core Concept

- **Properties**: Invariants that should always hold
- **Generated Tests**: Automatically generate test cases
- **Random Input**: Test with random, diverse inputs
- **Shrinking**: Find minimal failing case

### vs Example-Based Testing

- **Example-Based**: Specific test cases
- **Property-Based**: General properties
- **Coverage**: Property-based covers more cases
- **Edge Cases**: Finds unexpected edge cases

### QuickCheck (Haskell)

- **Original**: First property-based testing framework
- **Generators**: Generate random inputs
- **Properties**: Define properties to test
- **Shrinking**: Minimize failing cases

### Hypothesis (Python)

- **Popular**: Python property-based testing
- **Strategies**: Generate complex data
- **Stateful Testing**: Test stateful systems
- **Integration**: Works with pytest

### JSVerify (JavaScript)

- **JavaScript**: Property-based testing for JS
- **Generators**: Generate JavaScript values
- **Properties**: Test properties
- **Shrinking**: Find minimal failures

### Writing Properties

```python
from hypothesis import given, strategies as st

@given(st.lists(st.integers()))
def test_reverse_twice(xs):
    assert xs == list(reversed(list(reversed(xs))))
```

### Common Properties

- **Idempotence**: f(f(x)) == f(x)
- **Commutativity**: f(x, y) == f(y, x)
- **Associativity**: f(f(x, y), z) == f(x, f(y, z))
- **Identity**: f(x, identity) == x
- **Inverse**: f(f_inverse(x)) == x

### Generators

- **Primitive**: Integers, strings, booleans
- **Composite**: Lists, dicts, tuples
- **Custom**: Domain-specific generators
- **Filtered**: Filter generated values

### Shrinking

- **Purpose**: Find minimal failing case
- **Strategy**: Simplify failing input
- **Automatic**: Framework handles shrinking
- **Useful**: Debugging easier

## Invariant Testing

### What are Invariants

- **Invariants**: Conditions that always hold
- **Preconditions**: Conditions before operation
- **Postconditions**: Conditions after operation
- **Class Invariants**: Conditions on object state

### Design by Contract

- **Contracts**: Specify pre/postconditions
- **Runtime Checking**: Check contracts at runtime
- **Documentation**: Contracts document behavior
- **Verification**: Verify contracts hold

### Implementation

```python
def requires(condition):
    if not condition:
        raise ValueError("Precondition violated")

def ensures(condition):
    if not condition:
        raise AssertionError("Postcondition violated")

def divide(a, b):
    requires(b != 0)
    result = a / b
    ensures(result * b == a)
    return result
```

### Class Invariants

```python
class Counter:
    def __init__(self):
        self.count = 0
        self._check_invariant()

    def increment(self):
        self.count += 1
        self._check_invariant()

    def _check_invariant(self):
        assert self.count >= 0, "Count must be non-negative"
```

### Loop Invariants

- **Initialization**: True before loop
- **Maintenance**: True after each iteration
- **Termination**: Implies postcondition
- **Proof**: Used to prove correctness

## Metamorphic Testing

### Concept

- **Metamorphic Relations**: Relations between inputs and outputs
- **Follow-up Tests**: Test related inputs
- **No Oracle**: Don't need expected output
- **Oracle Problem**: Solves test oracle problem

### Example

```python
# Metamorphic relation: sort(sort(x)) == sort(x)
def test_sort_idempotent(xs):
    assert sorted(sorted(xs)) == sorted(xs)

# Metamorphic relation: reverse(reverse(x)) == x
def test_reverse_idempotent(xs):
    assert list(reversed(list(reversed(xs)))) == xs
```

### Use Cases

- **Scientific Computing**: No known correct answer
- **Machine Learning**: Hard to verify output
- **Optimization**: Check improvement
- **Simulation**: Check consistency

### Metamorphic Relations

- **Idempotence**: f(f(x)) == f(x)
- **Symmetry**: f(x, y) related to f(y, x)
- **Identity**: f(identity) related to identity
- **Commutativity**: f(x, y) related to f(y, x)

## Concurrency Testing

### Challenges

- **Non-determinism**: Different executions produce different results
- **Race Conditions**: Timing-dependent bugs
- **Deadlocks**: Circular waiting
- **Livelocks**: Busy waiting

### Testing Strategies

- **Stress Testing**: Run many concurrent operations
- **Random Delays**: Inject random delays
- **Thread Sanitizer**: Detect data races
- **Model Checking**: Explore all interleavings

### Thread Sanitizer (TSan)

- **Data Race Detection**: Detect data races at runtime
- **Instrumentation**: Instruments code at compile time
- **False Positives**: Some false positives possible
- **Performance**: Significant slowdown

### Lockdep

- **Deadlock Detection**: Detect potential deadlocks
- **Lock Order**: Enforce consistent lock ordering
- **Runtime Checking**: Check at runtime
- **Linux**: Available on Linux

### JPF (Java Pathfinder)

- **Model Checker**: Explore all possible executions
- **State Space**: Enumerate all states
- **Bug Finding**: Find concurrency bugs
- **Java**: For Java programs

### CHESS

- **Systematic Testing**: Systematically explore interleavings
- **Deterministic**: Makes non-deterministic bugs reproducible
- **Windows**: Available on Windows
- **.NET**: For .NET programs

## Symbolic Execution

### Concept

- **Symbolic Values**: Use symbolic variables instead of concrete
- **Path Exploration**: Explore all possible paths
- **Constraint Solving**: Use SMT solvers
- **Bug Finding**: Find bugs on all paths

### How It Works

1. **Symbolic Execution**: Execute with symbolic values
2. **Path Constraints**: Collect constraints on each path
3. **SMT Solver**: Solve constraints
4. **Bug Detection**: Check for bugs on satisfiable paths

### Tools

- **KLEE**: Symbolic execution for LLVM
- **Angr**: Binary analysis framework
- **CBMC**: Bounded model checking for C/C++
- **SymPy**: Symbolic mathematics (not symbolic execution)

### Limitations

- **Path Explosion**: Too many paths to explore
- **Complex Constraints**: Hard constraints for solvers
- **External Functions**: Hard to model
- **Performance**: Can be slow

### Use Cases

- **Security**: Find security vulnerabilities
- **Verification**: Verify correctness
- **Testing**: Generate test cases
- **Analysis**: Understand code behavior

## Formal Verification

### Concept

- **Mathematical Proof**: Prove correctness mathematically
- **Specifications**: Formal specifications
- **Proofs**: Machine-checked proofs
- **High Assurance**: Highest level of assurance

### Levels

- **Level 1**: Testing
- **Level 2**: Code Review
- **Level 3**: Static Analysis
- **Level 4**: Formal Verification

### Techniques

- **Model Checking**: Exhaustive state exploration
- **Theorem Proving**: Mathematical proofs
- **Type Systems**: Prove properties via types
- **Abstract Interpretation**: Prove properties via abstraction

### Tools

- **Coq**: Interactive theorem prover
- **Isabelle**: Interactive theorem prover
- **TLA+:** Specification and verification
- **SPIN**: Model checker

### seL4 Example

- **Formally Verified**: Microkernel verified in Isabelle/HOL
- **High Assurance**: Mathematically proven correct
- **Performance**: Good performance despite verification
- **Security**: Strong security guarantees

### Verification Levels

- **Code Level**: Verify code implementation
- **Specification Level**: Verify specification
- **Architecture Level**: Verify architecture
- **System Level**: Verify entire system

## Fuzzing

### Concept

- **Random Input**: Generate random inputs
- **Crash Detection**: Detect crashes
- **Coverage**: Maximize code coverage
- **Bug Finding**: Find bugs efficiently

### Fuzzing Strategies

- **Random**: Pure random input
- **Mutation**: Mutate existing inputs
- **Grammar-Aware**: Use input grammar
- **Coverage-Guided**: Guide by coverage

### Tools

- **AFL**: American Fuzzy Lop
- **LibFuzzer**: LLVM-based fuzzer
- **Honggfuzz**: Security-oriented fuzzer
- **Jazz**: Java fuzzer

### Coverage-Guided Fuzzing

- **Coverage Feedback**: Use coverage to guide fuzzing
- **Interesting Inputs**: Keep interesting inputs
- **Mutation**: Mutate interesting inputs
- **Efficiency**: More efficient than random

### Harness Design

- **Deterministic**: Make harness deterministic
- **Fast**: Make harness fast
- **Minimal**: Minimize dependencies
- **Focus**: Focus on target code

## Integration with Development

### Test-Driven Development

- **Write Tests First**: Write tests before code
- **Property-Based**: Use property-based tests
- **Refactoring**: Refactor with confidence
- **Documentation**: Tests as documentation

### Continuous Integration

- **Automated Tests**: Run tests automatically
- **Multiple Techniques**: Use multiple testing techniques
- **Fast Feedback**: Get fast feedback
- **Coverage Tracking**: Track coverage

### Code Review

- **Test Coverage**: Review test coverage
- **Property Tests**: Review property tests
- **Invariant Tests**: Review invariant tests
- **Verification**: Review verification proofs

## Best Practices

### Combine Techniques

- **Multiple Approaches**: Use multiple testing techniques
- **Complementary**: Techniques complement each other
- **Defense in Depth**: Multiple layers of testing
- **Coverage**: Maximize coverage

### Start Simple

- **Unit Tests**: Start with unit tests
- **Property Tests**: Add property tests
- **Invariant Tests**: Add invariant tests
- **Formal Verification**: Add formal verification for critical code

### Focus on Critical Code

- **High Value**: Focus on high-value code
- **Security**: Focus on security-critical code
- **Correctness**: Focus on correctness-critical code
- **Performance**: Focus on performance-critical code

### Iterate

- **Incremental**: Add tests incrementally
- **Improve**: Improve tests over time
- **Learn**: Learn from failures
- **Adapt**: Adapt to changing requirements
