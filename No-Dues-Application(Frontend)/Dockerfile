# Stage 1: Build the React application
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --force

# Copy source code
COPY . .

# Accept build-time env vars so the React app can talk to the backend
ARG REACT_APP_GENERATED_BACKEND_URL=""
ENV REACT_APP_GENERATED_BACKEND_URL=$REACT_APP_GENERATED_BACKEND_URL

ARG REACT_APP_ENABLE_CAPTCHA=true
ENV REACT_APP_ENABLE_CAPTCHA=$REACT_APP_ENABLE_CAPTCHA

# Build the production bundle
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy entrypoint script that generates config.json from env vars at startup
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN sed -i 's/\r$//' /docker-entrypoint.sh && chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
