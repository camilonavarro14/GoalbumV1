FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                    # ← cambiar install por ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev         # ← cambiar install por ci
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
