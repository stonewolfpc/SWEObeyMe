# Refactoring & Code Quality Patterns

## Overview

This document covers Martin Fowler's refactoring catalog, code smells, anti-patterns, SOLID principles, and testability patterns. These concepts enable MasterControl to become a real code reviewer, not just a syntax checker.

## Code Smells

### Definition

Code smells are surface indicators that usually correspond to deeper problems in the system. They're not bugs or errors, but rather indicators that the code could be improved.

### Common Code Smells

#### Duplicated Code

- **Symptom**: Same code appears in multiple places
- **Problem**: Maintenance burden, inconsistency risk
- **Solution**: Extract Method, Extract Class, Template Method

#### Long Method

- **Symptom**: Methods that are too long (50+ lines)
- **Problem**: Hard to understand, test, and reuse
- **Solution**: Extract Method, Replace Temp with Query, Introduce Parameter Object

#### Large Class

- **Symptom**: Class with too many responsibilities
- **Problem**: Violates Single Responsibility, hard to maintain
- **Solution**: Extract Class, Extract Subclass

#### Long Parameter List

- **Symptom**: Methods with many parameters (4+)
- **Problem**: Hard to understand, hard to change
- **Solution**: Introduce Parameter Object, Preserve Whole Object

#### Divergent Change

- **Symptom**: One class changes for different reasons
- **Problem**: Violates Single Responsibility
- **Solution**: Extract Class based on change reasons

#### Shotgun Surgery

- **Symptom**: One change requires modifying many classes
- **Problem**: High coupling, scattered responsibilities
- **Solution**: Move Method, Move Field, Inline Class

#### Feature Envy

- **Symptom**: Method uses more data from another class than its own
- **Problem**: Wrong responsibility placement
- **Solution**: Move Method

#### Data Clumps

- **Symptom**: Group of data items that appear together
- **Problem**: Should be an object
- **Solution**: Introduce Parameter Object, Extract Class

#### Primitive Obsession

- **Symptom**: Use of primitives instead of small objects
- **Problem**: Missed behavior, type safety
- **Solution**: Replace Data Value with Object, Introduce Parameter Object

#### Switch Statements

- **Symptom**: Complex switch statements
- **Problem**: Hard to extend, violates Open/Closed
- **Solution**: Replace Type Code with Subclasses, State/Strategy Pattern

#### Lazy Class

- **Symptom**: Classes that do too little
- **Problem**: Unnecessary complexity
- **Solution**: Collapse Hierarchy, Inline Class

#### Speculative Generality

- **Symptom**: Abstractness not needed
- **Problem**: Unnecessary complexity
- **Solution**: Collapse Hierarchy, Inline Class

#### Message Chains

- **Symptom**: Long chains of method calls
- **Problem**: Tight coupling
- **Solution**: Hide Delegate, Introduce Foreign Method

#### Middle Man

- **Symptom**: Class that only delegates to another
- **Problem**: Unnecessary indirection
- **Solution**: Remove Middle Man, Inline Method

#### Inappropriate Intimacy

- **Symptom**: Classes too familiar with each other's internals
- **Problem**: High coupling
- **Solution**: Move Method, Move Field, Hide Delegate

#### Alternative Classes with Different Interfaces

- **Symptom**: Classes doing similar things with different interfaces
- **Problem**: Confusion, hard to use
- **Solution**: Rename Method, Move Method, Extract Superclass

#### Incomplete Library Class

- **Symptom**: Library class doesn't do what you need
- **Problem**: Workarounds everywhere
- **Solution**: Introduce Foreign Method, Introduce Local Extension

#### Data Class

- **Symptom**: Class with only fields and getters/setters
- **Problem**: No behavior, anemic domain model
- **Solution**: Move Method, Encapsulate Field

#### Refused Bequest

- **Symptom**: Subclass rejects superclass methods
- **Problem**: Violates Liskov Substitution
- **Solution**: Push Down Method, Replace Inheritance with Delegation

#### Comments

- **Symptom**: Comments explaining complex code
- **Problem**: Code should be self-documenting
- **Solution**: Extract Method, Rename Method, Introduce Assertion

## Anti-Patterns

### Definition

Anti-patterns are common responses to a problem that proves to be ineffective or counterproductive.

### Common Anti-Patterns

#### God Object

- **Description**: Object that knows too much or does too much
- **Problem**: Violates SRP, hard to maintain, test, and reuse
- **Solution**: Break into smaller, focused objects

#### Golden Hammer

- **Description**: Assuming a familiar solution applies everywhere
- **Problem**: Wrong tool for the job
- **Solution**: Evaluate alternatives, choose appropriate solution

#### Boat Anchor

- **Description**: Useless part of system kept for historical reasons
- **Problem**: Dead code, maintenance burden
- **Solution**: Remove dead code

#### Dead Code

- **Description**: Code that's never executed
- **Problem**: Maintenance burden, confusion
- **Solution**: Remove unused code

#### Lava Flow

- **Description**: Dead code buried in comments or #ifdefs
- **Problem**: Confusion, maintenance burden
- **Solution**: Remove or properly document

#### Spaghetti Code

- **Description**: Tangled, unstructured code
- **Problem**: Hard to understand, maintain, test
- **Solution**: Refactor to structured code

#### Ravioli Code

- **Description**: Too many small, disconnected objects
- **Problem**: Over-abstraction, hard to follow flow
- **Solution**: Consolidate related objects

#### Magic Numbers

- **Description**: Hardcoded numeric literals
- **Problem**: No meaning, hard to change
- **Solution**: Use named constants

#### Magic Strings

- **Description**: Hardcoded string literals
- **Problem**: No meaning, hard to change, typo-prone
- **Solution**: Use named constants or enums

#### Copy-Paste Programming

- **Description**: Copying code instead of abstracting
- **Problem**: Duplicated code, maintenance burden
- **Solution**: Extract common code to methods/classes

#### Hard Coding

- **Description**: Hardcoded configuration values
- **Problem**: Inflexible, hard to change
- **Solution**: Use configuration files

#### Reinventing the Wheel

- **Description**: Implementing existing solutions
- **Problem**: Waste of time, potential bugs
- **Solution**: Use existing libraries

#### Premature Optimization

- **Description**: Optimizing before measuring
- **Problem**: Unnecessary complexity, wasted time
- **Solution**: Profile first, optimize bottlenecks

#### Premature Generalization

- **Description**: Abstracting before understanding
- **Problem**: Unnecessary complexity
- **Solution**: YAGNI (You Aren't Gonna Need It)

#### Cargo Cult Programming

- **Description**: Using code without understanding
- **Problem**: Inappropriate solutions
- **Solution**: Understand before using

#### Shotgun Surgery

- **Description**: One change requires many files
- **Problem**: High coupling
- **Solution**: Consolidate related code

#### Blob

- **Description**: Large, monolithic class
- **Problem**: Violates SRP, hard to maintain
- **Solution**: Break into smaller classes

#### Swiss Army Knife

- **Description**: Class that does too many things
- **Problem**: Violates SRP, confusing
- **Solution**: Split into focused classes

## SOLID Principles

### Single Responsibility Principle (SRP)

- **Definition**: A class should have one reason to change
- **Benefits**: Easier to understand, test, maintain
- **Example**: Separate logging from business logic
- **Violation**: God Object, Large Class

### Open/Closed Principle (OCP)

- **Definition**: Open for extension, closed for modification
- **Benefits**: Extensible without breaking existing code
- **Example**: Strategy Pattern, Template Method
- **Violation**: Switch Statements, Hard-coded types

### Liskov Substitution Principle (LSP)

- **Definition**: Subtypes must be substitutable for base types
- **Benefits**: Polymorphism works correctly
- **Example**: Square should not inherit from Rectangle
- **Violation**: Refused Bequest, subclass changing behavior

### Interface Segregation Principle (ISP)

- **Definition**: Clients shouldn't depend on interfaces they don't use
- **Benefits**: Smaller, focused interfaces
- **Example**: Separate Reader and Writer interfaces
- **Violation**: Fat interfaces

### Dependency Inversion Principle (DIP)

- **Definition**: Depend on abstractions, not concretions
- **Benefits**: Loose coupling, testability
- **Example**: Dependency Injection
- **Violation**: Direct dependencies on concrete classes

## Refactoring Catalog

### Composing Methods

#### Extract Method

- **When**: Method is too long or does too much
- **How**: Create new method with extracted code
- **Benefit**: Improved readability, reuse

#### Inline Method

- **When**: Method body is as clear as name
- **How**: Replace method calls with body
- **Benefit**: Reduced indirection

#### Extract Variable

- **When**: Expression is complex or repeated
- **How**: Assign to named variable
- **Benefit**: Improved readability

#### Inline Temp

- **When**: Temp used only once, expression simple
- **How**: Replace temp with expression
- **Benefit**: Reduced variables

#### Replace Temp with Query

- **When**: Temp assigned result of expression
- **How**: Replace with method
- **Benefit**: Eliminates duplicate code

#### Replace Parameter with Explicit Methods

- **When**: Parameter controls method behavior
- **How**: Create separate methods
- **Benefit**: Clearer intent

#### Preserve Whole Object

- **When**: Getting values from object to pass
- **How**: Pass whole object
- **Benefit**: Fewer parameters

#### Replace Parameter with Method Call

- **When**: Parameter can be derived from object
- **How**: Remove parameter, call method
- **Benefit**: Simpler interface

#### Introduce Parameter Object

- **When**: Parameter list too long
- **How**: Group parameters into object
- **Benefit**: Fewer parameters, clearer

### Moving Features Between Objects

#### Move Method

- **When**: Method uses more data from another class
- **How**: Move method to class it uses most
- **Benefit**: Better cohesion

#### Move Field

- **When**: Field used more by another class
- **How**: Move field to class that uses it
- **Benefit**: Better cohesion

#### Extract Class

- **When**: Class does too much
- **How**: Create new class with extracted responsibility
- **Benefit**: Better separation of concerns

#### Inline Class

- **When**: Class does little
- **How**: Move features to using class
- **Benefit**: Simpler structure

#### Hide Delegate

- **When**: Client calls delegate's delegate
- **How**: Create method in delegating class
- **Benefit**: Reduced coupling

#### Remove Middle Man

- **When**: Class only delegates
- **How**: Have client call delegate directly
- **Benefit**: Reduced indirection

#### Introduce Foreign Method

- **When**: Need method in class you can't modify
- **How**: Add method as extension
- **Benefit**: Better encapsulation

#### Introduce Local Extension

- **When**: Need multiple foreign methods
- **How**: Create local extension class
- **Benefit**: Better organization

### Organizing Data

#### Self Encapsulate Field

- **When**: Direct field access
- **How**: Access through getters/setters
- **Benefit**: Better encapsulation

#### Replace Data Value with Object

- **When**: Data item has behavior
- **How**: Create class for data
- **Benefit**: Better encapsulation

#### Change Value to Reference

- **When**: Many instances with same value
- **How**: Replace with reference object
- **Benefit**: Reduced memory, consistency

#### Change Reference to Value

- **When**: Reference object acts like value
- **How**: Make immutable value object
- **Benefit**: Simpler, no identity issues

#### Replace Array with Object

- **When**: Array used as record
- **How**: Replace with object with named fields
- **Benefit**: Clearer intent

#### Duplicate Observed Data

- **When**: Domain data duplicated in GUI
- **How**: Synchronize changes
- **Benefit**: Consistency

#### Change Unidirectional Association to Bidirectional

- **When**: Need navigation both ways
- **How**: Add back reference
- **Benefit**: Easier navigation

#### Change Bidirectional Association to Unidirectional

- **When**: Navigation only needed one way
- **How**: Remove back reference
- **Benefit**: Simpler

#### Replace Magic Number with Symbolic Constant

- **When**: Magic number in code
- **How**: Use named constant
- **Benefit**: Clearer meaning

#### Encapsulate Collection

- **When**: Collection directly exposed
- **How**: Provide methods to modify
- **Benefit**: Better encapsulation

#### Replace Type Code with Class

- **When**: Type code used
- **How**: Replace with class
- **Benefit**: Type safety, behavior

#### Replace Type Code with Subclasses

- **When**: Type code affects behavior
- **How**: Create subclasses
- **Benefit**: Polymorphism

#### Replace Type Code with State/Strategy

- **When**: Type code changes at runtime
- **How**: Use State or Strategy pattern
- **Benefit**: Runtime flexibility

#### Replace Subclass with Fields

- **When**: Subclasses differ only by data
- **How**: Use fields instead
- **Benefit**: Simpler

## Testability Patterns

### Dependency Injection

- **Pattern**: Inject dependencies instead of creating them
- **Benefit**: Easy to mock for testing
- **Example**: Constructor injection, setter injection

### Interface Segregation

- **Pattern**: Small, focused interfaces
- **Benefit**: Easier to mock
- **Example**: Separate Reader and Writer interfaces

### Factory Pattern

- **Pattern**: Create objects through factory
- **Benefit**: Easy to create test doubles
- **Example**: Factory for database connections

### Strategy Pattern

- **Pattern**: Encapsulate algorithms
- **Benefit**: Easy to test each algorithm
- **Example**: Different sorting strategies

### Template Method Pattern

- **Pattern**: Define skeleton, override steps
- **Benefit**: Test skeleton once, override for tests
- **Example**: Base class with testable hooks

### Observer Pattern

- **Pattern**: Notify listeners of changes
- **Benefit**: Test by observing events
- **Example**: Event-driven architecture

### Mock Objects

- **Pattern**: Replace real objects with test doubles
- **Benefit**: Isolate unit under test
- **Example**: Mock database, mock API

### Test Builders

- **Pattern**: Fluent API to create test objects
- **Benefit**: Readable test setup
- **Example**: Builder pattern for test data

### Object Mothers

- **Pattern**: Factory methods for test objects
- **Benefit**: Consistent test data
- **Example**: Create valid test objects easily

### Test Spies

- **Pattern**: Record method calls
- **Benefit**: Verify interactions
- **Example**: Spy on service calls

### Test Stubs

- **Pattern**: Provide canned responses
- **Benefit**: Control dependencies
- **Example**: Stub API responses

## Refactoring Workflow

### When to Refactor

- **Rule of Three**: Do it three times, then refactor
- **Code Review**: Refactor during review
- **Bug Fix**: Refactor while fixing
- **Feature Addition**: Refactor before adding

### Refactoring Steps

1. **Identify Smell**: Find code smell or anti-pattern
2. **Understand**: Understand what code does
3. **Write Tests**: Ensure tests pass
4. **Apply Refactoring**: Make small, safe changes
5. **Run Tests**: Ensure still pass
6. **Commit**: Commit refactoring separately

### Safe Refactoring

- **Small Steps**: Make small changes
- **Test Coverage**: Ensure good test coverage
- **Version Control**: Commit frequently
- **Code Review**: Get review for complex refactorings
- **Rollback Ready**: Be ready to rollback

### Refactoring Tools

- **IDE Refactoring**: Use IDE refactoring features
- **Automated Tools**: Use automated refactoring tools
- **Linters**: Use linters to identify smells
- **Static Analysis**: Use static analysis tools
- **Code Metrics**: Use code metrics to identify issues

## Best Practices

### Start Small

- **YAGNI**: You Aren't Gonna Need It
- **KISS**: Keep It Simple, Stupid
- **Don't Over-Engineer**: Simple solutions first

### Refactor Continuously

- **Boy Scout Rule**: Leave code cleaner than you found it
- **Technical Debt**: Pay debt continuously
- **Code Review**: Refactor during review

### Measure Impact

- **Code Coverage**: Maintain coverage
- **Performance**: Profile before and after
- **Complexity**: Measure cyclomatic complexity
- **Maintainability**: Use maintainability index

### Communicate

- **Code Review**: Get review for changes
- **Documentation**: Document why
- **Comments**: Explain complex refactorings
- **Commit Messages**: Clear commit messages
