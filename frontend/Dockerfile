# Stage 1 : build Expo web
FROM node:20-alpine AS builder

# EXPO_PUBLIC_BACKEND_URL est injecté par Railway au moment du build
ARG EXPO_PUBLIC_BACKEND_URL
ENV EXPO_PUBLIC_BACKEND_URL=$EXPO_PUBLIC_BACKEND_URL

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

RUN npx expo export --platform web

# Stage 2 : servir les fichiers statiques avec nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
