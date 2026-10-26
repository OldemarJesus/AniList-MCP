# ==========================================
# Stage 1: Build stage
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json tsconfig.json ./

# Install all dependencies (including devDependencies for TypeScript build)
RUN npm install

# Copy source code
COPY src ./src

# Compile TypeScript into JavaScript (dist/)
RUN npm run build

# ==========================================
# Stage 2: Production runtime stage
# ==========================================
FROM node:20-alpine AS runner

# Install curl for container health check
RUN apk add --no-cache curl

WORKDIR /app

# Set production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0 \
    TRANSPORT=sse

# Copy package descriptors and install only production dependencies
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copy built distribution from builder
COPY --from=builder /app/dist ./dist

# Use non-root unprivileged node user
USER node

# Expose HTTP/SSE and health check port
EXPOSE 3000

# Container healthcheck targeting the /health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

# Start MCP server in SSE mode
CMD ["node", "dist/index.js"]
