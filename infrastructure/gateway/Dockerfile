FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY frontend ./frontend
COPY services ./services
COPY infrastructure/sandbox ./infrastructure/sandbox
RUN npm ci --ignore-scripts --no-audit --no-fund
RUN npm run build
FROM nginx:1.28-alpine
COPY infrastructure/gateway/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
