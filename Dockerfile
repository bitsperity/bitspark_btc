# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files (both files for proper cache invalidation)
COPY package.json package-lock.json ./

# Install dependencies (use npm install for flexibility)
RUN npm install

# Copy source
COPY . .

# Build static site
RUN npm run build

# Production stage - serve static files
FROM nginx:alpine AS production

# Copy built files to nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# Development stage
FROM node:22-alpine AS development

WORKDIR /app

# Copy package files (both files for proper cache invalidation)
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
