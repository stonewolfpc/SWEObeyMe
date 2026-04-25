# Authentication and Authorization

**Source:** Curity, WorkOS, OWASP  
**License:** MIT

## JWT Security Best Practices

JSON Web Tokens (JWTs) are common in OAuth and OpenID Connect. JWT is not a protocol but merely a message format. Security depends on how tokens are issued and validated, not on the format itself.

### Key Takeaways

- Always fully validate JWTs, including signature, issuer, and audience
- Never use access tokens and ID tokens interchangeably
- Avoid placing sensitive or business data in JWTs
- Use short-lived tokens to reduce risk of token theft
- Use asymmetric signing keys and centralized key management
- Assume zero trust, even for internal traffic

### JWT Structure

A JWT is a compact, URL-safe way of passing a JSON message between two parties. The token is divided into parts separated by dots, each base64 URL-encoded:
- Header: Algorithm and token type
- Payload: Claims (data)
- Signature: Cryptographic signature

### JWTs as Access Tokens

JWTs are by-value tokens containing data. Client developers can access data inside access tokens. Consider:

- Developers may use JWT data in applications, causing breakage when token structure changes
- Privacy: Anyone can decode tokens, avoid sensitive data or PII
- Avoid revealing API implementation details (languages, frameworks, OS)

**Phantom Token Pattern:** Use opaque tokens outside infrastructure, make JWTs available only to APIs via API gateway.

**Split Token Pattern:** Similar to phantom token with different implementation details.

### Proof of Possession (PoP) Tokens

Access tokens are typically bearer tokens (like cash). If bearer tokens pose problems, consider PoP tokens:
- Demonstrating Proof of Possession standard
- Mutual-TLS with confirmation (cnf) claim containing client certificate fingerprint

### Avoid Sensitive Data on Front Channel

ID tokens are always JWTs. Extra care needed for what's available:
- Safer to call user info endpoint instead of keeping data in ID token
- Clear tokens of sensitive data to eliminate need for encryption
- Encryption is hard to configure and maintain, requires computational resources

### JWT Signing and Encryption

**Best Algorithms:**
- Signing: RS256 (RSA with SHA-256) or ES256 (ECDSA with SHA-256)
- Avoid: none algorithm, HS256 with weak secrets
- Encryption: Use JWE (JSON Web Encryption) when needed, but prefer not to encrypt

**Symmetric vs Asymmetric:**
- Symmetric: Simpler, key distribution challenges
- Asymmetric: Better security, centralized key management recommended

### JWT Validation

Always validate:
1. Signature using issuer's public key
2. Issuer (iss) claim matches expected issuer
3. Audience (aud) claim matches expected audience
4. Expiration (exp) and not-before (nbf) claims
5. Token hasn't been revoked (if using revocation)

### Time-Based Claims

- exp: Expiration time - token must not be used after
- nbf: Not before - token must not be used before
- iat: Issued at - when token was created
- Use short-lived access tokens (5-15 minutes)
- Use refresh tokens for long-term access

### Claims Best Practices

- Use standard claims when possible (iss, sub, aud, exp, iat)
- Avoid custom claims unless necessary
- Keep claims minimal
- Use pairwise pseudonymous identifiers (sub) for privacy

### Do Not Use JWTs for Sessions

- JWTs are not session tokens
- Use opaque session tokens with server-side storage
- JWTs can't be revoked easily
- Session invalidation is difficult with JWTs

## OAuth 2.0 and OpenID Connect

### OAuth 2.0 Flows

**Authorization Code Flow:**
- Most secure for server-side applications
- User redirected to authorization server
- Authorization code exchanged for tokens
- PKCE (Proof Key for Code Exchange) recommended for public clients

**Implicit Flow:**
- Deprecated for security reasons
- Tokens returned in URL fragment
- Vulnerable to token leakage

**Client Credentials Flow:**
- For service-to-service communication
- No user context
- Direct token exchange

**Resource Owner Password Credentials Flow:**
- Deprecated for security reasons
- Requires storing user credentials
- Only use for legacy systems

### OpenID Connect

Built on top of OAuth 2.0:
- Adds authentication layer
- Provides ID tokens (JWTs)
- Standardizes user info endpoint
- Discovery endpoint for configuration

## Authentication Patterns

### Multi-Factor Authentication (MFA)

- Something you know (password)
- Something you have (device, token)
- Something you are (biometrics)
- Time-based One-Time Passwords (TOTP)
- SMS-based (less secure)

### Session Management

- Use secure, HttpOnly cookies for session tokens
- Implement session timeout
- Provide logout functionality
- Handle concurrent sessions appropriately

### Password Security

- Hash passwords with bcrypt, Argon2, or scrypt
- Never store plain text passwords
- Use salt for each password
- Implement password strength requirements
- Check against breached password lists

## Authorization Patterns

### Role-Based Access Control (RBAC)

- Users assigned roles
- Roles assigned permissions
- Simple to implement and understand
- Can become complex with many roles

### Attribute-Based Access Control (ABAC)

- Policies based on attributes (user, resource, environment)
- More flexible than RBAC
- Complex to implement and manage
- Fine-grained control

### Permission Models

- Hierarchical permissions
- Resource-based permissions
- Action-based permissions (read, write, delete)
- Scope-based permissions (OAuth 2.0 scopes)

## API Security

### API Keys

- Simple but limited security
- No built-in revocation
- Should be used with other mechanisms
- Rotate regularly

### API Gateway Security

- Centralized authentication and authorization
- Rate limiting
- Request/response validation
- Logging and monitoring

### Mutual TLS (mTLS)

- Client and server authenticate each other
- Certificate-based authentication
- High security for service-to-service communication
- Requires certificate management

## Best Practices

### Token Management

- Use short-lived access tokens
- Implement refresh token rotation
- Securely store refresh tokens
- Revoke tokens on logout
- Implement token introspection for opaque tokens

### Security Headers

- Strict-Transport-Security (HSTS)
- Content-Security-Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Set appropriate CORS policies

### Error Handling

- Don't leak sensitive information in errors
- Use generic error messages
- Log security events
- Implement rate limiting on authentication endpoints

### Monitoring and Auditing

- Log authentication attempts
- Track token issuance and usage
- Monitor for suspicious activity
- Implement anomaly detection
- Regular security audits
