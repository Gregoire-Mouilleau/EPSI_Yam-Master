const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth, JWT_SECRET } = require('../middlewares/auth.middleware');

const router = express.Router();

const ALLOWED_AVATAR_KEYS = ['avatar_1', 'avatar_2', 'avatar_3', 'avatar_4', 'avatar_5'];

const insertUserStmt = db.prepare('INSERT INTO users (pseudo, password_hash, avatar_key) VALUES (?, ?, ?)');
const getUserByPseudoStmt = db.prepare('SELECT id, pseudo, password_hash, avatar_key, elo FROM users WHERE pseudo = ?');
const getUserAuthByIdStmt = db.prepare('SELECT id, pseudo, password_hash, avatar_key, elo FROM users WHERE id = ?');
const getUserByIdStmt = db.prepare('SELECT id, pseudo, avatar_key, elo FROM users WHERE id = ?');
const updateAvatarStmt = db.prepare('UPDATE users SET avatar_key = ? WHERE id = ?');
const updatePseudoStmt = db.prepare('UPDATE users SET pseudo = ? WHERE id = ?');
const updatePasswordStmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?');

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

router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { pseudo, currentPassword, newPassword } = req.body || {};
    const trimmedPseudo = typeof pseudo === 'string' ? pseudo.trim() : undefined;

    console.log('=== PATCH /profile ===');
    console.log('Payload reçu:', { pseudo, hasCurrent: !!currentPassword, hasNew: !!newPassword });
    console.log('User ID:', req.auth.sub);

    const userAuth = getUserAuthByIdStmt.get(req.auth.sub);
    if (!userAuth) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    console.log('User actuel:', { id: userAuth.id, pseudo: userAuth.pseudo });
    console.log('Pseudo trimmed:', trimmedPseudo);
    console.log('Pseudo identique?:', trimmedPseudo === userAuth.pseudo);

    let hasAnyChange = false;
    let nextPseudo = userAuth.pseudo;

    // Gestion du changement de pseudo
    if (trimmedPseudo && trimmedPseudo !== userAuth.pseudo) {
      console.log('→ Changement de pseudo détecté');
      if (!isPseudoValid(trimmedPseudo)) {
        return res.status(400).json({ message: 'Pseudo invalide (3-20 chars, lettres/chiffres/_)' });
      }

      const existing = getUserByPseudoStmt.get(trimmedPseudo);
      if (existing && existing.id !== userAuth.id) {
        return res.status(409).json({ message: 'Pseudo déjà utilisé' });
      }

      updatePseudoStmt.run(trimmedPseudo, req.auth.sub);
      hasAnyChange = true;
      nextPseudo = trimmedPseudo;
      console.log('→ Pseudo mis à jour:', trimmedPseudo);
    }

    // Gestion du changement de mot de passe
    if (newPassword && newPassword.length > 0) {
      console.log('→ Changement de mot de passe demandé');
      if (!isPasswordValid(newPassword)) {
        return res.status(400).json({ message: 'Nouveau mot de passe invalide (min 8 caractères)' });
      }

      if (!currentPassword || currentPassword.length === 0) {
        return res.status(400).json({ message: 'Mot de passe actuel requis pour changer le mot de passe' });
      }

      const isMatch = await bcrypt.compare(currentPassword, userAuth.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
      }

      const newPasswordHash = await bcrypt.hash(newPassword, 12);
      updatePasswordStmt.run(newPasswordHash, req.auth.sub);
      hasAnyChange = true;
      console.log('→ Mot de passe mis à jour');
    }

    console.log('Has any change?:', hasAnyChange);

    if (!hasAnyChange) {
      return res.status(400).json({ message: 'Aucune modification à enregistrer' });
    }

    const user = getUserByIdStmt.get(req.auth.sub);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    const cleanUser = formatUser(user);
    const token = nextPseudo !== req.auth.pseudo ? issueToken(cleanUser) : undefined;

    console.log('→ Succès, retour user:', cleanUser);
    return res.status(200).json({ user: cleanUser, token });
  } catch (error) {
    console.error('Error in PATCH /profile:', error);
    return res.status(500).json({ message: 'Erreur serveur (profile)' });
  }
});

router.get('/leaderboard', requireAuth, (req, res) => {
  try {
    // Récupérer les 20 meilleurs joueurs
    const getTopPlayersStmt = db.prepare(
      'SELECT id, pseudo, avatar_key, elo FROM users ORDER BY elo DESC LIMIT 20'
    );
    const topPlayers = getTopPlayersStmt.all().map(formatUser);

    // Récupérer le rang du joueur actuel
    const getRankStmt = db.prepare(
      'SELECT COUNT(*) as rank FROM users WHERE elo > (SELECT elo FROM users WHERE id = ?)'
    );
    const rankResult = getRankStmt.get(req.auth.sub);
    const userRank = rankResult.rank + 1;

    // Récupérer le joueur actuel
    const currentUser = getUserByIdStmt.get(req.auth.sub);
    if (!currentUser) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    // Récupérer le total de joueurs
    const getTotalPlayersStmt = db.prepare('SELECT COUNT(*) as total FROM users');
    const totalResult = getTotalPlayersStmt.get();
    const totalPlayers = totalResult.total;

    return res.status(200).json({
      topPlayers,
      currentUser: formatUser(currentUser),
      userRank,
      totalPlayers,
    });
  } catch (error) {
    console.error('Error in GET /leaderboard:', error);
    return res.status(500).json({ message: 'Erreur serveur (leaderboard)' });
  }
});

module.exports = router;
