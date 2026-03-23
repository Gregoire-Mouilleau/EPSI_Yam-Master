import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated, Image, ImageBackground } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocketContext } from '../contexts/socket.context';
import { AuthContext } from '../contexts/auth.context';
import { getAvatarSource } from '../constants/avatars';
import { getHomeTexts } from '../i18n';
import PlayerTimer from '../components/board/timers/player-timer.component';
import OpponentTimer from '../components/board/timers/opponent-timer.component';
import PlayerDeck from '../components/board/decks/player-deck.component';
import OpponentDeck from '../components/board/decks/opponent-deck.component';
import Grid from '../components/board/grid/grid.component';
import Choices from '../components/board/choices/choices.component';
import DiceRollingArea from '../components/board/decks/dice-rolling-area.component';
import GameEndModal from '../components/board/game-end-modal.component';
import DisconnectionModal from '../components/board/disconnection-modal.component';


export default function OnlineGameController({ navigation, language = 'FR', onGameStateChange }) {

    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const texts = getHomeTexts(language);

    const [gameResetKey, setGameResetKey] = useState(0);
    const [inQueue, setInQueue] = useState(false);
    const [inGame, setInGame] = useState(false);
    const [showGameBoard, setShowGameBoard] = useState(false);
    const [idOpponent, setIdOpponent] = useState(null);
    const [pseudoPlayer, setPseudoPlayer] = useState(null);
    const [pseudoOpponent, setPseudoOpponent] = useState(null);
    const [avatarKeyPlayer, setAvatarKeyPlayer] = useState(null);
    const [avatarKeyOpponent, setAvatarKeyOpponent] = useState(null);
    const [playerDices, setPlayerDices] = useState([]);
    const [opponentDices, setOpponentDices] = useState([]);
    const [isDiceRolling, setIsDiceRolling] = useState(false);
    const [isOpponentRolling, setIsOpponentRolling] = useState(false);
    const [displayRollButton, setDisplayRollButton] = useState(false);
    const [displayOpponentDeck, setDisplayOpponentDeck] = useState(false);
    
    // États pour la fin de partie
    const [gameEnded, setGameEnded] = useState(false);
    const [gameEndData, setGameEndData] = useState(null);
    
    // États pour le modal de déconnexion
    const [disconnectionModalVisible, setDisconnectionModalVisible] = useState(false);
    const [disconnectionStatus, setDisconnectionStatus] = useState('waiting'); // 'waiting', 'reconnected', 'forfeit'
    const [disconnectionWaitTime, setDisconnectionWaitTime] = useState(180);
    
    // Refs pour garder les valeurs des dés à jour dans le socket listener
    const playerDicesRef = React.useRef([]);
    const opponentDicesRef = React.useRef([]);
    const playerRollsCounterRef = React.useRef(0);
    const opponentRollsCounterRef = React.useRef(0);
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Afficher le plateau de jeu après 3 secondes quand inGame devient true
    useEffect(() => {
        if (inGame) {
            const timer = setTimeout(() => {
                setShowGameBoard(true);
                if (onGameStateChange) {
                    onGameStateChange(true);
                }
                // Attendre que les composants soient montés avant de demander les états
                setTimeout(() => {
                    socket.emit('game.refresh-board');
                }, 500);
            }, 3000);
            return () => clearTimeout(timer);
        } else {
            setShowGameBoard(false);
            if (onGameStateChange) {
                onGameStateChange(false);
            }
        }
    }, [inGame]);

    const handleDiceLock = (index) => {
        const dice = playerDices[index];
        if (dice && dice.value && displayRollButton) {
            socket.emit('game.dices.lock', dice.id);
        }
    };

    useEffect(() => {
        console.log('[emit][get.state]:', socket.id);
        socket.emit("get.state");
        
        // Tentative de reconnexion automatique
        const attemptReconnection = async () => {
            try {
                const previousSocketId = await AsyncStorage.getItem('onlineGameSocketId');
                if (previousSocketId && previousSocketId !== socket.id) {
                    console.log('[reconnect][attempt]:', previousSocketId, '→', socket.id);
                    socket.emit('game.reconnect', { previousSocketId });
                }
            } catch (error) {
                console.error('[reconnect][storage-error]:', error);
            }
        };
        
        attemptReconnection();
        
        console.log('[emit][queue.join]:', socket.id, user?.pseudo);
        socket.emit("queue.join", { pseudo: user?.pseudo });
        
        setInQueue(false);
        setInGame(false);

        socket.on('queue.added', (data) => {
            console.log('[listen][queue.added]:', data);
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
        });

        socket.on('queue.left', (data) => {
            console.log('[listen][queue.left]:', data);
        });

        socket.on('game.start', async (data) => {
            console.log('[listen][game.start]:', data);
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
            setIdOpponent(data['idOpponent']);
            setPseudoPlayer(data['pseudoPlayer']);
            setPseudoOpponent(data['pseudoOpponent']);
            setAvatarKeyPlayer(data['avatarKeyPlayer'] || 'avatar_1');
            setAvatarKeyOpponent(data['avatarKeyOpponent'] || 'avatar_1');
            
            // Sauvegarder le socket ID pour la reconnexion
            try {
                await AsyncStorage.setItem('onlineGameSocketId', socket.id);
                console.log('[storage][socket-id-saved]:', socket.id);
            } catch (error) {
                console.error('[storage][save-error]:', error);
            }
        });

        socket.on('opponent.disconnected', async (data) => {
            console.log('[listen][opponent.disconnected]:', data);
            // Nettoyer le socket ID stocké
            try {
                await AsyncStorage.removeItem('onlineGameSocketId');
            } catch (error) {
                console.error('[storage][remove-error]:', error);
            }
            setInQueue(false);
            setInGame(false);
            setShowGameBoard(false);
            setIdOpponent(null);
            if (onGameStateChange) {
                onGameStateChange(false);
            }
            navigation.navigate('HomeScreen');
        });

        socket.on('opponent.disconnected.waiting', (data) => {
            console.log('[listen][opponent.disconnected.waiting]:', data);
            setDisconnectionStatus('waiting');
            setDisconnectionWaitTime(data.waitTime || 180);
            setDisconnectionModalVisible(true);
        });

        socket.on('opponent.reconnected', (data) => {
            console.log('[listen][opponent.reconnected]:', data);
            setDisconnectionStatus('reconnected');
            setTimeout(() => {
                setDisconnectionModalVisible(false);
            }, 2000);
        });
        
        socket.on('game.reconnected', (data) => {
            console.log('[listen][game.reconnected]:', data);
            // La reconnexion a réussi, le modal va se fermer automatiquement
            console.log('[reconnect][success]');
        });
        
        socket.on('game.reconnect.error', async (data) => {
            console.log('[listen][game.reconnect.error]:', data);
            // Échec de reconnexion, nettoyer le socket ID
            try {
                await AsyncStorage.removeItem('onlineGameSocketId');
            } catch (error) {
                console.error('[storage][remove-error]:', error);
            }
        });

        socket.on('game.end', async (data) => {
            console.log('[listen][game.end]:', data);
            
            // Nettoyer le socket ID stocké
            try {
                await AsyncStorage.removeItem('onlineGameSocketId');
            } catch (error) {
                console.error('[storage][remove-error]:', error);
            }
            
            if (data.reason === 'disconnect') {
                setDisconnectionStatus('forfeit');
                setDisconnectionModalVisible(true);
                
                // Masquer le modal après 3 secondes et afficher l'écran de fin normal
                setTimeout(() => {
                    setDisconnectionModalVisible(false);
                    setGameEnded(true);
                    setGameEndData({
                        winner: data.winner,
                        reason: data.reason || 'normal',
                        message: data.message,
                        player1Score: data.player1Score,
                        player2Score: data.player2Score,
                        playerKey: data.playerKey
                    });
                }, 3000);
            } else {
                setGameEnded(true);
                setGameEndData({
                    winner: data.winner,
                    reason: data.reason || 'normal',
                    message: data.message,
                    player1Score: data.player1Score,
                    player2Score: data.player2Score,
                    playerKey: data.playerKey
                });
            }
        });

        socket.on('game.deck.view-state', (data) => {
            if (data['displayPlayerDeck'] && data['dices']) {
                const prevRollsCounter = playerRollsCounterRef.current;
                const newRollsCounter = data['rollsCounter'];
                
                // Détecter un changement de tour (rollsCounter redescend à 1)
                if (newRollsCounter === 1 && prevRollsCounter > 1) {
                    // Réinitialiser pour le nouveau tour
                    playerRollsCounterRef.current = 1;
                } else if (newRollsCounter > prevRollsCounter && prevRollsCounter > 0) {
                    // Un lancer a été effectué
                    setIsDiceRolling(true);
                    setTimeout(() => setIsDiceRolling(false), 2200);
                    playerRollsCounterRef.current = newRollsCounter;
                } else {
                    // Mise à jour simple
                    playerRollsCounterRef.current = newRollsCounter;
                }
                
                playerDicesRef.current = data['dices'];
                setPlayerDices(data['dices']);
                setDisplayRollButton(data['displayRollButton'] || false);
            }
            
            if (data['displayOpponentDeck'] && data['dices']) {
                const prevOppRollsCounter = opponentRollsCounterRef.current;
                const newOppRollsCounter = data['rollsCounter'];
                
                // Détecter un changement de tour (rollsCounter redescend à 1)
                if (newOppRollsCounter === 1 && prevOppRollsCounter > 1) {
                    // Réinitialiser pour le nouveau tour
                    opponentRollsCounterRef.current = 1;
                } else if (newOppRollsCounter > prevOppRollsCounter && prevOppRollsCounter > 0) {
                    // Un lancer a été effectué
                    setIsOpponentRolling(true);
                    setTimeout(() => setIsOpponentRolling(false), 2200);
                    opponentRollsCounterRef.current = newOppRollsCounter;
                } else {
                    // Mise à jour simple
                    opponentRollsCounterRef.current = newOppRollsCounter;
                }
                
                opponentDicesRef.current = data['dices'];
                setOpponentDices(data['dices']);
                setDisplayOpponentDeck(true);
            } else if (!data['displayOpponentDeck']) {
                setDisplayOpponentDeck(false);
            }
        });

        socket.on('game.ended', (data) => {
            console.log('[listen][game.ended]:', data);
            setGameEnded(true);
            setGameEndData(data);
        });

        return () => {
            console.log('[cleanup][queue.leave]:', socket.id);
            socket.emit("queue.leave");
            socket.off('queue.added');
            socket.off('queue.left');
            socket.off('game.start');
            socket.off('opponent.disconnected');
            socket.off('opponent.disconnected.waiting');
            socket.off('opponent.reconnected');
            socket.off('game.reconnected');
            socket.off('game.reconnect.error');
            socket.off('game.end');
            socket.off('game.deck.view-state');
            socket.off('game.ended');
            if (onGameStateChange) {
                onGameStateChange(false);
            }
        };
    }, [gameResetKey]);

    const handleLeaveQueue = () => {
        console.log('[emit][queue.leave]:', socket.id);
        socket.emit("queue.leave");
        setInQueue(false);
        setInGame(false);
        setShowGameBoard(false);
        if (onGameStateChange) {
            onGameStateChange(false);
        }
        navigation.navigate('HomeScreen');
    };

    // Si le plateau de jeu doit être affiché, on retourne une vue en plein écran
    if (inGame && showGameBoard) {
        return (
            <View key={`game-${gameResetKey}`} style={styles.gameContainer}>
                <View style={styles.gameBoard}>
                    {/* Zone de jeu principale (gauche) */}
                    <View style={styles.leftSection}>
                        <OpponentTimer key={`opponent-timer-${gameResetKey}`} />
                        <Grid key={`grid-${gameResetKey}`} />
                        <Choices key={`choices-${gameResetKey}`} />
                        <PlayerTimer key={`player-timer-${gameResetKey}`} />
                    </View>
                    
                    {/* Zone des dés (droite) */}
                    <View style={styles.rightSection}>
                        <View style={styles.topIndicatorContainer}>
                            <OpponentDeck key={`opponent-deck-${gameResetKey}`} displayOpponentDeck={displayOpponentDeck} />
                        </View>
                        <View style={styles.plateauContainer}>
                            <ImageBackground 
                                source={require('../../assets/plateau.png')} 
                                style={styles.diceRollingZone}
                                resizeMode="contain"
                            >
                                <DiceRollingArea 
                                    key={`dice-area-${gameResetKey}`}
                                    dices={displayOpponentDeck ? opponentDices : playerDices} 
                                    isRolling={displayOpponentDeck ? isOpponentRolling : isDiceRolling} 
                                    onDicePress={displayOpponentDeck ? null : handleDiceLock}
                                />
                            </ImageBackground>
                        </View>
                        <View style={styles.bottomButtonContainer}>
                            <PlayerDeck key={`player-deck-${gameResetKey}`} />
                        </View>
                    </View>
                </View>

                {/* Modal de fin de partie */}
                {gameEnded && gameEndData && (
                    <GameEndModal
                        visible={gameEnded}
                        winner={gameEndData.winner}
                        reason={gameEndData.reason}
                        player1Score={gameEndData.player1Score}
                        player2Score={gameEndData.player2Score}
                        playerKey={gameEndData.playerKey}
                        pseudoPlayer={pseudoPlayer}
                        pseudoOpponent={pseudoOpponent}
                        avatarKeyPlayer={avatarKeyPlayer}
                        avatarKeyOpponent={avatarKeyOpponent}
                        onClose={() => {
                            // Réinitialiser immédiatement les états de victoire pour masquer le modal
                            setGameEnded(false);
                            setGameEndData(null);
                            setInGame(false);
                            setShowGameBoard(false);
                            
                            if (onGameStateChange) {
                                onGameStateChange(false);
                            }
                            
                            // Quitter proprement
                            socket.emit("queue.leave");
                            
                            // Naviguer vers l'écran d'accueil puis revenir pour forcer un reset complet
                            navigation.navigate('HomeScreen');
                            
                            // Petit délai puis revenir à l'écran de jeu
                            setTimeout(() => {
                                navigation.navigate('OnlineGameScreen');
                            }, 100);
                        }}
                    />
                )}
                
                {/* Modal de déconnexion */}
                <DisconnectionModal
                    visible={disconnectionModalVisible}
                    status={disconnectionStatus}
                    waitTime={disconnectionWaitTime}
                />
            </View>
        );
    }

    // Sinon, affichage normal avec le container centré
    return (
        <View style={styles.container}>
            {!inQueue && !inGame && (
                <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.emoji}>⏳</Text>
                    <Text style={styles.title}>{texts.queueConnecting}</Text>
                    <Text style={styles.text}>{texts.queueConnectingDesc}</Text>
                    <ActivityIndicator size="large" color="#FDE047" style={{ marginTop: 20 }} />
                </Animated.View>
            )}

            {inQueue && (
                <Animated.View style={[styles.card, { transform: [{ scale: pulseAnim }] }]}>
                    <Text style={styles.emoji}>🔍</Text>
                    <Text style={styles.title}>{texts.queueSearching}</Text>
                    <Text style={styles.text}>{texts.queueSearchingDesc}</Text>
                    <ActivityIndicator size="large" color="#FDE047" style={{ marginTop: 20 }} />
                    
                    <TouchableOpacity
                        style={styles.leaveButton}
                        onPress={handleLeaveQueue}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.leaveButtonText}>{texts.queueLeave}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {inGame && !showGameBoard && (
                <View style={styles.card}>
                    <Text style={styles.emoji}>🎮</Text>
                    <Text style={styles.title}>{texts.queueMatchFound}</Text>
                    
                    <View style={styles.vsContainer}>
                        <View style={styles.playerCard}>
                            <Image 
                                source={getAvatarSource(avatarKeyPlayer || 'avatar_1')} 
                                style={styles.avatarImage}
                            />
                            <Text style={styles.playerName}>{pseudoPlayer}</Text>
                        </View>
                        
                        <Text style={styles.vsText}>VS</Text>
                        
                        <View style={styles.playerCard}>
                            <Image 
                                source={getAvatarSource(avatarKeyOpponent || 'avatar_1')} 
                                style={styles.avatarImage}
                            />
                            <Text style={styles.playerName}>{pseudoOpponent}</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.startingText}>{texts.queueStarting}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 20,
    },
    card: {
        backgroundColor: 'rgba(70, 11, 0, 0.76)',
        padding: 40,
        borderRadius: 34,
        borderWidth: 5,
        borderColor: '#D89A2E',
        alignItems: 'center',
        maxWidth: 500,
        width: '100%',
        shadowColor: '#FACC15',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.75,
        shadowRadius: 22,
        elevation: 10,
    },
    emoji: {
        fontSize: 60,
        marginBottom: 20,
        textShadowColor: 'rgba(250, 204, 21, 0.8)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FDE047',
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    text: {
        fontSize: 16,
        color: '#F6DEB2',
        textAlign: 'center',
        lineHeight: 24,
    },
    leaveButton: {
        marginTop: 30,
        backgroundColor: 'rgba(122, 23, 7, 0.98)',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 999,
        borderWidth: 2,
        borderColor: '#F9BC29',
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
    },
    leaveButtonText: {
        color: '#FDE047',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 0.4,
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 20,
        marginBottom: 20,
    },
    playerCard: {
        backgroundColor: 'rgba(123, 31, 15, 0.6)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#E1A02C',
        alignItems: 'center',
        minWidth: 120,
        shadowColor: '#FBBF24',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    avatarImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#D89A2E',
    },
    playerEmoji: {
        fontSize: 40,
        marginBottom: 10,
    },
    playerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FDE047',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    vsText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#DC2626',
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
        marginHorizontal: 10,
    },
    startingText: {
        fontSize: 18,
        color: '#A3E635',
        fontWeight: 'bold',
        marginTop: 10,
        textShadowColor: 'rgba(0, 0, 0, 0.6)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    gameContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        backgroundColor: '#2C1810',
    },
    gameBoard: {
        flex: 1,
        flexDirection: 'row',
        padding: 10,
    },
    leftSection: {
        flex: 3,
        justifyContent: 'space-between',
        paddingRight: 10,
    },
    rightSection: {
        flex: 2,
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 10,
    },
    topIndicatorContainer: {
        position: 'absolute',
        top: 10,
        zIndex: 10,
    },
    bottomButtonContainer: {
        position: 'absolute',
        bottom: 10,
        zIndex: 10,
    },
    plateauContainer: {
        width: '110%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    diceZoneTitle: {
        backgroundColor: '#5C4033',
        padding: 8,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: '#D4AF37',
    },
    diceZoneTitleText: {
        color: '#FFD700',
        fontSize: 14,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 1,
    },
    diceRollingZone: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    diceRollingZoneText: {
        fontSize: 60,
        opacity: 0.3,
    },
});
