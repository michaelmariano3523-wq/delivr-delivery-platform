FROM node:20-slim

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source files
COPY . .

# Build the frontend
RUN npm run build

# Expose port
# Port is provided by Railway at runtime

# Set production environment
ENV NODE_ENV=production

# Start the server
CMD ["npm", "start"]
