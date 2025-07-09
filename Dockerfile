FROM node:22-alpine

# Install dependencies for USB support
RUN apk add --no-cache \
    libusb-dev \
    eudev-dev \
    linux-headers \
    build-base \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install npm dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S printer -u 1001

# Change ownership of the app directory
RUN chown -R printer:nodejs /app
USER printer

# Start the application
CMD ["npm", "run", "todo-server"]
