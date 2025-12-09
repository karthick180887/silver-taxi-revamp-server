# ---------- Build stage ----------
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build  # creates /dist folder

# ---------- Runtime ----------
FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --production

# Copy built app
COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
ENV PORT=3011
EXPOSE 3011

CMD ["node", "dist/server.js"]
