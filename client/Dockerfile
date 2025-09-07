FROM node:20-alpine AS base

# Layer to install dependencies
FROM base AS deps

RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy local package files
COPY package.json package-lock.json* ./

RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# Copy app source code
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Final minimal runtime image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
