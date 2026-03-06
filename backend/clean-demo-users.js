const db = require('./db');

// Supprimer les utilisateurs de démonstration
console.log('🧹 Nettoyage des utilisateurs de démonstration...');

const deleteStmt = db.prepare(`
  DELETE FROM users 
  WHERE pseudo LIKE 'demo_user_%'
`);

const result = deleteStmt.run();

console.log(`✅ ${result.changes} utilisateur(s) de démonstration supprimé(s)`);

// Afficher les utilisateurs restants
const remainingUsers = db.prepare('SELECT id, pseudo, elo FROM users ORDER BY elo DESC').all();

console.log('\n📋 Utilisateurs restants :');
if (remainingUsers.length === 0) {
  console.log('   Aucun utilisateur');
} else {
  remainingUsers.forEach(user => {
    console.log(`   - ${user.pseudo} (ELO: ${user.elo})`);
  });
}

process.exit(0);
