# API & Protocol Design

## Overview

This document covers REST best practices, GraphQL patterns, gRPC, WebSocket design, versioning strategies, and API error taxonomy. These concepts enable MasterControl to help people design stable, future-proof APIs.

## REST Best Practices

### Resource Naming

- **Nouns, Not Verbs**: Use nouns for resources
- **Plural**: Use plural for collections
- **Hierarchical**: Use hierarchy for relationships
- **Lowercase**: Use lowercase with hyphens

```
GET /users          # List users
GET /users/123      # Get specific user
GET /users/123/posts # Get user's posts
```

### HTTP Methods

- **GET**: Retrieve resource (safe, idempotent)
- **POST**: Create resource (not idempotent)
- **PUT**: Replace resource (idempotent)
- **PATCH**: Partial update (not necessarily idempotent)
- **DELETE**: Remove resource (idempotent)

### Status Codes

#### Success Codes

- **200 OK**: Request succeeded
- **201 Created**: Resource created
- **204 No Content**: Success, no content returned

#### Client Error Codes

- **400 Bad Request**: Invalid request
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization failed
- **404 Not Found**: Resource not found
- **409 Conflict**: Conflict with current state
- **422 Unprocessable Entity**: Semantic errors
- **429 Too Many Requests**: Rate limited

#### Server Error Codes

- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: Upstream error
- **503 Service Unavailable**: Service unavailable
- **504 Gateway Timeout**: Upstream timeout

### Versioning Strategies

#### URL Versioning

```
GET /v1/users
GET /v2/users
```

#### Header Versioning

```
GET /users
Accept: application/vnd.api+json; version=1
```

#### Query Parameter Versioning

```
GET /users?version=1
```

### Pagination

#### Offset-Based

```
GET /users?offset=0&limit=10
```

#### Cursor-Based

```
GET /users?cursor=abc123&limit=10
```

### Filtering and Sorting

```
GET /users?status=active&sort=name:asc
```

### HATEOAS

- **Hypermedia**: Include links in responses
- **Self-Descriptive**: API describes itself
- **Discoverable**: Clients discover resources

```json
{
  "id": 123,
  "name": "John",
  "_links": {
    "self": "/users/123",
    "posts": "/users/123/posts"
  }
}
```

## GraphQL

### Advantages

- **Flexible**: Clients request exactly what they need
- **Single Endpoint**: One endpoint for all queries
- **Strong Typing**: Type-safe schema
- **Introspection**: Self-documenting

### Schema Design

```graphql
type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}

type Query {
  user(id: ID!): User
  users: [User!]!
}

type Mutation {
  createUser(name: String!, email: String!): User!
}
```

### Query Patterns

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    posts {
      id
      title
    }
  }
}
```

### Mutation Patterns

```graphql
mutation CreateUser($name: String!, $email: String!) {
  createUser(name: $name, email: $email) {
    id
    name
    email
  }
}
```

### Pagination

#### Cursor-Based Pagination

```graphql
type Query {
  users(first: Int, after: String): UserConnection!
}

type UserConnection {
  edges: [UserEdge!]!
  pageInfo: PageInfo!
}

type UserEdge {
  node: User!
  cursor: String!
}

type PageInfo {
  hasNextPage: Boolean!
  endCursor: String
}
```

### N+1 Problem

- **Issue**: N+1 queries from nested fields
- **Solution**: Dataloader batching
- **Example**: Batch user queries

### Best Practices

- **Depth Limiting**: Limit query depth
- **Complexity Analysis**: Analyze query complexity
- **Rate Limiting**: Rate limit expensive queries
- **Caching**: Cache query results

## gRPC

### Advantages

- **Performance**: Binary serialization (Protocol Buffers)
- **Type Safety**: Strongly typed
- **Code Generation**: Auto-generate client/server code
- **Streaming**: Bidirectional streaming

### Protocol Buffers

```protobuf
syntax = "proto3";

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc StreamUsers(Empty) returns (stream User);
}

message User {
  string id = 1;
  string name = 2;
  string email = 3;
}

message GetUserRequest {
  string id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
}

message Empty {}
```

### Unary RPC

```protobuf
rpc GetUser(GetUserRequest) returns (User);
```

### Server Streaming

```protobuf
rpc StreamUsers(Empty) returns (stream User);
```

### Client Streaming

```protobuf
rpc CreateUserBatch(stream CreateUserRequest) returns (UserList);
```

### Bidirectional Streaming

```protobuf
rpc Chat(stream Message) returns (stream Message);
```

### Error Handling

```protobuf
enum ErrorCode {
  OK = 0;
  INVALID_ARGUMENT = 3;
  NOT_FOUND = 5;
  ALREADY_EXISTS = 6;
  PERMISSION_DENIED = 7;
  UNAUTHENTICATED = 16;
}
```

### Best Practices

- **Versioning**: Use package versioning
- **Validation**: Validate inputs
- **Timeouts**: Set appropriate timeouts
- **Retry**: Implement retry logic

## WebSocket

### When to Use

- **Real-Time**: Real-time updates
- **Low Latency**: Low latency required
- **Bi-Directional**: Bi-directional communication
- **Frequent Updates**: Frequent updates

### Connection Lifecycle

```javascript
// Connect
const ws = new WebSocket('ws://example.com');

// Open
ws.onopen = () => {
  console.log('Connected');
};

// Message
ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

// Error
ws.onerror = (error) => {
  console.error('Error:', error);
};

// Close
ws.onclose = () => {
  console.log('Disconnected');
};

// Send
ws.send(JSON.stringify({ type: 'hello' }));
```

### Message Format

```json
{
  "type": "message",
  "id": "123",
  "data": {
    "content": "Hello"
  }
}
```

### Reconnection

```javascript
function connect() {
  const ws = new WebSocket('ws://example.com');

  ws.onclose = () => {
    setTimeout(connect, 1000); // Reconnect after 1 second
  };

  return ws;
}
```

### Authentication

```javascript
const ws = new WebSocket('ws://example.com?token=abc123');
```

### Best Practices

- **Heartbeat**: Send heartbeat messages
- **Reconnection**: Implement reconnection logic
- **Rate Limiting**: Rate limit messages
- **Message Validation**: Validate messages

## API Versioning

### Strategies

#### URL Versioning

```
/v1/users
/v2/users
```

#### Header Versioning

```
GET /users
Accept: application/vnd.api+json; version=1
```

#### Query Parameter Versioning

```
GET /users?version=1
```

#### Content Negotiation

```
GET /users
Accept: application/vnd.myapi.v1+json
```

### Breaking Changes

- **Remove Fields**: Removing fields
- **Change Types**: Changing field types
- **Rename Fields**: Renaming fields
- **Change Semantics**: Changing field meaning
- **Remove Endpoints**: Removing endpoints

### Non-Breaking Changes

- **Add Fields**: Adding optional fields
- **Add Endpoints**: Adding new endpoints
- **Add Query Parameters**: Adding optional parameters
- **Change Response Format**: Adding more data

### Deprecation

- **Sunset Header**: Communicate deprecation
- **Warning Header**: Warn deprecated usage
- **Documentation**: Document deprecation
- **Timeline**: Provide deprecation timeline

```
Sunset: Wed, 31 Dec 2024 23:59:59 GMT
Warning: 299 - "Deprecated API"
```

## API Error Taxonomy

### Error Categories

#### Client Errors (4xx)

- **400 Bad Request**: Invalid request
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Authorization failed
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: Method not allowed
- **409 Conflict**: Conflict with state
- **422 Unprocessable Entity**: Semantic error
- **429 Too Many Requests**: Rate limited

#### Server Errors (5xx)

- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: Upstream error
- **503 Service Unavailable**: Service unavailable
- **504 Gateway Timeout**: Upstream timeout

### Error Response Format

```json
{
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "User not found",
    "details": {
      "userId": "123"
    },
    "requestId": "abc123",
    "timestamp": "2024-04-24T20:00:00Z"
  }
}
```

### Error Codes

- **Descriptive**: Descriptive error codes
- **Hierarchical**: Hierarchical error codes
- **Documented**: Documented error codes
- **Consistent**: Consistent error codes

```
USER_NOT_FOUND
USER_INVALID_EMAIL
USER_DUPLICATE_EMAIL
POST_NOT_FOUND
POST_INVALID_TITLE
```

### Error Handling Best Practices

- **Consistent**: Consistent error format
- **Informative**: Informative error messages
- **Actionable**: Actionable error messages
- **Secure**: Don't leak sensitive info
- **Logged**: Log errors for debugging

## Security

### Authentication

- **API Keys**: Simple API keys
- **OAuth 2.0**: OAuth 2.0 flow
- **JWT**: JSON Web Tokens
- **Session Cookies**: Session-based auth

### Authorization

- **RBAC**: Role-based access control
- **ABAC**: Attribute-based access control
- **Scopes**: OAuth scopes
- **Permissions**: Fine-grained permissions

### Rate Limiting

- **Token Bucket**: Token bucket algorithm
- **Sliding Window**: Sliding window
- **Fixed Window**: Fixed window
- **Per-User**: Per-user limits

### Input Validation

- **Type Validation**: Validate types
- **Range Validation**: Validate ranges
- **Format Validation**: Validate formats
- **Sanitization**: Sanitize input

### Output Encoding

- **JSON Encoding**: Proper JSON encoding
- **HTML Encoding**: HTML encoding
- **URL Encoding**: URL encoding
- **SQL Escaping**: SQL escaping

## Documentation

### OpenAPI (Swagger)

```yaml
openapi: 3.0.0
info:
  title: My API
  version: 1.0.0
paths:
  /users:
    get:
      summary: List users
      responses:
        '200':
          description: Success
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/User'
```

### GraphQL Documentation

- **Schema**: Self-documenting schema
- **Comments**: Add comments to schema
- **Examples**: Provide examples
- **Playground**: Interactive playground

### Best Practices

- **Examples**: Provide examples
- **Error Codes**: Document error codes
- **Rate Limits**: Document rate limits
- **Authentication**: Document authentication

## Best Practices

### Design Principles

- **Consistency**: Consistent naming and behavior
- **Simplicity**: Keep it simple
- **Versioning**: Plan for versioning
- **Documentation**: Document everything

### Performance

- **Caching**: Implement caching
- **Compression**: Use compression
- **Pagination**: Implement pagination
- **Batching**: Support batch operations

### Security

- **HTTPS**: Always use HTTPS
- **Authentication**: Implement authentication
- **Authorization**: Implement authorization
- **Rate Limiting**: Implement rate limiting

### Testing

- **Contract Tests**: Test API contracts
- **Integration Tests**: Test integrations
- **Load Tests**: Test under load
- **Security Tests**: Test security
