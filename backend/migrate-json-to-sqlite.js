/**
 * Script de migration : saved_games.json → SQLite
 * À exécuter une seule fois : node migrate-json-to-sqlite.js
 */

const fs = require('fs');
const path = require('path');
const db = require('./db');

const SAVED_GAMES_FILE = path.join(__dirname, 'data', 'saved_games.json');

console.log('[MIGRATION] Démarrage de la migration JSON → SQLite...');

try {
  // Vérifier si le fichier JSON existe
  if (!fs.existsSync(SAVED_GAMES_FILE)) {
    console.log('[MIGRATION] Aucun fichier saved_games.json à migrer. Migration terminée.');
    process.exit(0);
  }

  // Charger les données JSON
  const jsonData = JSON.parse(fs.readFileSync(SAVED_GAMES_FILE, 'utf-8'));
  console.log(`[MIGRATION] ${jsonData.length} partie(s) trouvée(s) dans le JSON`);

  if (jsonData.length === 0) {
    console.log('[MIGRATION] Aucune donnée à migrer.');
    process.exit(0);
  }

  // Préparer les requêtes
  const getUserByPseudoStmt = db.prepare('SELECT id FROM users WHERE pseudo = ?');
  const insertSavedGameStmt = db.prepare(`
    INSERT INTO saved_games (user_id, game_state, created_at, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let migrated = 0;
  let skipped = 0;

  // Migrer chaque partie sauvegardée
  for (const game of jsonData) {
    try {
      // Trouver l'utilisateur par pseudo
      const user = getUserByPseudoStmt.get(game.player1Pseudo);
      
      if (!user) {
        console.log(`[MIGRATION] ⚠️  User "${game.player1Pseudo}" introuvable, partie ignorée`);
        skipped++;
        continue;
      }

      // Sérialiser l'état du jeu en JSON
      const gameStateJson = JSON.stringify({
        idGame: game.idGame,
        player1Pseudo: game.player1Pseudo,
        player1AvatarKey: game.player1AvatarKey,
        player2Pseudo: game.player2Pseudo,
        player2AvatarKey: game.player2AvatarKey,
        gameState: game.gameState
      });

      // Insérer dans SQLite
      insertSavedGameStmt.run(user.id, gameStateJson);
      migrated++;
      console.log(`[MIGRATION] ✓ Partie de "${game.player1Pseudo}" migrée`);
    } catch (err) {
      console.error(`[MIGRATION] ✗ Erreur sur partie de "${game.player1Pseudo}":`, err.message);
      skipped++;
    }
  }

  console.log('\n[MIGRATION] ========== RÉSULTAT ==========');
  console.log(`[MIGRATION] ✓ ${migrated} partie(s) migrée(s)`);
  console.log(`[MIGRATION] ⚠️  ${skipped} partie(s) ignorée(s)`);
  console.log('[MIGRATION] ==========================================\n');

  // Créer une backup du fichier JSON
  const backupFile = SAVED_GAMES_FILE + '.backup';
  fs.copyFileSync(SAVED_GAMES_FILE, backupFile);
  console.log(`[MIGRATION] 📦 Backup créée : ${backupFile}`);
  
  console.log('[MIGRATION] ✅ Migration terminée avec succès !');
  console.log('[MIGRATION] Vous pouvez maintenant supprimer saved_games.json si tout fonctionne.');

} catch (error) {
  console.error('[MIGRATION] ❌ Erreur fatale :', error);
  process.exit(1);
}
