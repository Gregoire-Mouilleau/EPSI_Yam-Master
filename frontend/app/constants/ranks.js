// Système de rangs basé sur l'ELO
export const RANKS = [
  { key: 'iron', name: 'Fer', nameEn: 'Iron', minElo: 0, maxElo: 99, color: '#71716F', emoji: '⚙️' },
  { key: 'bronze', name: 'Bronze', nameEn: 'Bronze', minElo: 100, maxElo: 199, color: '#CD7F32', emoji: '🥉' },
  { key: 'silver', name: 'Silver', nameEn: 'Silver', minElo: 200, maxElo: 299, color: '#C0C0C0', emoji: '🥈' },
  { key: 'gold', name: 'Gold', nameEn: 'Gold', minElo: 300, maxElo: 399, color: '#FFD700', emoji: '🥇' },
  { key: 'emerald', name: 'Émeraude', nameEn: 'Emerald', minElo: 400, maxElo: 499, color: '#50C878', emoji: '💎' },
  { key: 'diamond', name: 'Diamant', nameEn: 'Diamond', minElo: 500, maxElo: 599, color: '#B9F2FF', emoji: '💠' },
  { key: 'master', name: 'Master', nameEn: 'Master', minElo: 600, maxElo: 9999, color: '#FF6B9D', emoji: '👑' },
];

/**
 * Obtient le rang d'un joueur en fonction de son ELO
 * @param {number} elo - L'ELO du joueur
 * @returns {Object} L'objet rang correspondant
 */
export function getRankFromElo(elo) {
  const rank = RANKS.find(r => elo >= r.minElo && elo <= r.maxElo);
  return rank || RANKS[0]; // Par défaut, retourne Fer si non trouvé
}

/**
 * Obtient le prochain rang
 * @param {number} elo - L'ELO actuel du joueur
 * @returns {Object|null} Le prochain rang ou null si déjà Master
 */
export function getNextRank(elo) {
  const currentRankIndex = RANKS.findIndex(r => elo >= r.minElo && elo <= r.maxElo);
  if (currentRankIndex === -1 || currentRankIndex === RANKS.length - 1) {
    return null; // Déjà Master
  }
  return RANKS[currentRankIndex + 1];
}

/**
 * Calcule la progression vers le prochain rang (0-100%)
 * @param {number} elo - L'ELO actuel du joueur
 * @returns {number} Pourcentage de progression (0-100)
 */
export function getProgressToNextRank(elo) {
  const currentRank = getRankFromElo(elo);
  const nextRank = getNextRank(elo);
  
  if (!nextRank) {
    return 100; // Master, déjà au max
  }
  
  const eloInCurrentRank = elo - currentRank.minElo;
  const eloNeededForNextRank = currentRank.maxElo - currentRank.minElo + 1;
  
  return Math.min(100, Math.round((eloInCurrentRank / eloNeededForNextRank) * 100));
}

/**
 * Obtient le nombre de points restants pour le prochain rang
 * @param {number} elo - L'ELO actuel du joueur
 * @returns {number} Points restants ou 0 si déjà Master
 */
export function getEloToNextRank(elo) {
  const nextRank = getNextRank(elo);
  if (!nextRank) return 0;
  
  return nextRank.minElo - elo;
}
