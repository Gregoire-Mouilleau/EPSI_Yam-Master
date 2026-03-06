import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import Background from '../components/Background';
import { AuthContext } from '../contexts/auth.context';
import { LanguageContext } from '../contexts/language.context';
import { getAvatarSource } from '../constants/avatars';
import { getRankFromElo, RANKS } from '../constants/ranks';
import { getLeaderboardTexts } from '../i18n';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCALE_HEIGHT = 600;

const PAPER_SPECKLES = [
  { top: '7%', left: '9%', size: 3, opacity: 0.2 },
  { top: '11%', left: '44%', size: 2, opacity: 0.14 },
  { top: '15%', left: '77%', size: 4, opacity: 0.18 },
  { top: '19%', left: '27%', size: 2, opacity: 0.16 },
  { top: '24%', left: '63%', size: 3, opacity: 0.16 },
  { top: '31%', left: '84%', size: 2, opacity: 0.22 },
  { top: '37%', left: '14%', size: 3, opacity: 0.17 },
  { top: '42%', left: '52%', size: 2, opacity: 0.12 },
  { top: '48%', left: '71%', size: 3, opacity: 0.19 },
  { top: '54%', left: '36%', size: 2, opacity: 0.15 },
  { top: '61%', left: '88%', size: 4, opacity: 0.12 },
  { top: '67%', left: '16%', size: 2, opacity: 0.2 },
  { top: '73%', left: '58%', size: 3, opacity: 0.14 },
  { top: '79%', left: '41%', size: 2, opacity: 0.17 },
  { top: '86%', left: '75%', size: 3, opacity: 0.16 },
  { top: '90%', left: '23%', size: 2, opacity: 0.22 },
];

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

    console.log('=== ÉCHELLE ELO ===');
    console.log(`Max ELO pour l'échelle: ${maxEloForScale}`);
    console.log(`Joueur actuel: ${currentUser.pseudo} avec ${currentUser.elo} ELO → position: ${playerPosition}px`);
    console.log(`Meilleur joueur: ${topPlayer?.pseudo} avec ${topPlayer?.elo} ELO → position: ${topPlayerPosition}px`);

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
            console.log(`${rank.name} (${rank.minElo} ELO) → position: ${position}px from bottom`);

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
    <View style={styles.container}>
      <Background />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.frameGlow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.topBanner}>
            <Text style={styles.topBannerEmoji}>🏆</Text>
            <Text style={styles.topBannerTitle}>CLASSEMENT</Text>
          </View>

          <View style={styles.panel}>
            <View pointerEvents="none" style={styles.paperTextureLayer}>
              <View style={styles.paperWash} />
              {PAPER_SPECKLES.map((speckle, index) => (
                <View
                  key={`paper-speckle-${index}`}
                  style={[
                    styles.paperSpeckle,
                    {
                      top: speckle.top,
                      left: speckle.left,
                      width: speckle.size,
                      height: speckle.size,
                      opacity: speckle.opacity,
                    },
                  ]}
                />
              ))}
              <View style={[styles.paperStain, styles.paperStainTopLeft]} />
              <View style={[styles.paperStain, styles.paperStainTopRight]} />
              <View style={[styles.paperStain, styles.paperStainBottom]} />
              <View style={[styles.paperBurn, styles.paperBurnOne]} />
              <View style={[styles.paperBurn, styles.paperBurnTwo]} />
              <View style={[styles.paperFiber, styles.paperFiberOne]} />
              <View style={[styles.paperFiber, styles.paperFiberTwo]} />
              <View style={styles.paperInnerFrame} />
              <View style={styles.paperEdgeDarken} />
            </View>

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
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 16,
  },
  frameGlow: {
    width: '100%',
    maxWidth: 1100,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: '#D89A2E',
    backgroundColor: 'rgba(70, 11, 0, 0.76)',
    paddingHorizontal: 12,
    paddingTop: 72,
    paddingBottom: 16,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(122, 23, 7, 0.98)',
    borderColor: '#F9BC29',
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 17,
    zIndex: 40,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  backButtonText: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.4,
  },
  topBanner: {
    position: 'absolute',
    top: -28,
    left: 16,
    right: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B1F0F',
    borderWidth: 3,
    borderColor: '#E1A02C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  topBannerEmoji: {
    fontSize: 30,
  },
  topBannerTitle: {
    color: '#FDE047',
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  panel: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#EFD2A0',
    borderWidth: 3.4,
    borderColor: '#D69832',
    paddingHorizontal: 12,
    paddingVertical: 16,
    minHeight: 700,
  },
  paperTextureLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  paperWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 240, 205, 0.52)',
  },
  paperSpeckle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#7A4B1D',
  },
  paperStain: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(128, 75, 24, 0.16)',
  },
  paperStainTopLeft: {
    width: 220,
    height: 110,
    top: -18,
    left: -28,
    transform: [{ rotate: '-12deg' }],
  },
  paperStainTopRight: {
    width: 170,
    height: 90,
    top: 48,
    right: -42,
    opacity: 0.7,
    transform: [{ rotate: '18deg' }],
  },
  paperStainBottom: {
    width: 280,
    height: 120,
    bottom: -44,
    left: 40,
    opacity: 0.6,
    transform: [{ rotate: '6deg' }],
  },
  paperBurn: {
    position: 'absolute',
    backgroundColor: 'rgba(92, 44, 12, 0.12)',
    borderRadius: 999,
  },
  paperBurnOne: {
    width: 100,
    height: 38,
    top: 96,
    right: 56,
    transform: [{ rotate: '-25deg' }],
  },
  paperBurnTwo: {
    width: 130,
    height: 44,
    bottom: 84,
    left: -16,
    transform: [{ rotate: '22deg' }],
  },
  paperFiber: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'rgba(145, 82, 34, 0.2)',
  },
  paperFiberOne: {
    width: '85%',
    height: 2,
    top: '30%',
    left: '8%',
  },
  paperFiberTwo: {
    width: '72%',
    height: 2,
    top: '64%',
    right: '6%',
    opacity: 0.85,
  },
  paperInnerFrame: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 71, 26, 0.26)',
    borderRadius: 14,
  },
  paperEdgeDarken: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 11,
    borderColor: 'rgba(95, 49, 13, 0.15)',
    borderRadius: 18,
  },
  loading: {
    paddingVertical: 40,
    zIndex: 10,
  },
  errorContainer: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    zIndex: 10,
  },
  errorText: {
    color: '#7B1F0F',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#7B1F0F',
    borderColor: '#E1A02C',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  retryButtonText: {
    color: '#FDE047',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mainContent: {
    flexDirection: 'row',
    gap: 16,
    zIndex: 10,
    minHeight: 550,
  },
  leftSection: {
    flex: 1.2,
    minWidth: 420,
  },
  rightSection: {
    flex: 1,
    minWidth: 380,
  },
  sectionHeader: {
    backgroundColor: '#6D2110',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D59A34',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#FDE047',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  scaleContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 10,
    flex: 1,
  },
  scaleContent: {
    width: 380,
    height: SCALE_HEIGHT,
    position: 'relative',
    paddingLeft: 180,
    paddingRight: 180,
    justifyContent: 'flex-end', // Aligner vers le bas pour s'assurer que bottom: 0 fonctionne
  },
  scaleVerticalLine: {
    position: 'absolute',
    left: '50%',
    marginLeft: -2,
    bottom: 0, // Commence en bas
    width: 4,
    height: SCALE_HEIGHT,
    backgroundColor: '#8B4513',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  rankSegment: {
    position: 'absolute',
    left: '50%',
    marginLeft: -15,
    width: 30,
    borderWidth: 1,
    borderRadius: 15,
    opacity: 0.8,
  },
  rankPoint: {
    position: 'absolute',
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 16,
    zIndex: 5,
  },
  rankDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#5A2C0D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  rankLabelContainer: {
    position: 'absolute',
    left: 24,
    top: -10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFD2A0',
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    minWidth: 140,
    justifyContent: 'space-between',
  },
  rankLabelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rankEmoji: {
    fontSize: 18,
  },
  rankNameText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  rankEloText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#5A2C0D',
    marginLeft: 10,
  },
  topPlayerConnector: {
    position: 'absolute',
    height: 3,
    backgroundColor: '#FFA500',
    zIndex: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  topPlayerMarker: {
    position: 'absolute',
    right: -190,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFA500',
    paddingVertical: 10,
    paddingHorizontal: 12,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 12,
    zIndex: 10,
    minWidth: 160,
  },
  crownBadge: {
    position: 'absolute',
    top: -16,
    left: 6,
    zIndex: 5,
  },
  crownEmoji: {
    fontSize: 28,
  },
  topPlayerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  topPlayerInfo: {
    flex: 1,
  },
  topPlayerPseudo: {
    color: '#7B1F0F',
    fontSize: 15,
    fontWeight: 'bold',
  },
  topPlayerElo: {
    color: '#8B4513',
    fontSize: 14,
    fontWeight: 'bold',
  },
  currentPlayerArrowLine: {
    position: 'absolute',
    left: 162,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#6D2110',
    borderRightColor: 'transparent',
    zIndex: 9,
  },
  currentPlayerMarker: {
    position: 'absolute',
    left: 85,
    backgroundColor: '#6D2110',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#D89A2E',
    paddingVertical: 6,
    paddingHorizontal: 10,
    zIndex: 10,
    shadowColor: '#D89A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  currentPlayerPseudo: {
    color: '#FDE047',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  topPlayersContainer: {
    flex: 1,
  },
  topPlayersList: {
    maxHeight: SCALE_HEIGHT + 40,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(113, 28, 11, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(213, 154, 52, 0.4)',
  },
  playerItemHighlight: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#D59A34',
    borderWidth: 3,
  },
  playerPosition: {
    width: 40,
    alignItems: 'center',
  },
  playerPositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  playerItemAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#D59A34',
    marginRight: 10,
  },
  playerItemInfo: {
    flex: 1,
  },
  playerItemPseudo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#5A2C0D',
    marginBottom: 2,
  },
  playerItemRank: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerItemRankEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  playerItemRankText: {
    fontSize: 13,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  playerItemElo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7B1F0F',
    marginLeft: 8,
  },
});
