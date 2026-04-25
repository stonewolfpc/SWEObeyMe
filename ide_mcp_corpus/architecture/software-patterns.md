# Software Architecture Patterns

## Overview

This document covers hexagonal architecture, event-driven systems, domain-driven design, state machine patterns, plugin architectures, and dependency inversion. These patterns provide clean separation of concerns, stable APIs, predictable behavior, and long-term maintainability.

## Hexagonal Architecture

### Core Concept

- **Ports**: Interfaces for external interactions
- **Adapters**: Implementations of ports
- **Domain**: Core business logic
- **Independence**: Domain independent of external concerns

### Architecture Layers

- **Domain**: Core business logic
- **Application**: Application services
- **Ports**: Interfaces (input/output)
- **Adapters**: Implementations (database, UI, API)

### Benefits

- **Testability**: Easy to test domain logic
- **Flexibility**: Easy to swap implementations
- **Maintainability**: Clear separation of concerns
- **Independence**: Domain independent of frameworks

### Example

```python
# Port (Interface)
class UserRepository(ABC):
    @abstractmethod
    def save(self, user: User) -> None:
        pass

# Adapter (Implementation)
class SQLUserRepository(UserRepository):
    def save(self, user: User) -> None:
        # SQL implementation
        pass

# Domain
class UserService:
    def __init__(self, repo: UserRepository):
        self.repo = repo
```

### Use Cases

- **DDD**: Domain-driven design
- **Microservices**: Microservice boundaries
- **Testing**: Testable architecture
- **Legacy**: Legacy system migration

## Event-Driven Systems

### Core Concept

- **Events**: Significant state changes
- **Producers**: Components that produce events
- **Consumers**: Components that consume events
- **Event Bus**: Middleware for event distribution

### Event Types

- **Domain Events**: Domain-specific events
- **Integration Events**: Cross-system events
- **System Events**: System-level events
- **Command Events**: Command events (CQRS)

### Event Patterns

- **Publish-Subscribe**: Many-to-many communication
- **Event Sourcing**: Store events as state
- **CQRS**: Separate read and write models
- **Saga**: Distributed transaction pattern

### Benefits

- **Loose Coupling**: Components loosely coupled
- **Scalability**: Easy to scale consumers
- **Flexibility**: Easy to add new consumers
- **Resilience**: Event replay for recovery

### Challenges

- **Complexity**: Increased complexity
- **Debugging**: Harder to debug
- **Consistency**: Eventual consistency
- **Ordering**: Event ordering issues

### Implementation

```python
# Event
class UserCreated:
    def __init__(self, user_id: str, name: str):
        self.user_id = user_id
        self.name = name

# Producer
class UserService:
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
    
    def create_user(self, name: str):
        user_id = generate_id()
        self.event_bus.publish(UserCreated(user_id, name))

# Consumer
class EmailService:
    @subscribe(UserCreated)
    def handle(self, event: UserCreated):
        send_welcome_email(event.name)
```

## Domain-Driven Design

### Core Concepts

- **Domain**: Problem space
- **Ubiquitous Language**: Shared language
- **Bounded Context**: Context boundaries
- **Domain Model**: Model of domain

### Strategic Patterns

- **Bounded Context**: Explicit boundaries
- **Context Mapping**: Relationships between contexts
- **Anti-Corruption Layer**: Protect domain
- **Shared Kernel**: Shared concepts

### Tactical Patterns

- **Entity**: Objects with identity
- **Value Object**: Objects without identity
- **Aggregate**: Consistency boundary
- **Repository**: Collection-like interface
- **Domain Service**: Domain logic in service
- **Domain Event**: Domain event

### Benefits

- **Alignment**: Aligns with business
- **Communication**: Shared language
- **Modularity**: Clear boundaries
- **Evolution**: Evolves with business

### Example

```python
# Value Object
class Money:
    def __init__(self, amount: Decimal, currency: str):
        self.amount = amount
        self.currency = currency

# Entity
class Order:
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.items = []
        self.status = "pending"

# Aggregate Root
class Order:
    def add_item(self, item: OrderItem):
        self.items.append(item)

# Repository
class OrderRepository(ABC):
    @abstractmethod
    def save(self, order: Order) -> None:
        pass
```

## State Machine Patterns

### Core Concept

- **States**: Distinct system states
- **Transitions**: Valid state transitions
- **Events**: Events that trigger transitions
- **Actions**: Actions on transitions

### State Machine Types

- **Finite State Machine**: Finite number of states
- **Hierarchical**: Nested states
- **Concurrent**: Parallel states
- **Pushdown**: Stack-based states

### Benefits

- **Clarity**: Clear state representation
- **Correctness**: Prevents invalid states
- **Maintainability**: Easy to understand
- **Testability**: Easy to test

### Implementation Patterns

- **State Pattern**: GoF State pattern
- **State Machine Library**: Use state machine library
- **Enum with Methods**: Simple state machine
- **Table-Driven**: Table-driven state machine

### Example

```python
from enum import Enum

class OrderState(Enum):
    PENDING = "pending"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order:
    def __init__(self):
        self.state = OrderState.PENDING
    
    def pay(self):
        if self.state == OrderState.PENDING:
            self.state = OrderState.PAID
        else:
            raise InvalidTransition()
    
    def ship(self):
        if self.state == OrderState.PAID:
            self.state = OrderState.SHIPPED
        else:
            raise InvalidTransition()
```

## Plugin Architectures

### Core Concept

- **Core**: Core application
- **Plugins**: Extensible components
- **Plugin API**: Interface for plugins
- **Discovery**: Plugin discovery mechanism

### Plugin Types

- **Load-Time**: Load plugins at startup
- **Runtime**: Load plugins at runtime
- **Hot Reload**: Reload plugins without restart
- **Sandboxed**: Sandboxed plugins

### Discovery Mechanisms

- **Directory Scan**: Scan plugin directory
- **Configuration**: Configure plugins
- **Service Discovery**: Service discovery
- **Manifest**: Plugin manifest

### Benefits

- **Extensibility**: Easy to extend
- **Modularity**: Modular architecture
- **Customization**: User customization
- **Third-Party**: Third-party extensions

### Challenges

- **Stability**: Plugin API stability
- **Security**: Plugin security
- **Compatibility**: Plugin compatibility
- **Debugging**: Plugin debugging

### Example

```python
# Plugin Interface
class Plugin(ABC):
    @abstractmethod
    def initialize(self, context: PluginContext):
        pass
    
    @abstractmethod
    def execute(self, request: Request) -> Response:
        pass

# Plugin Manager
class PluginManager:
    def __init__(self):
        self.plugins = []
    
    def load_plugins(self, directory: str):
        for file in os.listdir(directory):
            plugin = load_plugin(file)
            self.plugins.append(plugin)
    
    def execute(self, request: Request):
        for plugin in self.plugins:
            response = plugin.execute(request)
            if response:
                return response
```

## Dependency Inversion

### Core Principle

- **High-Level Modules**: Should not depend on low-level modules
- **Abstractions**: Both should depend on abstractions
- **Inversion**: Invert dependency direction

### SOLID - D in SOLID

- **Dependency Inversion Principle**: D in SOLID
- **Abstractions**: Depend on abstractions
- **Inversion**: Invert dependencies
- **Decoupling**: Decouple components

### Benefits

- **Flexibility**: Easy to swap implementations
- **Testability**: Easy to test with mocks
- **Maintainability**: Clear dependencies
- **Evolution**: Easy to evolve

### Implementation

```python
# Bad: Depends on concrete implementation
class UserService:
    def __init__(self):
        self.repo = SQLUserRepository()  # Concrete dependency

# Good: Depends on abstraction
class UserService:
    def __init__(self, repo: UserRepository):  # Abstract dependency
        self.repo = repo
```

### Dependency Injection

- **Constructor Injection**: Inject via constructor
- **Setter Injection**: Inject via setter
- **Interface Injection**: Inject via interface
- **Service Locator**: Service locator pattern

### Inversion of Control

- **IoC Container**: Manage dependencies
- **Framework**: Framework manages lifecycle
- **Configuration**: Configure dependencies
- **Auto-Wiring**: Automatic dependency resolution

## Architectural Patterns Summary

### When to Use Each Pattern

- **Hexagonal**: When you need testability and flexibility
- **Event-Driven**: When you need loose coupling and scalability
- **DDD**: When domain complexity is high
- **State Machines**: When state management is complex
- **Plugins**: When you need extensibility
- **Dependency Inversion**: Always use for decoupling

### Combining Patterns

- **DDD + Hexagonal**: DDD with hexagonal architecture
- **Event-Driven + DDD**: Event-driven DDD
- **State Machines + DDD**: State machines in domain
- **Plugins + Hexagonal**: Plugins as adapters

### Anti-Patterns

- **Golden Hammer**: Use same pattern everywhere
- **Over-Engineering**: Over-engineer simple problems
- **Premature Abstraction**: Abstract too early
- **Pattern Soup**: Too many patterns

## Best Practices

### Start Simple

- **YAGNI**: You Aren't Gonna Need It
- **KISS**: Keep It Simple, Stupid
- **Evolve**: Let architecture evolve
- **Refactor**: Refactor when needed

### Measure Impact

- **Metrics**: Measure architecture metrics
- **Coupling**: Measure coupling
- **Cohesion**: Measure cohesion
- **Complexity**: Measure complexity

### Document Architecture

- **C4 Model**: C4 model for documentation
- **ADR**: Architecture Decision Records
- **Diagrams**: Architecture diagrams
- **Code Comments**: Code as documentation

### Review and Iterate

- **Reviews**: Regular architecture reviews
- **Retrospectives**: Learn from experience
- **Refactor**: Refactor architecture
- **Evolve**: Evolve architecture
