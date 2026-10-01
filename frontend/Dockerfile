# Build stage
FROM oven/bun:1-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build arguments
ARG NEXT_PUBLIC_API_URL=/api

# Build application
RUN NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL bun run build

# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Install only production dependencies
COPY package.json bun.lock ./
RUN bun install --production --frozen-lockfile

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=/api

CMD ["bun", "run", "start"]
