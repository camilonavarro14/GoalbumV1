# ---------- BUILDER ----------
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build


# ---------- PRODUCTION ----------
FROM node:20-alpine

WORKDIR /app

# Dependencias necesarias para bcrypt
RUN apk add --no-cache python3 make g++

# Copiar node_modules del builder
COPY --from=builder /app/node_modules ./node_modules

# Copiar build
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
