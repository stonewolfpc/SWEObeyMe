# Multi-stage Dockerfile for SWEObeyMe MCP Server
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the project (if needed)
RUN npm run build || echo "No build step required"

# Production stage
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Copy dependencies and source from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/*.js ./
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/math_corpus ./math_corpus
COPY --from=builder /app/godot_corpus ./godot_corpus

# Create non-root user
RUN addgroup -g 1001 -S sweobeyme && \
    adduser -S -u 1001 -G sweobeyme sweobeyme

# Change ownership
RUN chown -R sweobeyme:sweobeyme /app

# Switch to non-root user
USER sweobeyme

# Expose MCP server port (if applicable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})" || exit 0

# Run the MCP server
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "index.js"]
