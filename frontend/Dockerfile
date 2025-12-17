# Development Dockerfile for Angular Frontend
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install Angular CLI globally
RUN npm install -g @angular/cli@17

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 4200

# Default command (overridden in docker-compose)
CMD ["ng", "serve", "--host", "0.0.0.0"]

