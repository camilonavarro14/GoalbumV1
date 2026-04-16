FROM node:20-alpine

WORKDIR /app

# 🔥 Agrega esto
RUN apk add --no-cache python3 make g++

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

CMD ["node", "dist/main"]
