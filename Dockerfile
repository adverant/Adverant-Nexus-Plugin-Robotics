# Multi-stage build for production efficiency

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (need dev deps for TypeScript build)
RUN npm install && \
    npm cache clean --force

# Copy source code
COPY api ./api
COPY core ./core
COPY shared ./shared

# Build TypeScript
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S robotics && \
    adduser -u 1001 -S robotics -G robotics

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev && \
    npm cache clean --force

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Change ownership
RUN chown -R robotics:robotics /app

# Switch to non-root user
USER robotics

# Expose ports
EXPOSE 9113 9114

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:9113/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start server
CMD ["node", "dist/api/src/server.js"]
