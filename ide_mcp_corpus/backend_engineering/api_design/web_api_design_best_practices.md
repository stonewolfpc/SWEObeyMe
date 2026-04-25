# Web API Design Best Practices

**Source:** https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design  
**License:** MIT

## Introduction

This guide provides best practices for designing RESTful web APIs that ensure platform independence, loose coupling, and service evolution capabilities.

## Core Principles

### Platform Independence
- Use standard protocols (HTTP, HTTPS)
- Avoid platform-specific features
- Ensure cross-platform compatibility

### Loose Coupling
- Minimize dependencies between client and server
- Use standard media types
- Avoid implementation details in API contracts

### Service Evolution
- Design for versioning from the start
- Use semantic versioning
- Maintain backward compatibility when possible

## Resource URIs

### Naming Conventions
- Use nouns, not verbs
- Use plural nouns for collections
- Use lowercase letters
- Use hyphens for multi-word resources
- Avoid query parameters for resource identification

### Examples
```
Good:
GET /customers
GET /customers/123
POST /customers

Bad:
GET /getCustomers
GET /customer
GET /createCustomer
```

### Resource Hierarchy
- Reflect relationships in URI structure
- Keep URIs shallow (prefer 2-3 segments)
- Use query parameters for filtering, not hierarchy

### Examples
```
Good:
GET /customers/123/orders
GET /customers/123/orders/456

Bad:
GET /customers
GET /orders/byCustomer/123
```

## HTTP Methods

### GET
- Retrieve resources
- Safe and idempotent
- Cacheable by default
- Should not modify server state

### POST
- Create new resources
- Not idempotent
- Not cacheable
- Returns 201 Created with Location header

### PUT
- Update or replace resources
- Idempotent
- Not cacheable
- Returns 200 OK or 204 No Content

### DELETE
- Delete resources
- Idempotent
- Not cacheable
- Returns 200 OK, 202 Accepted, or 204 No Content

### PATCH
- Partial updates to resources
- Not necessarily idempotent
- Not cacheable
- Returns 200 OK or 204 No Content

## Resource MIME Types

### Content Negotiation
- Use Accept header for request format
- Use Content-Type header for request body
- Support multiple formats when appropriate
- Default to JSON for modern APIs

### Common Media Types
- `application/json`: JSON data
- `application/xml`: XML data
- `application/hal+json`: HAL (Hypermedia Application Language)
- `text/plain`: Plain text

## Asynchronous Operations

### Long-Running Operations
- Return 202 Accepted immediately
- Provide Location header to operation status
- Include estimated completion time
- Support status polling

### Operation Status Endpoint
```
GET /operations/123
{
  "status": "running",
  "createdTime": "2024-01-01T00:00:00Z",
  "lastUpdatedTime": "2024-01-01T00:05:00Z",
  "resourceLocation": "/customers/456"
}
```

## Data Pagination

### Query Parameters
- `offset` or `page`: Starting position
- `limit` or `pageSize`: Items per page
- Consistent naming across endpoints

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "offset": 0,
    "limit": 50,
    "total": 1000,
    "next": "/customers?offset=50&limit=50",
    "previous": null
  }
}
```

### Best Practices
- Provide default page size (e.g., 20-50)
- Enforce maximum page size (e.g., 100)
- Include total count when feasible
- Provide next/previous links

## Filtering and Sorting

### Filtering
- Use query parameters for filters
- Support multiple filter criteria
- Use consistent operators

### Examples
```
GET /customers?status=active&country=US
GET /products?category=electronics&price[min]=100&price[max]=500
```

### Sorting
- Use `sort` parameter
- Support ascending/descending
- Default sort order should be documented

### Examples
```
GET /customers?sort=name
GET /customers?sort=name:asc,createdDate:desc
```

## Partial Responses

### Field Selection
- Use `fields` parameter
- Reduce response size
- Improve performance

### Example
```
GET /customers/123?fields=id,name,email
```

### Response
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com"
}
```

## HATEOAS (Hypermedia as the Engine of Application State)

### Principles
- Include hypermedia links in responses
- Enable client navigation through API
- Reduce coupling to specific URIs
- Self-descriptive APIs

### Example Response
```json
{
  "id": 123,
  "name": "John Doe",
  "email": "john@example.com",
  "_links": {
    "self": { "href": "/customers/123" },
    "orders": { "href": "/customers/123/orders" },
    "update": { "href": "/customers/123", "method": "PUT" },
    "delete": { "href": "/customers/123", "method": "DELETE" }
  }
}
```

## Versioning Strategies

### URI Versioning
- Include version in URI path
- Clear and explicit
- Easy to understand

### Examples
```
/v1/customers
/v2/customers
```

### Query String Versioning
- Include version as query parameter
- Less intrusive to URI structure
- Can be optional

### Examples
```
/customers?api-version=1
/customers?api-version=2
```

### Header Versioning
- Include version in custom header
- Clean URIs
- Less discoverable

### Examples
```
GET /customers
API-Version: 1
```

### Media Type Versioning
- Include version in Content-Type
- RESTful approach
- Complex to implement

### Examples
```
Accept: application/vnd.myapi.v1+json
Accept: application/vnd.myapi.v2+json
```

### Recommendation
- Use URI versioning for public APIs
- Use header versioning for internal APIs
- Document deprecation timeline
- Maintain old versions for transition period

## Multitenant Web APIs

### Tenant Identification
- Use subdomain: `tenant1.api.example.com`
- Use header: `X-Tenant-ID: tenant1`
- Use path: `/tenants/tenant1/customers`

### Data Isolation
- Ensure tenant data separation
- Implement tenant-specific authorization
- Use tenant-aware caching

### Resource Quotas
- Per-tenant rate limiting
- Resource usage limits
- Quota management endpoints

## Distributed Tracing

### Request Correlation
- Include correlation ID in requests
- Propagate through service calls
- Log correlation ID at each hop

### Headers
```
X-Request-ID: abc123
X-Correlation-ID: xyz789
```

### Integration
- Use distributed tracing systems (Jaeger, Zipkin)
- Instrument API endpoints
- Trace performance bottlenecks

## OpenAPI Initiative

### API Documentation
- Use OpenAPI Specification (Swagger)
- Provide interactive documentation
- Generate client SDKs
- Validate API contracts

### Best Practices
- Document all endpoints
- Include request/response examples
- Document error responses
- Keep documentation in sync with implementation

## Error Handling

### HTTP Status Codes
- Use appropriate status codes
- Provide error details in response body
- Include error codes for programmatic handling

### Common Status Codes
- 200 OK: Successful request
- 201 Created: Resource created
- 204 No Content: Successful request with no response body
- 400 Bad Request: Invalid request
- 401 Unauthorized: Authentication required
- 403 Forbidden: Authorization failed
- 404 Not Found: Resource not found
- 409 Conflict: Request conflicts with current state
- 429 Too Many Requests: Rate limit exceeded
- 500 Internal Server Error: Server error
- 503 Service Unavailable: Service temporarily unavailable

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email address",
    "details": {
      "field": "email",
      "value": "invalid-email"
    },
    "requestId": "abc123"
  }
}
```

## Security Considerations

### Authentication
- Use OAuth 2.0 for delegated access
- Use API keys for service-to-service
- Implement token expiration
- Support token refresh

### Authorization
- Implement role-based access control (RBAC)
- Use principle of least privilege
- Validate permissions on each request
- Audit authorization decisions

### Transport Security
- Always use HTTPS
- Implement TLS 1.2 or higher
- Use strong cipher suites
- Enable HSTS

### Rate Limiting
- Implement per-client rate limits
- Use token bucket or sliding window
- Return rate limit headers
- Document rate limits

### Input Validation
- Validate all input parameters
- Sanitize user input
- Use parameterized queries
- Implement request size limits
