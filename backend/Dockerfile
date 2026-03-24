# Dockerfile pour le backend Node.js
FROM node:18-alpine

# Installer les dépendances système pour better-sqlite3
RUN apk add --no-cache python3 make g++

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier tout le code source
COPY . .

# Créer le dossier data s'il n'existe pas
RUN mkdir -p /app/data

# Exposer le port 3000
EXPOSE 3000

# Variable d'environnement
ENV NODE_ENV=production
ENV PORT=3000

# Commande de démarrage
CMD ["node", "index.js"]
