import React, { useEffect, useState, useContext } from "react";
import { Text, View, ActivityIndicator } from "react-native";
import { SocketContext } from '../contexts/socket.context';
import { AuthContext } from '../contexts/auth.context';
import { useLanguage } from '../contexts/language.context';
import styles from './vs-bot-game.styles';
import GameBoard from '../components/board/GameBoard.component';
import ResumeGameModal from '../components/board/resume-game-modal.component';
import useGameDeck from '../hooks/useGameDeck';


export default function VsBotGameController({ navigation, language = 'FR', onGameStateChange }) {

    const socket = useContext(SocketContext);
    const { user } = useContext(AuthContext);
    const { t } = useLanguage();

    const [gameResetKey, setGameResetKey] = useState(0);
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

    // États pour le modal de reprise
    const [resumeModalVisible, setResumeModalVisible] = useState(false);
    const [resumeData, setResumeData] = useState(null);
    const [resumeError, setResumeError] = useState(null);

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
        
        socket.emit("vsbot.start", { pseudo: user?.pseudo });
        
        setInGame(false);

        socket.on('vsbot.resume.available', (data) => {
            setResumeData(data);
            setResumeError(null);
            setResumeModalVisible(true);
        });

        socket.on('vsbot.resume.error', (data) => {
            setResumeData(null);
            setResumeError(data.message || 'Erreur lors de la reprise de la partie');
            setResumeModalVisible(true);
        });

        socket.on('game.start', (data) => {
            setInGame(data['inGame']);
            setIdOpponent(data['idOpponent']);
            setPseudoPlayer(data['pseudoPlayer']);
            setPseudoOpponent(data['pseudoOpponent']);
            setAvatarKeyPlayer(data['avatarKeyPlayer'] || 'avatar_1');
            setAvatarKeyOpponent(data['avatarKeyOpponent'] || 'avatar_6');
        });

        socket.on('game.deck.view-state', handleDeckViewState);

        socket.on('game.ended', (data) => {
            setGameEnded(true);
            setGameEndData(data);
        });

        return () => {
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
                <Text style={styles.waitingText}>{t('vsBotStarting')}</Text>
                
                {/* Modal de reprise de partie */}
                <ResumeGameModal
                    visible={resumeModalVisible}
                    savedAt={resumeData?.savedAt}
                    currentTurn={resumeData?.currentTurn}
                    errorMessage={resumeError}
                    onResume={() => {
                        socket.emit('vsbot.resume', { pseudo: user?.pseudo });
                        setResumeModalVisible(false);
                    }}
                    onNewGame={() => {
                        socket.emit('vsbot.new', { pseudo: user?.pseudo });
                        setResumeModalVisible(false);
                    }}
                    onGoHome={() => {
                        setResumeModalVisible(false);
                        navigation.navigate('HomeScreen');
                    }}
                />
            </View>
        );
    }

    // Si le plateau de jeu doit être affiché
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
                navigation.navigate('HomeScreen');
                setTimeout(() => { navigation.navigate('VsBotGameScreen'); }, 100);
            }}
            onReturnToMenu={() => {
                setGameEnded(false);
                setGameEndData(null);
                setInGame(false);
                setShowGameBoard(false);
                if (onGameStateChange) { onGameStateChange(false); }
                navigation.navigate('HomeScreen');
            }}
            onRulesPress={() => navigation.navigate('RulesScreen')}
        >
            <ResumeGameModal
                visible={resumeModalVisible}
                savedAt={resumeData?.savedAt}
                currentTurn={resumeData?.currentTurn}
                errorMessage={resumeError}
                onResume={() => {
                    socket.emit('vsbot.resume', { pseudo: user?.pseudo });
                    setResumeModalVisible(false);
                }}
                onNewGame={() => {
                    socket.emit('vsbot.new', { pseudo: user?.pseudo });
                    setResumeModalVisible(false);
                }}
                onGoHome={() => {
                    setResumeModalVisible(false);
                    navigation.navigate('HomeScreen');
                }}
            />
        </GameBoard>
    );
}
