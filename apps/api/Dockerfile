FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy root configurations and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy packages and the API app
COPY packages/database ./packages/database
COPY apps/api ./apps/api

# Install dependencies (ignoring scripts initially to avoid prisma generation errors)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Generate Prisma Client
RUN pnpm --filter @order-pro/database run generate

# Build the API
RUN pnpm --filter api run build

# --- Runner Stage ---
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Copy built artifacts and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER expressjs

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
