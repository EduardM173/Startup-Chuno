FROM node:24-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY services ./services
COPY infrastructure/sandbox ./infrastructure/sandbox
COPY frontend/package.json ./frontend/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY shared ./shared
COPY scripts/prisma.mjs scripts/seed.mjs scripts/bootstrap-clientes.mjs scripts/bootstrap-sandbox.mjs ./scripts/
RUN node scripts/prisma.mjs generate
ENV NODE_ENV=production
USER node
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy --schema services/pagos/prisma/schema.prisma && node services/pagos/src/main.mjs"]
