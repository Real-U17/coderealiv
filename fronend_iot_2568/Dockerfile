# frontend/Dockerfile
FROM node:20.18.0

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose Nuxt default port
EXPOSE 3000

# Run Nuxt in dev mode
CMD ["npm", "run", "dev"]
