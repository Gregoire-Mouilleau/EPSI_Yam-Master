import React, { useEffect, useState, useContext } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Animated, Image } from "react-native";
import styles from './online-game.styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SocketContext } from '../contexts/socket.context';
import { AuthContext } from '../contexts/auth.context';
import { getAvatarSource } from '../constants/avatars';
import { getHomeTexts } from '../i18n';
import GameBoard from '../components/board/GameBoard.component';
import DisconnectionModal from '../components/board/disconnection-modal.component';
import RockPaperScissors from '../components/rock-paper-scissors.component';
import useGameDeck from '../hooks/useGameDeck';


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
    const { playerDices, opponentDices, isDiceRolling, isOpponentRolling,
            displayRollButton, displayOpponentDeck, handleDeckViewState, handleDiceLock } = useGameDeck(socket);

    // États pour la fin de partie
    const [gameEnded, setGameEnded] = useState(false);
    const [gameEndData, setGameEndData] = useState(null);
    
    // États pour le modal de déconnexion
    const [disconnectionModalVisible, setDisconnectionModalVisible] = useState(false);
    const [disconnectionStatus, setDisconnectionStatus] = useState('waiting');
    const [disconnectionWaitTime, setDisconnectionWaitTime] = useState(180);
    
    // États pour le pierre-papier-ciseaux
    const [showRPS, setShowRPS] = useState(false);
    const [rpsPlayerPseudo, setRpsPlayerPseudo] = useState('');
    const [rpsOpponentPseudo, setRpsOpponentPseudo] = useState('');
    const [rpsOpponentChoice, setRpsOpponentChoice] = useState(null);
    
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

    useEffect(() => {
        socket.emit("get.state");
        
        // Tentative de reconnexion automatique
        const attemptReconnection = async () => {
            try {
                const previousSocketId = await AsyncStorage.getItem('onlineGameSocketId');
                if (previousSocketId && previousSocketId !== socket.id) {
                    socket.emit('game.reconnect', { previousSocketId });
                }
            } catch (error) {
                console.error('[reconnect][storage-error]:', error);
            }
        };
        
        attemptReconnection();
        
        socket.emit("queue.join", { pseudo: user?.pseudo });
        
        setInQueue(false);
        setInGame(false);

        socket.on('queue.added', (data) => {
            setInQueue(data['inQueue']);
            setInGame(data['inGame']);
        });

        socket.on('queue.left', (data) => {
        });
        
        socket.on('rps.start', (data) => {
            setRpsPlayerPseudo(data.playerPseudo);
            setRpsOpponentPseudo(data.opponentPseudo);
            setShowRPS(true);
        });
        
        socket.on('rps.opponent.ready', () => {
        });
        
        socket.on('rps.result', (data) => {
            setRpsOpponentChoice(data.opponentChoice);
        });
        
        socket.on('rps.restart', () => {
            setRpsOpponentChoice(null);
        });

        socket.on('game.start', async (data) => {
            setShowRPS(false); // Masquer le RPS quand la partie démarre
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
            } catch (error) {
                console.error('[storage][save-error]:', error);
            }
        });

        socket.on('opponent.disconnected', async (data) => {
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
            setDisconnectionStatus('waiting');
            setDisconnectionWaitTime(data.waitTime || 180);
            setDisconnectionModalVisible(true);
        });

        socket.on('opponent.reconnected', (data) => {
            setDisconnectionStatus('reconnected');
            setTimeout(() => {
                setDisconnectionModalVisible(false);
            }, 2000);
        });
        
        socket.on('game.reconnected', (data) => {
            // La reconnexion a réussi, le modal va se fermer automatiquement
        });
        
        socket.on('game.reconnect.error', async (data) => {
            // Échec de reconnexion, nettoyer le socket ID
            try {
                await AsyncStorage.removeItem('onlineGameSocketId');
            } catch (error) {
                console.error('[storage][remove-error]:', error);
            }
        });

        socket.on('game.end', async (data) => {
            
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

        socket.on('game.deck.view-state', handleDeckViewState);

        socket.on('game.ended', (data) => {
            setGameEnded(true);
            setGameEndData(data);
        });

        return () => {
            socket.emit("queue.leave");
            socket.off('queue.added');
            socket.off('queue.left');
            socket.off('rps.start');
            socket.off('rps.opponent.ready');
            socket.off('rps.result');
            socket.off('rps.restart');
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
    
    const handleRPSChoice = (choice) => {
        socket.emit('rps.choice', { choice });
    };

    const handleLeaveQueue = () => {
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
            <GameBoard
                key={`game-${gameResetKey}`}
                gameResetKey={gameResetKey}
                displayOpponentDeck={displayOpponentDeck}
                opponentDices={opponentDices}
                playerDices={playerDices}
                isOpponentRolling={isOpponentRolling}
                isDiceRolling={isDiceRolling}
                onDiceLock={handleDiceLock}
                gameEnded={gameEnded}
                gameEndData={gameEndData}
                pseudoPlayer={pseudoPlayer}
                pseudoOpponent={pseudoOpponent}
                avatarKeyPlayer={avatarKeyPlayer}
                avatarKeyOpponent={avatarKeyOpponent}
                onRematch={() => {
                    setGameEnded(false);
                    setGameEndData(null);
                    setInGame(false);
                    setShowGameBoard(false);
                    if (onGameStateChange) { onGameStateChange(false); }
                    socket.emit("queue.leave");
                    navigation.navigate('HomeScreen');
                    setTimeout(() => { navigation.navigate('OnlineGameScreen'); }, 100);
                }}
                onReturnToMenu={() => {
                    setGameEnded(false);
                    setGameEndData(null);
                    setInGame(false);
                    setShowGameBoard(false);
                    if (onGameStateChange) { onGameStateChange(false); }
                    socket.emit("queue.leave");
                    navigation.navigate('HomeScreen');
                }}
            >
                <DisconnectionModal
                    visible={disconnectionModalVisible}
                    status={disconnectionStatus}
                    waitTime={disconnectionWaitTime}
                />
            </GameBoard>
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
            
            {/* Composant Pierre-Papier-Ciseaux */}
            {showRPS && (
                <RockPaperScissors
                    visible={showRPS}
                    playerPseudo={rpsPlayerPseudo}
                    opponentPseudo={rpsOpponentPseudo}
                    opponentChoice={rpsOpponentChoice}
                    onChoice={handleRPSChoice}
                />
            )}
        </View>
    );
}
