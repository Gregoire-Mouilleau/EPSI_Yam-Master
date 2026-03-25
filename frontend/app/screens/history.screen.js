import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Background from '../components/Background';
import FloatingDice from '../components/FloatingDice';
import { AuthContext } from '../contexts/auth.context';
import { LanguageContext } from '../contexts/language.context';
import { fetchHistory, fetchGameDetail } from '../services/history.service';
import GameReviewModal from '../components/board/game-review-modal.component';

export default function HistoryScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);

  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [reviewGame, setReviewGame] = useState(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadHistory();
    }
  }, [user, token]);

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');
    const result = await fetchHistory(user.id, token);
    setIsLoading(false);
    if (result.success) {
      setHistory(result.history);
    } else {
      setError(result.message || 'Erreur lors du chargement');
    }
  };

  const handleReview = async (gameId) => {
    setIsLoadingReview(true);
    const result = await fetchGameDetail(gameId, token);
    setIsLoadingReview(false);
    if (result.success) {
      setReviewGame(result.game);
    }
  };

  const getResultLabel = (game) => {
    if (!game.winner_id) return { label: 'ÉGALITÉ', style: styles.badgeDraw };
    if (game.winner_id === user.id) return { label: 'VICTOIRE', style: styles.badgeWin };
    return { label: 'DÉFAITE', style: styles.badgeLoss };
  };

  const getMyScore = (game) => {
    if (game.player1_id === user.id) return game.player1_score;
    return game.player2_score;
  };

  const getOpponentScore = (game) => {
    if (game.player1_id === user.id) return game.player2_score;
    return game.player1_score;
  };

  const getOpponentPseudo = (game) => {
    if (game.player1_id === user.id) return game.player2_pseudo || 'Bot';
    return game.player1_pseudo;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString(language === 'FR' ? 'fr-FR' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.root}>
      <Background />

      <View style={styles.diceLayer} pointerEvents="none">
        <FloatingDice />
      </View>

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>HISTORIQUE</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!user ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Connectez-vous pour voir votre historique.</Text>
          <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('ProfileScreen')}>
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryButtonText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Aucune partie jouée pour le moment.</Text>
          <Text style={styles.emptySubText}>Jouez votre première partie !</Text>
        </View>
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {history.map((game) => {
            const result = getResultLabel(game);
            return (
              <View key={game.id} style={styles.gameCard}>
                {/* Top row: badge + type */}
                <View style={styles.cardTopRow}>
                  <View style={[styles.badge, result.style]}>
                    <Text style={styles.badgeText}>{result.label}</Text>
                  </View>
                  <View style={styles.gameTypePill}>
                    <Text style={styles.gameTypeText}>
                      {game.game_type === 'bot' ? 'vs Bot' : 'En ligne'}
                    </Text>
                  </View>
                </View>

                {/* Players */}
                <View style={styles.playersRow}>
                  <Text style={styles.playerName}>{user.pseudo}</Text>
                  <View style={styles.scoreBlock}>
                    {game.end_reason === 'line-of-5' ? (
                      <Text style={styles.lineOf5Text}>Ligne de 5 !</Text>
                    ) : (
                      <>
                        <Text style={styles.score}>{getMyScore(game)}</Text>
                        <Text style={styles.scoreSep}> – </Text>
                        <Text style={styles.score}>{getOpponentScore(game)}</Text>
                      </>
                    )}
                  </View>
                  <Text style={styles.playerName}>{getOpponentPseudo(game)}</Text>
                </View>

                {/* Date */}
                <Text style={styles.dateText}>{formatDate(game.played_at)}</Text>

                {/* Review button */}
                <TouchableOpacity
                  style={styles.reviewButton}
                  onPress={() => handleReview(game.id)}
                  disabled={isLoadingReview}
                  activeOpacity={0.8}
                >
                  <Text style={styles.reviewButtonText}>
                    {isLoadingReview ? 'Chargement...' : 'Revoir la partie'}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </ScrollView>
      )}

      <GameReviewModal
        visible={!!reviewGame}
        game={reviewGame}
        player1Pseudo={user?.pseudo}
        onClose={() => setReviewGame(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#1A0500',
  },
  diceLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(201,168,76,0.3)',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  backButtonText: {
    color: '#C9A84C',
    fontSize: 15,
    fontWeight: '600',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#C9A84C',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
  },
  headerSpacer: { width: 70 },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#C9A84C',
    marginTop: 12,
    fontSize: 15,
  },
  errorText: {
    color: '#DC143C',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#D4B896',
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptySubText: {
    color: '#9B7B4A',
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#DC143C',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#DC143C',
    borderRadius: 10,
    paddingHorizontal: 28,
    paddingVertical: 10,
  },
  loginButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  gameCard: {
    backgroundColor: 'rgba(26,10,0,0.9)',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(201,168,76,0.4)',
    padding: 16,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeWin: { backgroundColor: '#1B5E20' },
  badgeLoss: { backgroundColor: '#7F0000' },
  badgeDraw: { backgroundColor: '#4A4A00' },
  badgeText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  gameTypePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: 'rgba(201,168,76,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.4)',
  },
  gameTypeText: {
    color: '#C9A84C',
    fontSize: 12,
    fontWeight: '600',
  },
  playersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    color: '#D4B896',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  score: {
    color: '#C9A84C',
    fontSize: 22,
    fontWeight: '800',
  },
  scoreSep: {
    color: '#9B7B4A',
    fontSize: 18,
    fontWeight: '400',
    marginHorizontal: 4,
  },
  lineOf5Text: {
    color: '#C9A84C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  dateText: {
    color: '#9B7B4A',
    fontSize: 12,
    textAlign: 'center',
  },
  reviewButton: {
    backgroundColor: 'rgba(220,20,60,0.85)',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
