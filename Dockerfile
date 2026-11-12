FROM node:20-alpine

# Create non-root user directory for Hugging Face Spaces compatibility (UID 1000)
WORKDIR /app

# Copy package manifests first for better layer caching
COPY package*.json ./

# Install all dependencies (including build tools & tsx runtime loader)
RUN npm install --legacy-peer-deps

# Copy application source code
COPY . .

# Build the production frontend bundle into /app/dist
RUN npm run build

# Ensure writable permissions for Hugging Face Spaces user (UID 1000)
RUN chown -R 1000:1000 /app /tmp

USER 1000

# Configure Hugging Face Spaces runtime environment
ENV NODE_ENV=production
ENV PORT=7860
ENV NODE_OPTIONS="--import tsx"

EXPOSE 7860

CMD ["npm", "start"]
