FROM node:20-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable

# Copy root configurations and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy internal packages and API app
COPY packages/tsconfig ./packages/tsconfig
COPY packages/database ./packages/database
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile --ignore-scripts

# Build shared package
RUN pnpm --filter @order-pro/shared run build

# Generate Prisma Client and build database package
RUN pnpm --filter @order-pro/database run build

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
COPY --from=builder /app/packages/tsconfig ./packages/tsconfig
COPY --from=builder /app/packages/database ./packages/database
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

USER expressjs

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
