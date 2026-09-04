# El despliegue oficial es AWS Amplify; este Dockerfile sirve para probar
# la SPA ya construida en local o dentro de la EC2.

# ---------- build ----------
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
