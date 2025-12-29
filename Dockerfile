# =============================================================================
# Dockerfile para Nurturing Frontend en Cloud Run
# Multi-stage build: Node para build, Nginx para servir
# =============================================================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build argument for API URL
ARG VITE_API_URL
ARG VITE_ENVIRONMENT=qa

# Create .env file
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env && \
    echo "VITE_MOCK_API=false" >> .env && \
    echo "VITE_ENVIRONMENT=${VITE_ENVIRONMENT}" >> .env

# Build the app (skip TypeScript check)
RUN npx vite build

# Stage 2: Production
FROM nginx:alpine

# Copy custom nginx config
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 8080;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Handle SPA routing - all routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # No cache for index.html
    location = /index.html {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }
}
EOF

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Cloud Run uses PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
