const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middlewares/auth.middleware');

const router = express.Router();

const ALLOWED_AVATAR_KEYS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5'];

const insertUserStmt = db.prepare('INSERT INTO users (pseudo, password_hash, avatar_key) VALUES (?, ?, ?)');
const getUserByPseudoStmt = db.prepare('SELECT id, pseudo, password_hash, avatar_key, elo FROM users WHERE pseudo = ?');
const getUserByIdStmt = db.prepare('SELECT id, pseudo, avatar_key, elo FROM users WHERE id = ?');
const updateAvatarStmt = db.prepare('UPDATE users SET avatar_key = ? WHERE id = ?');

function formatUser(row) {
  return {
    id: row.id,
    pseudo: row.pseudo,
    avatarKey: row.avatar_key,
    elo: row.elo,
  };
}

function isPseudoValid(pseudo) {
  return typeof pseudo === 'string' && /^[a-zA-Z0-9_]{3,20}$/.test(pseudo);
}

function isPasswordValid(password) {
  return typeof password === 'string' && password.length >= 8;
}

function issueToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      pseudo: user.pseudo,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post('/register', async (req, res) => {
  try {
    const { pseudo, password, avatarKey } = req.body || {};
    const nextAvatarKey = avatarKey || 'avatar_1';
    if (!ALLOWED_AVATAR_KEYS.includes(nextAvatarKey)) {
      return res.status(400).json({ message: 'Avatar invalide' });
    }


    if (!isPseudoValid(pseudo)) {
      return res.status(400).json({ message: 'Pseudo invalide (3-20 chars, lettres/chiffres/_)' });
    }

    if (!isPasswordValid(password)) {
      return res.status(400).json({ message: 'Mot de passe invalide (min 8 caractères)' });
    }

    const existing = getUserByPseudoStmt.get(pseudo);
    if (existing) {
      return res.status(409).json({ message: 'Pseudo déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const result = insertUserStmt.run(pseudo, passwordHash, nextAvatarKey);

    const user = getUserByIdStmt.get(result.lastInsertRowid);
    const cleanUser = formatUser(user);
    const token = issueToken(cleanUser);

    return res.status(201).json({
      token,
      user: cleanUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur (register)' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { pseudo, password } = req.body || {};

    if (typeof pseudo !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Identifiants invalides' });
    }

    const user = getUserByPseudoStmt.get(pseudo);
    if (!user) {
      return res.status(401).json({ message: 'Pseudo ou mot de passe incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Pseudo ou mot de passe incorrect' });
    }

    const cleanUser = formatUser(user);

    const token = issueToken(cleanUser);

    return res.status(200).json({
      token,
      user: cleanUser,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur (login)' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  try {
    const user = getUserByIdStmt.get(req.auth.sub);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.status(200).json({ user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur (me)' });
  }
});

router.patch('/avatar', requireAuth, (req, res) => {
  try {
    const { avatarKey } = req.body || {};

    if (!ALLOWED_AVATAR_KEYS.includes(avatarKey)) {
      return res.status(400).json({ message: 'Avatar invalide' });
    }

    updateAvatarStmt.run(avatarKey, req.auth.sub);

    const user = getUserByIdStmt.get(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    return res.status(200).json({ user: formatUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Erreur serveur (avatar)' });
  }
});

module.exports = router;
