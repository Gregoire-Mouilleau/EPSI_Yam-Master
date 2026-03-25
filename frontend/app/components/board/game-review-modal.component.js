import React, { useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import FloatingDice from '../FloatingDice';

const GRID_INIT = [
  [
    { viewContent: '1', id: 'brelan1' },
    { viewContent: '3', id: 'brelan3' },
    { viewContent: 'Défi', id: 'defi' },
    { viewContent: '4', id: 'brelan4' },
    { viewContent: '6', id: 'brelan6' },
  ],
  [
    { viewContent: '2', id: 'brelan2' },
    { viewContent: 'Carré', id: 'carre' },
    { viewContent: 'Sec', id: 'sec' },
    { viewContent: 'Full', id: 'full' },
    { viewContent: '5', id: 'brelan5' },
  ],
  [
    { viewContent: '≤8', id: 'moinshuit' },
    { viewContent: 'Full', id: 'full' },
    { viewContent: 'Yam', id: 'yam' },
    { viewContent: 'Défi', id: 'defi' },
    { viewContent: 'Suite', id: 'suite' },
  ],
  [
    { viewContent: '6', id: 'brelan6' },
    { viewContent: 'Sec', id: 'sec' },
    { viewContent: 'Suite', id: 'suite' },
    { viewContent: '≤8', id: 'moinshuit' },
    { viewContent: '1', id: 'brelan1' },
  ],
  [
    { viewContent: '3', id: 'brelan3' },
    { viewContent: '2', id: 'brelan2' },
    { viewContent: 'Carré', id: 'carre' },
    { viewContent: '5', id: 'brelan5' },
    { viewContent: '4', id: 'brelan4' },
  ],
];

function buildGridAtStep(moves, stepIndex) {
  const grid = GRID_INIT.map(row =>
    row.map(cell => ({ ...cell, owner: null }))
  );
  for (let i = 0; i <= stepIndex && i < moves.length; i++) {
    const move = moves[i];
    if (
      move.rowIndex !== undefined &&
      move.cellIndex !== undefined &&
      grid[move.rowIndex] &&
      grid[move.rowIndex][move.cellIndex]
    ) {
      grid[move.rowIndex][move.cellIndex] = {
        ...grid[move.rowIndex][move.cellIndex],
        owner: move.player,
        isLastMove: i === stepIndex,
      };
    }
  }
  return grid;
}

export default function GameReviewModal({ visible, game, player1Pseudo, onClose }) {
  const [stepIndex, setStepIndex] = useState(0);

  const moves = useMemo(() => (game?.moves || []), [game]);
  const totalSteps = moves.length;

  const grid = useMemo(
    () => (totalSteps > 0 ? buildGridAtStep(moves, stepIndex) : null),
    [moves, stepIndex]
  );

  const currentMove = moves[stepIndex];

  const handlePrev = () => setStepIndex(i => Math.max(0, i - 1));
  const handleNext = () => setStepIndex(i => Math.min(totalSteps - 1, i + 1));

  React.useEffect(() => {
    if (visible) setStepIndex(0);
  }, [visible]);

  if (!game) return null;

  const player2Pseudo = game.player2_pseudo || 'Bot';
  const isPlayer1Turn = currentMove?.player === 'player:1';
  const moverPseudo = isPlayer1Turn ? player1Pseudo : player2Pseudo;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.diceLayer} pointerEvents="none">
          {Platform.OS === 'web' ? <FloatingDice /> : <FloatingDice />}
        </View>

        <View style={styles.bgPattern} pointerEvents="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternDot,
                {
                  top: `${5 + (i * 4.7) % 90}%`,
                  left: `${(i * 17 + 11) % 95}%`,
                  opacity: 0.04 + (i % 4) * 0.02,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>REPLAY</Text>
          <Text style={styles.subtitle}>
            {player1Pseudo} vs {player2Pseudo}
          </Text>

          {totalSteps === 0 ? (
            <View style={styles.noMovesContainer}>
              <Text style={styles.noMovesText}>
                Aucun coup enregistré pour cette partie.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.stepRow}>
                <Text style={styles.stepText}>
                  Coup {stepIndex + 1} / {totalSteps}
                </Text>
              </View>

              {currentMove && (
                <View style={styles.moveInfo}>
                  <View style={[
                    styles.playerBadge,
                    isPlayer1Turn ? styles.player1Badge : styles.player2Badge,
                  ]}>
                    <Text style={styles.playerBadgeText}>{moverPseudo}</Text>
                  </View>
                  <Text style={styles.moveCellText}>
                    Case : <Text style={styles.moveCellHighlight}>{currentMove.cellId}</Text>
                  </Text>
                  {currentMove.diceValues && currentMove.diceValues.length > 0 && (
                    <View style={styles.dicesRow}>
                      {currentMove.diceValues.map((val, idx) => (
                        <View key={idx} style={styles.diceChip}>
                          <Text style={styles.diceChipText}>{val}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {grid && (
                <View style={styles.gridWrapper}>
                  {grid.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.gridRow}>
                      {row.map((cell, cellIndex) => (
                        <View
                          key={cellIndex}
                          style={[
                            styles.cell,
                            rowIndex !== 0 && styles.topBorder,
                            cellIndex !== 0 && styles.leftBorder,
                            cell.isLastMove && styles.lastMoveCell,
                          ]}
                        >
                          <Text style={styles.cellText}>{cell.viewContent}</Text>
                          {cell.owner === 'player:1' && (
                            <Image
                              source={require('../../../assets/jeton_vert.png')}
                              style={styles.token}
                              resizeMode="contain"
                            />
                          )}
                          {cell.owner === 'player:2' && (
                            <Image
                              source={require('../../../assets/jeton_rouge.png')}
                              style={styles.token}
                              resizeMode="contain"
                            />
                          )}
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.navRow}>
                <TouchableOpacity
                  style={[styles.navButton, stepIndex === 0 && styles.navButtonDisabled]}
                  onPress={handlePrev}
                  disabled={stepIndex === 0}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonText}>◀ Précédent</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, stepIndex === totalSteps - 1 && styles.navButtonDisabled]}
                  onPress={handleNext}
                  disabled={stepIndex === totalSteps - 1}
                  activeOpacity={0.7}
                >
                  <Text style={styles.navButtonText}>Suivant ▶</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeButtonText}>Fermer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  patternDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC143C',
  },
  card: {
    backgroundColor: '#1A0A0A',
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#C9A84C',
    padding: 20,
    width: '92%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
  },
  title: {
    color: '#C9A84C',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 4,
  },
  subtitle: {
    color: '#9B7B4A',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 14,
  },
  noMovesContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  noMovesText: {
    color: '#AAA',
    fontSize: 14,
    textAlign: 'center',
  },
  stepRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  stepText: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '700',
  },
  moveInfo: {
    backgroundColor: 'rgba(220,20,60,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    gap: 6,
  },
  playerBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  player1Badge: { backgroundColor: '#2E7D32' },
  player2Badge: { backgroundColor: '#DC143C' },
  playerBadgeText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  moveCellText: {
    color: '#DDD',
    fontSize: 13,
  },
  moveCellHighlight: {
    color: '#C9A84C',
    fontWeight: '700',
  },
  dicesRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  diceChip: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(201,168,76,0.2)',
    borderWidth: 1,
    borderColor: '#C9A84C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceChipText: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '700',
  },
  gridWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#8B6F47',
    marginBottom: 14,
  },
  gridRow: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#3D2817',
    borderWidth: 1,
    borderColor: '#8B6F47',
    minHeight: 44,
    position: 'relative',
  },
  topBorder: { borderTopWidth: 1 },
  leftBorder: { borderLeftWidth: 1 },
  lastMoveCell: {
    backgroundColor: 'rgba(201,168,76,0.18)',
    borderColor: '#C9A84C',
    borderWidth: 2,
  },
  cellText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F6DEB2',
    zIndex: 1,
  },
  token: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    zIndex: 2,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  navButton: {
    flex: 1,
    backgroundColor: '#DC143C',
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  navButtonDisabled: {
    backgroundColor: 'rgba(220,20,60,0.3)',
  },
  navButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  closeButton: {
    borderWidth: 1.5,
    borderColor: '#C9A84C',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#C9A84C',
    fontWeight: '700',
    fontSize: 14,
  },
});
