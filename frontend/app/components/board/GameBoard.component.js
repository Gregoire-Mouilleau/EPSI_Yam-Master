import React from 'react';
import { View, ImageBackground } from 'react-native';
import styles from './GameBoard.styles';
import Timer from './timers/Timer.component';
import Grid from './grid/grid.component';
import Choices from './choices/choices.component';
import DiceRollingArea from './decks/dice-rolling-area.component';
import OpponentDeck from './decks/opponent-deck.component';
import PlayerDeck from './decks/player-deck.component';
import GameEndModal from './game-end-modal.component';

export default function GameBoard({
    gameResetKey,
    displayOpponentDeck,
    opponentDices,
    playerDices,
    isOpponentRolling,
    isDiceRolling,
    onDiceLock,
    gameEnded,
    gameEndData,
    pseudoPlayer,
    pseudoOpponent,
    avatarKeyPlayer,
    avatarKeyOpponent,
    onRematch,
    onReturnToMenu,
    children,
}) {
    return (
        <View style={styles.gameContainer}>
            <View style={styles.gameBoard}>
                <View style={styles.leftSection}>
                    <Timer type="opponent" key={`opponent-timer-${gameResetKey}`} />
                    <Grid key={`grid-${gameResetKey}`} />
                    <Choices key={`choices-${gameResetKey}`} />
                    <Timer type="player" key={`player-timer-${gameResetKey}`} />
                </View>

                <View style={styles.rightSection}>
                    <View style={styles.topIndicatorContainer}>
                        <OpponentDeck key={`opponent-deck-${gameResetKey}`} displayOpponentDeck={displayOpponentDeck} />
                    </View>
                    <View style={styles.plateauContainer}>
                        <ImageBackground
                            source={require('../../../assets/plateau.png')}
                            style={styles.diceRollingZone}
                            resizeMode="contain"
                        >
                            <DiceRollingArea
                                key={`dice-area-${gameResetKey}`}
                                dices={displayOpponentDeck ? opponentDices : playerDices}
                                isRolling={displayOpponentDeck ? isOpponentRolling : isDiceRolling}
                                onDicePress={displayOpponentDeck ? null : onDiceLock}
                            />
                        </ImageBackground>
                    </View>
                    <View style={styles.bottomButtonContainer}>
                        <PlayerDeck key={`player-deck-${gameResetKey}`} />
                    </View>
                </View>
            </View>

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
                    onRematch={onRematch}
                    onReturnToMenu={onReturnToMenu}
                />
            )}

            {children}
        </View>
    );
}
