FROM node:20-alpine

WORKDIR /app

# ✅ PRIMERO copiar package.json
COPY package*.json ./

# ✅ LUEGO instalar
RUN npm install

# ✅ DESPUÉS copiar el resto
COPY . .

RUN npm run build

CMD ["node", "dist/main"]
