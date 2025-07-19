# Multi-stage Dockerfile for building and serving Udacity AWS Developer projects
# This Dockerfile can build any of the Node.js projects in the src directory

ARG PROJECT_PATH=src/project/image-filter-udagram-app
ARG NODE_VERSION=18.20.3

# Build stage
FROM node:${NODE_VERSION}-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /usr/src/app

# Copy the entire src directory
COPY src/ ./src/

# Set the project path as build argument
ARG PROJECT_PATH
ENV PROJECT_DIR=${PROJECT_PATH}

# Install dependencies for the specific project
WORKDIR /usr/src/app/${PROJECT_DIR}
RUN npm ci --only=production

# Production stage
FROM node:${NODE_VERSION}-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /usr/src/app

# Copy built application from builder stage
ARG PROJECT_PATH
COPY --from=builder --chown=appuser:appuser /usr/src/app/${PROJECT_PATH} ./

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["npm", "start"]