# Multi-stage production build for Apex EAMS
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source files
COPY . .

# Build Vite frontend
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy dependencies and build artifacts
COPY package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/src/types ./src/types
COPY --from=builder /app/server.ts ./server.ts

# Ensure data directory exists
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["npx", "tsx", "server.ts"]
