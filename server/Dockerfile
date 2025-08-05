FROM node:20-alpine

WORKDIR /usr/src/app

# 🔄 FIX 1: Copy package.json and package-lock.json from current folder
COPY package*.json ./

# ✅ Install only production dependencies
RUN npm ci --only=production

# 🔄 FIX 2: Copy all source code into image
COPY . .

# ✅ Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
RUN chown -R nodejs:nodejs /usr/src/app

USER nodejs

EXPOSE 8080

# ✅ Healthcheck (depends on your healthcheck.js and route existing)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

# ✅ Start your backend app
CMD [ "node", "index.js" ]
