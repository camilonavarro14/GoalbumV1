FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
ARG VITE_APP_VERSION
ENV VITE_APP_VERSION=$VITE_APP_VERSION
ARG VITE_APP_OWNER
ENV VITE_APP_OWNER=$VITE_APP_OWNER
ARG VITE_APP_NAME
ENV VITE_APP_NAME=$VITE_APP_NAME
ARG VITE_TERMS_URL
ENV VITE_TERMS_URL=$VITE_TERMS_URL
ARG VITE_APP_ENV
ENV VITE_APP_ENV=$VITE_APP_ENV
RUN npm run build

FROM nginx:alpine
# Copy the built assets to nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Default config for React Router fallback
RUN echo "server { listen 80; location / { root /usr/share/nginx/html; index index.html index.htm; try_files \$uri \$uri/ /index.html; } }" > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
