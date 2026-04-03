# Yam Master

> Jeu de dés multijoueur en temps réel — conçu dans le cadre du cours **Architecture Applicative** à l'EPSI (4ème année).

---

## Sommaire

1. [Présentation du projet](#présentation-du-projet)
2. [Stack technique](#stack-technique)
3. [Architecture du projet](#architecture-du-projet)
4. [Fonctionnalités](#fonctionnalités)
5. [Lancer le projet](#lancer-le-projet)
   - [Prérequis](#prérequis)
   - [Lancement en développement](#lancement-en-développement)
   - [Lancement avec Docker](#lancement-avec-docker)
6. [Variables d'environnement](#variables-denvironnement)
7. [Analyse de la qualité du code](#analyse-de-la-qualité-du-code)

---

## Présentation du projet

**Yam Master** est un jeu de plateau au tour par tour basé sur des lancers de dés. Deux joueurs s'affrontent sur une grille 5×5 en cherchant à aligner 5 pions. Chaque tour, le joueur lance jusqu'à 3 fois ses dés pour obtenir une combinaison (brelan, full, carré, suite, yam…) qui lui permet de placer un pion sur la case correspondante de la grille.

Le projet comprend un mode **1v1 en ligne** via matchmaking et un mode **vs Bot** avec une IA stratégique.

---

## Stack technique

### Backend

| Technologie | Rôle |
|---|---|
| **Node.js** | Runtime serveur |
| **Express** | Serveur HTTP & routes REST |
| **Socket.IO v4** | Communication temps réel (WebSocket) |
| **better-sqlite3** | Base de données SQLite embarquée |
| **bcryptjs** | Hashage des mots de passe |
| **jsonwebtoken** | Authentification JWT |
| **helmet** | Sécurisation des headers HTTP |
| **cors** | Gestion du Cross-Origin |

### Frontend

| Technologie | Rôle |
|---|---|
| **React Native** | Framework UI cross-platform |
| **Expo** (SDK 54) | Toolchain de développement |
| **expo-av** | Audio (musique de fond, effets) |
| **React Navigation** | Navigation entre écrans |
| **Socket.IO Client v4** | Communication temps réel avec le backend |
| **React Native Web** | Rendu web via Expo |

### Infrastructure

| Technologie | Rôle |
|---|---|
| **Docker & Docker Compose** | Conteneurisation du backend et du frontend |
| **Nginx** | Serveur web pour le build statique frontend en production |
| **SonarCloud** | Analyse qualité & sécurité du code |

---

## Architecture du projet

```
.
├── docker-compose.yml          # Orchestration des services
├── sonar-project.properties    # Configuration SonarCloud
│
├── backend/                    # Serveur Node.js / Socket.IO
│   ├── index.js                # Point d'entrée : socket handlers, logique de partie
│   ├── db.js                   # Initialisation SQLite et schéma des tables
│   ├── package.json
│   ├── Dockerfile
│   ├── data/
│   │   └── app.db              # Base de données SQLite (auto-générée)
│   ├── middlewares/
│   │   └── auth.middleware.js  # Vérification JWT
│   ├── routes/
│   │   ├── auth.routes.js      # POST /auth/register, /auth/login, /auth/me…
│   │   └── history.routes.js   # GET /history, /leaderboard
│   └── services/
│       ├── game.service.js     # Logique de jeu : dés, combinaisons, grille, timer
│       └── bot.service.js      # IA du bot : stratégie, verrouillage des dés, placement
│
└── frontend/                   # Application React Native / Expo
    ├── App.js                  # Providers globaux (Auth, Socket, Language, Music)
    ├── app.json
    ├── nginx.conf              # Config Nginx pour le build de production
    ├── Dockerfile
    ├── package.json
    └── app/
        ├── screens/            # Écrans principaux
        │   ├── home.screen.js
        │   ├── vs-bot-game.screen.js
        │   ├── online-game.screen.js
        │   ├── history.screen.js
        │   ├── leaderboard.screen.js
        │   ├── profile.screen.js
        │   └── rules.screen.js
        ├── controllers/        # Logique de partie (gestion des events socket)
        │   ├── vs-bot-game.controller.js
        │   └── online-game.controller.js
        ├── components/         # Composants réutilisables
        │   └── board/          # Interface de jeu (grille, dés, choix, modals)
        ├── contexts/           # Contextes React globaux
        │   ├── auth.context.js
        │   ├── socket.context.js
        │   ├── language.context.js
        │   └── music.context.js
        ├── services/           # Appels API REST
        │   ├── api.js
        │   └── history.service.js
        ├── hooks/
        │   └── useGameDeck.js
        └── i18n/               # Internationalisation FR / EN
            ├── fr.json
            ├── en.json
            └── index.js
```

### Flux de communication

```
Frontend (Expo Web)
      │
      │  HTTP REST  ──→  /auth/*  /history/*  /leaderboard
      │
      │  WebSocket (Socket.IO)
      ├──→ game.dices.roll
      ├──→ game.dices.lock
      ├──→ game.choices.selected
      ├──→ game.grid.selected
      └──→ game.timer / game.ended / ...
      
Backend (Node.js)
      │
      ├── SQLite (users, saved_games, game_history)
      ├── GameService  (combinaisons, grille, dés)
      └── BotService   (IA stratégique)
```

---

## Fonctionnalités

- **Authentification** : inscription, connexion, JWT, avatar personnalisable
- **Mode en ligne** : matchmaking automatique, parties 1v1 en temps réel
- **Mode vs Bot** : IA avec stratégie offensive/défensive adaptative
- **Combinaisons de dés** : brelan ×6, full, carré, suite, yam, sec (≤8), défi
- **Mode Défi** : après le 1er lancer, obtenir une figure non-brelan en 2 tentatives pour poser un pion sur la case spéciale
- **Reprise de partie** : les parties vs Bot sont sauvegardées et reprises automatiquement
- **Historique** : consultation des dernières parties jouées
- **Classement** : leaderboard ELO
- **Multilingue** : français et anglais
- **Musique & effets sonores**

---

## Lancer le projet

### Prérequis

- [Node.js](https://nodejs.org/) >= 18
- [npm](https://www.npmjs.com/) >= 9
- _(optionnel)_ [Docker](https://www.docker.com/) & Docker Compose

---

### Lancement en développement

#### 1. Backend

```bash
cd backend
npm install
node index.js
```

Le serveur démarre sur **http://localhost:3000**

#### 2. Frontend

```bash
cd frontend
npm install
npx expo start
```

L'application est accessible sur **http://localhost:8081**

> Le frontend se connecte au backend via `http://localhost:3000` par défaut.

---

### Lancement avec Docker

```bash
# À la racine du projet
docker-compose up --build
```

| Service | URL |
|---|---|
| Frontend (Nginx) | http://localhost:80 |
| Backend (API + WebSocket) | http://localhost:3000 |

Pour spécifier l'URL du backend pour le build frontend :

```bash
EXPO_PUBLIC_BACKEND_URL=http://mon-serveur:3000 docker-compose up --build
```

---

## Variables d'environnement

### Backend

| Variable | Défaut | Description |
|---|---|---|
| `PORT` | `3000` | Port d'écoute du serveur |
| `NODE_ENV` | `development` | Environnement (`production` / `development`) |
| `JWT_SECRET` | `dev-secret-change-me` | Secret de signature JWT — **à changer en production** |

### Frontend

| Variable | Défaut | Description |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `http://localhost:3000` | URL du backend |

---

## Analyse de la qualité du code

Ce projet est configuré avec **SonarCloud** pour l'analyse statique.

```bash
# Depuis la racine du projet (nécessite sonar-scanner installé)
sonar-scanner
```

La configuration se trouve dans [`sonar-project.properties`](./sonar-project.properties).

---

## Auteur

Projet réalisé par **Grégoire Mouilleau** — EPSI Y4 Architecture Applicative
