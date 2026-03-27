import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    gap: 0,
  },
  rowCols: {
    gap: 0,
  },
  rowColsTwoCol: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
  },
  col: {
    gap: 0,
    flex: 1,
    flexDirection: 'column',
  },
  colLeft: {
    flex: 1.05,
  },
  colRight: {
    flex: 0.95,
  },

  // ── Blocs numérotés (identique au profil) ──────────────────────────────────
  ruleBlock: {
    backgroundColor: 'rgba(246, 222, 178, 0.95)',
    borderWidth: 2,
    borderColor: '#CE903A',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
    marginBottom: 8,
  },
  ruleBlockFlex: {
    flex: 1,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ruleNumber: {
    width: 28,
    height: 28,
    lineHeight: 24,
    borderRadius: 8,
    backgroundColor: '#B91C1C',
    borderWidth: 2,
    borderColor: '#F59E0B',
    textAlign: 'center',
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 18,
  },
  sectionTitle: {
    color: '#5B2100',
    fontWeight: 'bold',
    fontSize: 18,
  },

  // ── Texte courant ───────────────────────────────────────────────────────────
  bodyText: {
    color: '#5B2100',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  highlight: {
    color: '#7C1D0B',
    fontWeight: 'bold',
  },

  // ── Étapes numérotées ───────────────────────────────────────────────────────
  stepList: {
    gap: 10,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepBullet: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#8E1E13',
    borderWidth: 2,
    borderColor: '#E4A12F',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  stepBulletText: {
    color: '#FDE047',
    fontSize: 13,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    color: '#5B2100',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  // ── Grille des combinaisons ─────────────────────────────────────────────────
  combosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  comboCard: {
    minWidth: 72,
    flex: 1,
    backgroundColor: '#6D2110',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D59A34',
    paddingVertical: 7,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  comboEmoji: {
    fontSize: 18,
  },
  comboLabel: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 12,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  comboDesc: {
    color: '#EFD2A0',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
    opacity: 0.9,
  },

  // ── Cartes modes spéciaux ───────────────────────────────────────────────────
  specialCard: {
    backgroundColor: 'rgba(110, 33, 16, 0.12)',
    borderWidth: 2,
    borderColor: '#D59A34',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  specialCardDefi: {
    backgroundColor: 'rgba(76, 29, 149, 0.08)',
    borderColor: '#A78BFA',
  },
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  specialEmoji: {
    fontSize: 22,
  },
  specialTitle: {
    color: '#5B2100',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.5,
  },

  // ── Score cards ─────────────────────────────────────────────────────────────
  scoreRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#6D2110',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D59A34',
    paddingVertical: 8,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  scoreEmoji: {
    fontSize: 15,
    letterSpacing: -2,
  },
  scoreValue: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 18,
  },
  scoreLabel: {
    color: '#EFD2A0',
    fontSize: 11,
    opacity: 0.9,
  },
  scoreDetail: {
    color: '#D59A34',
    fontSize: 10,
    opacity: 0.8,
    letterSpacing: 1,
  },
  scoreCardSpecial: {
    borderColor: '#F59E0B',
    backgroundColor: '#8B1A00',
  },

  // Victory conditions
  victoryList: {
    gap: 6,
  },
  victoryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#6D2110',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D59A34',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  victoryEmoji: {
    fontSize: 22,
    marginTop: 1,
  },
  victoryTexts: {
    flex: 1,
    gap: 2,
  },
  victoryTitle: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  victoryDesc: {
    color: '#EFD2A0',
    fontSize: 12,
    lineHeight: 17,
    opacity: 0.92,
  },
});

export default styles;
