# Message Queues & Event Systems

**Source:** Backend Engineering Course (GitHub), Dev.to  
**License:** MIT

## Message Queue Patterns

Message queues enable asynchronous communication between services by decoupling message producers from consumers. This pattern is essential for building scalable and resilient systems.

### Basic Patterns

**Request-Reply Pattern**
Facilitates synchronous communication over asynchronous infrastructure. RabbitMQ implements this using temporary reply queues and correlation IDs to match requests with responses.

```javascript
// Request-Reply Implementation with RabbitMQ
class RequestReplyClient {
  constructor(connection, timeout = 5000) {
    this.connection = connection;
    this.correlationMap = new Map();
  }
  async connect() {
    this.channel = await this.connection.createChannel();
  }
  async request(exchange, routingKey, message, timeout) {
    const replyQueue = await this.channel.assertQueue('', { exclusive: true });
    const correlationId = generateUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.correlationMap.delete(correlationId);
        reject(new Error('Request timeout'));
      }, timeout);
      this.correlationMap.set(correlationId, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
      this.channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
        correlationId,
        replyTo: replyQueue.queue,
      });
    });
  }
}
```

**Fanout Pattern**
Broadcasts messages to multiple consumers. RabbitMQ's fanout exchanges enable one-to-many communication. Example: logging service broadcasting logs to multiple monitoring systems.

```javascript
// Fanout Pattern with RabbitMQ
class FanoutClient {
  constructor(connection) {
    this.connection = connection;
  }
  async connect() {
    this.channel = await this.connection.createChannel();
  }
  async publish(exchange, message) {
    await this.channel.assertExchange(exchange, 'fanout', { durable: false });
    this.channel.publish(exchange, '', Buffer.from(JSON.stringify(message)));
  }
}
```

**Tool Examples:**

- RabbitMQ: Request-reply, fanout, and pub/sub patterns
- Kafka: Pub/sub and event streaming, can emulate fanout using consumer groups
- Amazon SQS: Point-to-point messaging, integrates with SNS for pub/sub

### Advanced Patterns

**Dead Letter Queues (DLQ)**
Store messages that repeatedly fail processing, allowing developers to investigate and resolve issues later. RabbitMQ natively supports DLQs through queue policies.

```javascript
// Dead Letter Queue Configuration in RabbitMQ
const queueOptions = {
  durable: true,
  deadLetterExchange: 'dlq-exchange',
  deadLetterRoutingKey: 'dlq-routing-key',
};
await channel.assertQueue('main-queue', queueOptions);
```

**Retry Mechanisms**
Ensure transient failures don't result in lost messages. Kafka's consumer retries and RabbitMQ's TTL settings are commonly used.

```javascript
// Retry Mechanism with Kafka
class KafkaRetryConsumer {
  constructor(consumer) {
    this.consumer = consumer;
    this.retryQueue = [];
  }
  async processMessages() {
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          await this.handleMessage(message);
        } catch (error) {
          this.retryQueue.push({ topic, partition, message });
        }
      },
    });
  }
  async handleRetries() {
    while (this.retryQueue.length > 0) {
      const { topic, partition, message } = this.retryQueue.shift();
      try {
        await this.handleMessage(message);
      } catch (error) {
        this.retryQueue.push({ topic, partition, message });
      }
    }
  }
}
```

**Tool Examples:**

- Kafka: Consumer retries through offsets and partition management
- SQS: Visibility timeouts and DLQs for retries
- RabbitMQ: TTL and retry queues for failed messages

## Event-Driven Architecture

### Pub/Sub System

Publish/Subscribe pattern decouples message producers from consumers. Producers publish messages to topics without knowing which consumers will receive them. Consumers subscribe to topics of interest.

**Benefits:**

- Loose coupling between services
- Scalability through multiple consumers
- Flexibility to add/remove consumers
- Asynchronous processing

**Implementation Considerations:**

- Message ordering guarantees
- At-least-once vs at-most-once delivery
- Message schema evolution
- Consumer group management

### Event Streaming

Event streaming platforms like Kafka provide durable, scalable event logs. Events are written to topics and can be consumed by multiple consumers at different times.

**Kafka Architecture:**

- Topics: Categories for event streams
- Partitions: Parallelism and scalability
- Consumer Groups: Load balancing among consumers
- Offsets: Tracking consumer position

**Use Cases:**

- Real-time data pipelines
- Event sourcing
- Log aggregation
- Stream processing

## Implementation Strategies

### RabbitMQ Implementation

**Exchange Types:**

- Direct: Route based on routing key
- Fanout: Broadcast to all queues
- Topic: Pattern-based routing
- Headers: Route based on message headers

**Queue Features:**

- Durability: Survive broker restart
- Exclusivity: Single connection
- Auto-delete: Delete when no consumers
- TTL: Message expiration

### Kafka Implementation

**Producer Configuration:**

- Acknowledgments (acks): 0, 1, or all
- Compression: Snappy, GZIP, LZ4, Zstd
- Batching: Improve throughput
- Retries: Handle transient failures

**Consumer Configuration:**

- Consumer groups: Load balancing
- Offsets: Manual or auto-commit
- Poll interval: Balance latency and throughput
- Deserialization: Handle message formats

### Amazon SQS/SNS Implementation

**SQS (Simple Queue Service):**

- Standard queue: Best-effort ordering, at-least-once delivery
- FIFO queue: Strict ordering, exactly-once processing
- Visibility timeout: Hide message during processing
- Dead letter queues: Failed message handling

**SNS (Simple Notification Service):**

- Topics: Pub/sub messaging
- Subscriptions: SQS, HTTP, Lambda, email
- Message filtering: Subscribe to message attributes
- Fanout: One message to multiple subscribers

## Best Practices

### Message Design

- Use immutable messages
- Include message ID and timestamp
- Version message schemas
- Keep messages small
- Use appropriate serialization (JSON, Avro, Protobuf)

### Error Handling

- Implement retry with exponential backoff
- Use dead letter queues for failed messages
- Monitor queue depth and processing latency
- Alert on critical failures

### Monitoring

- Track message throughput
- Monitor consumer lag
- Measure processing time
- Alert on queue backlog

### Security

- Encrypt messages in transit and at rest
- Use authentication and authorization
- Implement access control
- Audit message access

### Performance

- Batch messages for higher throughput
- Use appropriate compression
- Tune consumer group sizes
- Monitor resource utilization
