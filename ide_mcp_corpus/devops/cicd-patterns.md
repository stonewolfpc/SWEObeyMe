# DevOps & CI/CD Patterns

## Overview

This document covers GitHub Actions patterns, deployment pipelines, artifact versioning, canary releases, infrastructure as code basics, and containerization best practices. These concepts enable MasterControl to become a deployment architect, not just a code assistant.

## CI/CD Fundamentals

### Continuous Integration (CI)

- **Definition**: Frequently integrate code changes
- **Goal**: Detect integration issues early
- **Practices**: Automated builds, automated tests, frequent commits
- **Benefits**: Faster feedback, reduced integration risk

### Continuous Delivery (CD)

- **Definition**: Automate release process
- **Goal**: Deployable at any time
- **Practices**: Automated deployment, automated testing
- **Benefits**: Faster releases, reduced deployment risk

### Continuous Deployment

- **Definition**: Automatically deploy to production
- **Goal**: Zero manual intervention
- **Practices**: Full automation, extensive testing
- **Benefits**: Fastest delivery, but requires confidence

## GitHub Actions Patterns

### Workflow Structure

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: npm test
```

### Job Patterns

#### Sequential Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    needs: build
    runs-on: ubuntu-latest
    steps: [...]
```

#### Parallel Jobs

```yaml
jobs:
  test-linux:
    runs-on: ubuntu-latest
    steps: [...]

  test-windows:
    runs-on: windows-latest
    steps: [...]

  test-macos:
    runs-on: macos-latest
    steps: [...]
```

#### Matrix Strategy

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        node: [14, 16, 18]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

### Caching Patterns

#### Dependency Caching

```yaml
- name: Cache node modules
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

#### Build Caching

```yaml
- name: Cache build
  uses: actions/cache@v3
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*') }}
```

### Artifact Patterns

#### Upload Artifacts

```yaml
- name: Build
  run: npm run build

- name: Upload artifacts
  uses: actions/upload-artifact@v3
  with:
    name: build-output
    path: dist/
```

#### Download Artifacts

```yaml
- name: Download artifacts
  uses: actions/download-artifact@v3
  with:
    name: build-output
    path: dist/
```

### Secret Management

```yaml
- name: Deploy
  env:
    API_KEY: ${{ secrets.API_KEY }}
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
  run: npm run deploy
```

### Environment Protection

```yaml
environments:
  production:
    url: https://example.com
    protection_rules:
      required_reviewers: ['team-lead']
```

## Deployment Pipelines

### Pipeline Stages

1. **Build**: Compile code
2. **Test**: Run tests
3. **Package**: Create deployable artifact
4. **Deploy to Staging**: Deploy to staging environment
5. **Integration Tests**: Run integration tests
6. **Deploy to Production**: Deploy to production
7. **Smoke Tests**: Run smoke tests
8. **Rollback**: Rollback if issues

### Pipeline Patterns

#### Blue-Green Deployment

- **Two Environments**: Blue (current), Green (new)
- **Switch**: Switch traffic when green is ready
- **Rollback**: Instant rollback by switching back
- **Benefits**: Zero downtime, instant rollback

```yaml
- name: Deploy to Green
  run: kubectl apply -f green-deployment.yaml

- name: Health Check Green
  run: ./health-check.sh green.example.com

- name: Switch Traffic
  run: kubectl apply -f switch-to-green.yaml
```

#### Canary Deployment

- **Gradual Rollout**: Gradually increase traffic to new version
- **Monitor**: Monitor metrics during rollout
- **Rollback**: Rollback if issues detected
- **Benefits**: Reduced risk, gradual exposure

```yaml
- name: Deploy Canary (10%)
  run: kubectl apply -f canary-10.yaml

- name: Wait and Monitor
  run: sleep 300 && ./monitor-canary.sh

- name: Deploy Canary (50%)
  run: kubectl apply -f canary-50.yaml

- name: Wait and Monitor
  run: sleep 300 && ./monitor-canary.sh

- name: Deploy Full
  run: kubectl apply -f full-deployment.yaml
```

#### Rolling Deployment

- **Incremental**: Replace instances incrementally
- **No Downtime**: No downtime during deployment
- **Gradual**: Gradual replacement
- **Benefits**: No downtime, gradual rollout

#### Feature Flags

- **Decouple**: Decouple deployment from release
- **Toggle**: Toggle features at runtime
- **A/B Testing**: Enable A/B testing
- **Benefits**: Safer releases, faster iteration

```yaml
- name: Deploy with Feature Flag
  run: |
    FEATURE_NEW_UI=true npm run deploy
```

## Artifact Versioning

### Semantic Versioning

- **Format**: MAJOR.MINOR.PATCH
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible
- **Examples**: 1.0.0, 1.2.3, 2.0.0

### Version Strategies

#### Git-Based Versioning

```yaml
- name: Generate Version
  id: version
  run: |
    VERSION=$(git describe --tags --always)
    echo "VERSION=$VERSION" >> $GITHUB_OUTPUT

- name: Build
  run: |
    npm version ${{ steps.version.outputs.VERSION }}
    npm run build
```

#### Calendar Versioning

- **Format**: YYYY.MM.DD
- **Benefits**: Predictable, time-based
- **Example**: 2024.04.24

#### Hash-Based Versioning

- **Format**: Short commit hash
- **Benefits**: Unique, traceable
- **Example**: 1a2b3c4

### Artifact Repositories

- **npm**: JavaScript packages
- **Maven**: Java artifacts
- **PyPI**: Python packages
- **Docker Hub**: Docker images
- **GitHub Packages**: Universal package registry

```yaml
- name: Publish to npm
  run: npm publish

- name: Publish Docker Image
  run: |
    docker build -t myapp:${{ github.sha }} .
    docker push myapp:${{ github.sha }}
```

## Infrastructure as Code (IaC)

### Benefits

- **Version Control**: Infrastructure in version control
- **Reproducibility**: Reproducible environments
- **Consistency**: Consistent across environments
- **Automation**: Automated provisioning

### Tools

- **Terraform**: Cloud-agnostic IaC
- **AWS CloudFormation**: AWS-specific
- **Azure Resource Manager**: Azure-specific
- **Ansible**: Configuration management
- **Pulumi**: IaC with real languages

### Terraform Patterns

#### Module Structure

```
terraform/
├── modules/
│   ├── vpc/
│   ├── ec2/
│   └── rds/
├── environments/
│   ├── dev/
│   ├── staging/
│   └── production/
└── main.tf
```

#### State Management

```hcl
terraform {
  backend "s3" {
    bucket = "terraform-state"
    key    = "prod/terraform.tfstate"
    region = "us-east-1"
  }
}
```

#### Variables

```hcl
variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "instance_count" {
  description = "Number of instances"
  type        = number
}
```

#### Outputs

```hcl
output "instance_public_ip" {
  description = "Public IP of instance"
  value       = aws_instance.web.public_ip
}
```

## Containerization

### Docker Best Practices

#### Multi-Stage Builds

```dockerfile
# Build stage
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

#### Minimal Images

```dockerfile
# Use Alpine for smaller images
FROM node:18-alpine

# Use distroless for security
FROM gcr.io/distroless/nodejs:18
```

#### Layer Caching

```dockerfile
# Copy dependencies first for better caching
COPY package*.json ./
RUN npm ci

# Copy source after dependencies
COPY . .
```

#### Security Scanning

```yaml
- name: Build Docker Image
  run: docker build -t myapp:${{ github.sha }} .

- name: Scan for Vulnerabilities
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: myapp:${{ github.sha }}
    format: 'sarif'
    output: 'trivy-results.sarif'
```

### Kubernetes Patterns

#### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:${{ github.sha }}
          ports:
            - containerPort: 3000
```

#### Service

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 3000
  type: LoadBalancer
```

#### ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: myapp-config
data:
  API_URL: 'https://api.example.com'
  LOG_LEVEL: 'info'
```

#### Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secret
type: Opaque
data:
  API_KEY: base64-encoded-key
```

## Monitoring and Observability

### Metrics

- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization
- **Datadog**: Cloud monitoring
- **CloudWatch**: AWS monitoring

### Logging

- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **CloudWatch Logs**: AWS logging
- **Splunk**: Enterprise logging
- **Loki**: Grafana logging

### Tracing

- **Jaeger**: Distributed tracing
- **Zipkin**: Distributed tracing
- **AWS X-Ray**: AWS tracing
- **Datadog APM**: Tracing and monitoring

### Health Checks

```yaml
- name: Health Check
  run: |
    curl -f https://staging.example.com/health || exit 1
```

## Security Patterns

### Secrets Management

- **GitHub Secrets**: GitHub Actions secrets
- **AWS Secrets Manager**: AWS secrets
- **HashiCorp Vault**: Enterprise secrets
- **Environment Variables**: Environment-based

### Security Scanning

- **Snyk**: Dependency scanning
- **Trivy**: Container scanning
- **SonarQube**: Code security analysis
- **OWASP ZAP**: Web security scanning

### Access Control

- **RBAC**: Role-based access control
- **IAM**: Identity and access management
- **Service Accounts**: Service authentication
- **Least Privilege**: Minimum necessary access

## Best Practices

### Pipeline Design

- **Fast Feedback**: Fast builds and tests
- **Idempotent**: Safe to re-run
- **Parallel**: Run in parallel when possible
- **Fail Fast**: Fail early and clearly

### Deployment Safety

- **Automated Rollback**: Automatic rollback on failure
- **Health Checks**: Verify deployment success
- **Gradual Rollout**: Canary or blue-green
- **Monitoring**: Monitor after deployment

### Infrastructure

- **Immutable Infrastructure**: Replace, don't modify
- **Infrastructure as Code**: Version controlled
- **Environment Parity**: Same across environments
- **Disaster Recovery**: Backup and recovery plan

### Testing

- **Unit Tests**: Fast unit tests in CI
- **Integration Tests**: Slower integration tests
- **E2E Tests**: End-to-end tests in staging
- **Performance Tests**: Performance testing
