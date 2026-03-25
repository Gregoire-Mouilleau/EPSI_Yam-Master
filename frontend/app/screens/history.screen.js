import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import styles from './history.styles';
import Background from '../components/Background';
import FloatingDice from '../components/FloatingDice';
import { AuthContext } from '../contexts/auth.context';
import { useLanguage } from '../contexts/language.context';
import { fetchHistory, fetchGameDetail } from '../services/history.service';
import GameReviewModal from '../components/board/game-review-modal.component';

export default function HistoryScreen({ navigation }) {
  const { user, token } = useContext(AuthContext);
  const { language, t } = useLanguage();

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
      setError(result.message || t('historyLoadError'));
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
    if (!game.winner_id) return { label: t('historyDraw'), style: styles.badgeDraw };
    if (game.winner_id === user.id) return { label: t('historyWin'), style: styles.badgeWin };
    return { label: t('historyLoss'), style: styles.badgeLoss };
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
          <Text style={styles.backButtonText}>{t('historyBack')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('history')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {!user ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('historyNotLoggedIn')}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => navigation.navigate('ProfileScreen')}>
            <Text style={styles.retryButtonText}>{t('historyLoginBtn')}</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C9A84C" />
          <Text style={styles.loadingText}>{t('leaderboardLoading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadHistory}>
            <Text style={styles.retryButtonText}>{t('leaderboardRetry')}</Text>
          </TouchableOpacity>
        </View>
      ) : history.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{t('historyEmpty')}</Text>
          <Text style={styles.emptySubText}>{t('historyEmptySub')}</Text>
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
                      {game.game_type === 'bot' ? t('historyVsBot') : t('historyOnline')}
                    </Text>
                  </View>
                </View>

                {/* Players */}
                <View style={styles.playersRow}>
                  <Text style={styles.playerName}>{user.pseudo}</Text>
                  <View style={styles.scoreBlock}>
                    {game.end_reason === 'line-of-5' ? (
                      <Text style={styles.lineOf5Text}>{t('historyLineOf5')}</Text>
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
                    {isLoadingReview ? t('historyReviewLoading') : t('historyReview')}
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
