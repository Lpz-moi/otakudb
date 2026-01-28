FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm ci --only=production

# Copier le code source
COPY . .

# Builder le frontend
RUN npm run build

# Exposer les ports
EXPOSE 3001 8080

# Commande de démarrage
CMD ["npm", "run", "dev:server"]
