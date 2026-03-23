import React, { useEffect, useState, useContext } from "react";
import { StyleSheet, Text, View, TouchableOpacity, ActivityIndicator, Animated, Image, ImageBackground } from "react-native";
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
import ResumeGameModal from '../components/board/resume-game-modal.component';


export default function VsBotGameController({ navigation, language = 'FR', onGameStateChange }) {

    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const texts = getHomeTexts(language);

    const [gameResetKey, setGameResetKey] = useState(0);
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
    
    // États pour le modal de reprise
    const [resumeModalVisible, setResumeModalVisible] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [resumeError, setResumeError] = useState(null);
    
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
        
        console.log('[emit][vsbot.start]:', socket.id, user?.pseudo);
        socket.emit("vsbot.start", { pseudo: user?.pseudo });
        
        setInGame(false);

        socket.on('vsbot.resume.available', (data) => {
            console.log('[listen][vsbot.resume.available]:', data);
            setResumeData(data);
            setResumeError(null);
            setResumeModalVisible(true);
        });

        socket.on('vsbot.resume.error', (data) => {
            console.log('[listen][vsbot.resume.error]:', data);
            setResumeData(null);
            setResumeError(data.message || 'Erreur lors de la reprise de la partie');
            setResumeModalVisible(true);
        });

        socket.on('game.start', (data) => {
            console.log('[listen][game.start]:', data);
            setInGame(data['inGame']);
            setIdOpponent(data['idOpponent']);
            setPseudoPlayer(data['pseudoPlayer']);
            setPseudoOpponent(data['pseudoOpponent']);
            setAvatarKeyPlayer(data['avatarKeyPlayer'] || 'avatar_1');
            setAvatarKeyOpponent(data['avatarKeyOpponent'] || 'avatar_6');
        });

        socket.on('game.deck.view-state', (data) => {
            if (data['displayPlayerDeck'] && data['dices']) {
                const prevRollsCounter = playerRollsCounterRef.current;
                const newRollsCounter = data['rollsCounter'];
                
                // Détecter un changement de tour (rollsCounter redescend à 1)
                if (newRollsCounter === 1 && prevRollsCounter > 1) {
                    playerRollsCounterRef.current = 1;
                } else if (newRollsCounter > prevRollsCounter && prevRollsCounter > 0) {
                    // Un lancer a été effectué
                    setIsDiceRolling(true);
                    setTimeout(() => setIsDiceRolling(false), 2200);
                    playerRollsCounterRef.current = newRollsCounter;
                } else {
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
                    opponentRollsCounterRef.current = 1;
                } else if (newOppRollsCounter > prevOppRollsCounter && prevOppRollsCounter > 0) {
                    // Un lancer a été effectué
                    setIsOpponentRolling(true);
                    setTimeout(() => setIsOpponentRolling(false), 2200);
                    opponentRollsCounterRef.current = newOppRollsCounter;
                } else {
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
            console.log('[cleanup] Leaving vsbot game');
            socket.off('vsbot.resume.available');
            socket.off('vsbot.resume.error');
            socket.off('game.start');
            socket.off('game.deck.view-state');
            socket.off('game.ended');
            if (onGameStateChange) {
                onGameStateChange(false);
            }
        };
    }, [gameResetKey]);

    const handleLeaveGame = () => {
        setInGame(false);
        setShowGameBoard(false);
        if (onGameStateChange) {
            onGameStateChange(false);
        }
        navigation.navigate('HomeScreen');
    };

    // Si on n'est pas encore en jeu, afficher loading
    if (!inGame || !showGameBoard) {
        return (
            <View style={styles.waitingContainer}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={styles.waitingText}>Démarrage de la partie contre le Bot...</Text>
                
                {/* Modal de reprise de partie */}
                <ResumeGameModal
                    visible={resumeModalVisible}
                    savedAt={resumeData?.savedAt}
                    currentTurn={resumeData?.currentTurn}
                    errorMessage={resumeError}
                    onResume={() => {
                        console.log('[emit][vsbot.resume]:', user?.pseudo);
                        socket.emit('vsbot.resume', { pseudo: user?.pseudo });
                        setResumeModalVisible(false);
                    }}
                    onNewGame={() => {
                        console.log('[emit][vsbot.new]:', user?.pseudo);
                        socket.emit('vsbot.new', { pseudo: user?.pseudo });
                        setResumeModalVisible(false);
                    }}
                />
            </View>
        );
    }

    // Si le plateau de jeu doit être affiché
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
                        setGameEnded(false);
                        setGameEndData(null);
                        setInGame(false);
                        setShowGameBoard(false);
                        
                        if (onGameStateChange) {
                            onGameStateChange(false);
                        }
                        
                        // Naviguer vers l'écran d'accueil puis revenir pour forcer un reset complet
                        navigation.navigate('HomeScreen');
                        
                        // Petit délai puis revenir à l'écran de jeu vs bot
                        setTimeout(() => {
                            navigation.navigate('VsBotGameScreen');
                        }, 100);
                    }}
                />
            )}
            
            {/* Modal de reprise de partie */}
            <ResumeGameModal
                visible={resumeModalVisible}
                savedAt={resumeData?.savedAt}
                currentTurn={resumeData?.currentTurn}
                errorMessage={resumeError}
                onResume={() => {
                    console.log('[emit][vsbot.resume]:', user?.pseudo);
                    socket.emit('vsbot.resume', { pseudo: user?.pseudo });
                    setResumeModalVisible(false);
                }}
                onNewGame={() => {
                    console.log('[emit][vsbot.new]:', user?.pseudo);
                    socket.emit('vsbot.new', { pseudo: user?.pseudo });
                    setResumeModalVisible(false);
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    waitingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#2C1810',
    },
    waitingText: {
        marginTop: 20,
        fontSize: 18,
        color: '#FFD700',
        fontWeight: 'bold',
    },
    gameContainer: {
        flex: 1,
        backgroundColor: '#2C1810',
    },
    gameBoard: {
        flex: 1,
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 10,
        paddingLeft: 8,
        paddingRight: 8,
    },
    leftSection: {
        flex: 3,
        marginRight: 8,
    },
    rightSection: {
        flex: 2,
        justifyContent: 'space-between',
    },
    topIndicatorContainer: {
        flex: 2,
        marginBottom: 8,
    },
    plateauContainer: {
        flex: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    diceRollingZone: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomButtonContainer: {
        flex: 2,
        marginTop: 8,
    },
});
