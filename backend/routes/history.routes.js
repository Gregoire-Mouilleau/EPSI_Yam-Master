/**
 * Routes pour l'historique et les statistiques des parties
 * À intégrer dans index.js plus tard si nécessaire
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middlewares/auth.middleware');

// Récupérer l'historique d'un joueur
router.get('/history/:userId', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    // Vérifier que l'utilisateur demande ses propres données
    if (req.auth.sub !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    const stmt = db.prepare(`
      SELECT * FROM game_history
      WHERE player1_id = ? OR player2_id = ?
      ORDER BY played_at DESC
      LIMIT 50
    `);
    
    const history = stmt.all(userId, userId);
    
    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('[HISTORY API ERROR]', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

router.get('/history/game/:gameId', requireAuth, (req, res) => {
  try {
    const gameId = parseInt(req.params.gameId);
    const stmt = db.prepare('SELECT * FROM game_history WHERE id = ?');
    const game = stmt.get(gameId);

    if (!game) {
      return res.status(404).json({ message: 'Partie introuvable' });
    }

    const userId = req.auth.sub;
    if (game.player1_id !== userId && game.player2_id !== userId) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const moves = game.moves_json ? JSON.parse(game.moves_json) : [];

    return res.json({
      success: true,
      game: {
        ...game,
        moves,
        moves_json: undefined,
      },
    });
  } catch (error) {
    console.error('[GAME DETAIL API ERROR]', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Statistiques d'un joueur
router.get('/stats/:userId', requireAuth, (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const stmt = db.prepare(`
      SELECT 
        COUNT(*) as total_games,
        SUM(CASE WHEN winner_id = ? THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN winner_id IS NOT NULL AND winner_id != ? THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN winner_id IS NULL THEN 1 ELSE 0 END) as draws,
        SUM(CASE WHEN game_type = 'bot' THEN 1 ELSE 0 END) as bot_games,
        SUM(CASE WHEN game_type = 'online' THEN 1 ELSE 0 END) as online_games,
        AVG(CASE WHEN player1_id = ? THEN player1_score ELSE player2_score END) as avg_score
      FROM game_history
      WHERE player1_id = ? OR player2_id = ?
    `);
    
    const stats = stmt.get(userId, userId, userId, userId, userId);
    
    return res.json({
      success: true,
      stats: {
        total_games: stats.total_games || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        draws: stats.draws || 0,
        bot_games: stats.bot_games || 0,
        online_games: stats.online_games || 0,
        avg_score: stats.avg_score ? Math.round(stats.avg_score * 10) / 10 : 0,
        win_rate: stats.total_games > 0 
          ? Math.round((stats.wins / stats.total_games) * 100) 
          : 0
      }
    });
  } catch (error) {
    console.error('[STATS API ERROR]', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Top 10 des joueurs (classement)
router.get('/leaderboard', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT 
        u.id,
        u.pseudo,
        u.avatar_key,
        u.elo,
        COUNT(gh.id) as games_played,
        SUM(CASE WHEN gh.winner_id = u.id THEN 1 ELSE 0 END) as wins
      FROM users u
      LEFT JOIN game_history gh ON u.id = gh.player1_id OR u.id = gh.player2_id
      GROUP BY u.id
      ORDER BY u.elo DESC
      LIMIT 10
    `);
    
    const leaderboard = stmt.all();
    
    return res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('[LEADERBOARD API ERROR]', error);
    return res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
