# build stage
FROM node:20-alpine as build-stage

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar código y construir
COPY . .

# ARG permite pasar la URL del backend al build (overrideable vía docker-compose build args)
ARG VITE_API_BASE_URL=""
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage

# Copiar build de la etapa anterior
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Nginx corre en primer plano
CMD ["nginx", "-g", "daemon off;"]
