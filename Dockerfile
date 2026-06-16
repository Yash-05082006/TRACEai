FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build
RUN npx nitro build

# Production image
FROM node:22-alpine AS runner
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/.output ./.output

EXPOSE 8080
ENV PORT=8080

# Run the standalone Nitro server
CMD ["node", ".output/server/index.mjs"]
