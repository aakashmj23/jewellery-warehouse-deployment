# Stage 1: Build the React frontend
FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve the production build as non-root
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's|pid        /run/nginx.pid;|pid        /tmp/nginx.pid;|' /etc/nginx/nginx.conf

# Prepare writable locations for Nginx
RUN mkdir -p /tmp/nginx/client_temp /tmp/nginx/proxy_temp \
    /tmp/nginx/fastcgi_temp /tmp/nginx/uwsgi_temp /tmp/nginx/scgi_temp \
    && chown -R nginx:nginx /tmp/nginx \
    && chown -R nginx:nginx /var/cache/nginx

# Run Nginx as the non-root nginx user
USER 101

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
