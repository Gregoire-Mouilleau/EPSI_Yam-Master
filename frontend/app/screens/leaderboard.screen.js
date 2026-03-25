import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import styles, { SCALE_HEIGHT } from './leaderboard.styles';
import FramedPage from '../components/FramedPage';
import { AuthContext } from '../contexts/auth.context';
import { LanguageContext } from '../contexts/language.context';
import { getAvatarSource } from '../constants/avatars';
import { getRankFromElo, RANKS } from '../constants/ranks';
import { getLeaderboardTexts } from '../i18n';

export default function LeaderboardScreen({ navigation }) {
  const { getLeaderboard, user } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const texts = getLeaderboardTexts(language);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');
    const result = await getLeaderboard();
    setIsLoading(false);

    if (!result.success) {
      setError(result.message || 'Erreur lors du chargement du classement');
      return;
    }

    setLeaderboardData(result);
  };

  const renderMedal = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const renderEloScale = () => {
    if (!leaderboardData || !user) return null;

    const { currentUser, topPlayers } = leaderboardData;
    const topPlayer = topPlayers[0];
    
    // Utiliser une échelle fixe jusqu'à Master (600) ou plus si nécessaire
    const maxEloForScale = Math.max(
      600, // Master minimum
      topPlayer?.elo || 0,
      currentUser.elo
    );

    // Position du joueur sur l'échelle (de 0 en bas à SCALE_HEIGHT en haut)
    const playerPosition = (currentUser.elo / maxEloForScale) * SCALE_HEIGHT;
    const topPlayerPosition = topPlayer ? (topPlayer.elo / maxEloForScale) * SCALE_HEIGHT : 0;


    return (
      <View style={styles.scaleContainer}>
        <View style={styles.scaleContent}>
          {/* Ligne verticale centrale */}
          <View style={styles.scaleVerticalLine} />

          {/* Marqueurs de rangs sur l'échelle */}
          {RANKS.map((rank, index) => {
            // Position calculée : 0 ELO = bottom: 0 (en bas), maxElo = bottom: SCALE_HEIGHT (en haut)
            const position = (rank.minElo / maxEloForScale) * SCALE_HEIGHT;
            const nextRank = RANKS[index + 1];
            const segmentHeight = nextRank 
              ? ((nextRank.minElo - rank.minElo) / maxEloForScale) * SCALE_HEIGHT
              : ((maxEloForScale - rank.minElo) / maxEloForScale) * SCALE_HEIGHT;

            // Debug: afficher les positions

            return (
              <View key={rank.key}>
                {/* Segment coloré entre rangs */}
                <View
                  style={[
                    styles.rankSegment,
                    {
                      bottom: position,
                      height: segmentHeight,
                      backgroundColor: `${rank.color}20`,
                      borderColor: `${rank.color}80`,
                    },
                  ]}
                />

                {/* Point et label du rang */}
                <View style={[styles.rankPoint, { bottom: position - 8 }]}>
                  <View style={[styles.rankDot, { backgroundColor: rank.color }]} />
                  
                  <View style={styles.rankLabelContainer}>
                    <View style={styles.rankLabelLeft}>
                      <Text style={styles.rankEmoji}>{rank.emoji}</Text>
                      <Text style={[styles.rankNameText, { color: rank.color }]}>
                        {rank.name}
                      </Text>
                    </View>
                    <Text style={styles.rankEloText}>{rank.minElo}</Text>
                  </View>
                </View>
              </View>
            );
          })}



          {/* Joueur actuel sur l'échelle */}
          <View style={[styles.currentPlayerArrowLine, { bottom: -8 }]} />
          <View style={[styles.currentPlayerMarker, { bottom: -15 }]}>
            <Text style={styles.currentPlayerPseudo}>{currentUser.pseudo}</Text>
          </View>


        </View>
      </View>
    );
  };

  const renderTopPlayers = () => {
    if (!leaderboardData) return null;

    const { topPlayers } = leaderboardData;

    return (
      <View style={styles.topPlayersContainer}>
        <ScrollView style={styles.topPlayersList} showsVerticalScrollIndicator={false}>
          {topPlayers.slice(0, 10).map((player, index) => {
            const rank = getRankFromElo(player.elo);
            const isCurrentUser = user && player.id === user.id;

            return (
              <View
                key={player.id}
                style={[
                  styles.playerItem,
                  isCurrentUser && styles.playerItemHighlight,
                ]}
              >
                <View style={styles.playerPosition}>
                  <Text style={styles.playerPositionText}>{renderMedal(index + 1)}</Text>
                </View>

                <Image source={getAvatarSource(player.avatarKey)} style={styles.playerItemAvatar} />

                <View style={styles.playerItemInfo}>
                  <Text style={styles.playerItemPseudo}>{player.pseudo}</Text>
                  <View style={styles.playerItemRank}>
                    <Text style={styles.playerItemRankEmoji}>{rank.emoji}</Text>
                    <Text style={styles.playerItemRankText}>{rank.name}</Text>
                  </View>
                </View>

                <Text style={styles.playerItemElo}>{player.elo}</Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <FramedPage navigation={navigation} emoji="🏆" title="CLASSEMENT" maxWidth={1100} panelStyle={{ minHeight: 700 }}>
      {isLoading ? (
        <ActivityIndicator size="large" color="#8B4513" style={styles.loading} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLeaderboard}>
            <Text style={styles.retryButtonText}>{texts.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.mainContent}>
          <View style={styles.leftSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎯 Échelle ELO</Text>
            </View>
            {renderEloScale()}
          </View>

          <View style={styles.rightSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>👑 Top 10</Text>
            </View>
            {renderTopPlayers()}
          </View>
        </View>
      )}
    </FramedPage>
  );
}

