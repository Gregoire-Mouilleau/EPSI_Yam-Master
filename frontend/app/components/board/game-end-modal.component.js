import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';
import styles from './game-end-modal.styles';
import { getAvatarSource } from '../../constants/avatars';
import { useLanguage } from '../../contexts/language.context';

export default function GameEndModal({ 
    visible, 
    winner, 
    reason, 
    player1Score, 
    player2Score, 
    playerKey,
    pseudoPlayer,
    pseudoOpponent,
    avatarKeyPlayer,
    avatarKeyOpponent,
    onRematch,
    onReturnToMenu 
}) {
    const { t } = useLanguage();
    const isPlayerWinner = winner === playerKey;
    const isDraw = winner === 'draw';
    
    let displayedPseudo = '';
    let displayedAvatar = null;
    
    // Déterminer les scores en fonction du playerKey
    let playerScore = 0;
    let opponentScore = 0;
    
    if (playerKey === 'player:1') {
        playerScore = player1Score || 0;
        opponentScore = player2Score || 0;
    } else {
        playerScore = player2Score || 0;
        opponentScore = player1Score || 0;
    }
    
    if (!isDraw) {
        // Afficher le gagnant en fonction de qui a gagné
        if (isPlayerWinner) {
            // Le joueur local a gagné
            displayedPseudo = pseudoPlayer;
            displayedAvatar = getAvatarSource(avatarKeyPlayer);
        } else {
            // L'adversaire a gagné
            displayedPseudo = pseudoOpponent;
            displayedAvatar = getAvatarSource(avatarKeyOpponent);
        }
    }
    
    const getReasonText = () => {
        if (reason === 'line-of-5') {
            return t('gameEndLineOf5');
        } else if (reason === 'score') {
            return t('gameEndScore');
        } else if (reason === 'disconnect') {
            return isPlayerWinner ? t('gameEndForfeit') : t('gameEndDisconnect');
        }
        return '';
    };

    const getHeaderText = () => {
        if (isDraw) {
            return t('gameEndDraw');
        }
        return isPlayerWinner ? t('gameEndVictory') : t('gameEndDefeat');
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onReturnToMenu}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* En-tête */}
                    <View style={styles.header}>
                        <Text style={styles.headerText}>
                            {getHeaderText()}
                        </Text>
                    </View>

                    {/* Contenu principal */}
                    <View style={styles.content}>
                        {!isDraw && displayedAvatar && (
                            <Image source={displayedAvatar} style={styles.avatar} />
                        )}
                        
                        <Text style={styles.winnerText}>
                            {isDraw ? t('gameEndDrawText') : `${displayedPseudo} ${t('gameEndWins')}`}
                        </Text>
                        
                        <Text style={styles.reasonText}>{getReasonText()}</Text>

                        {/* Scores */}
                        <View style={styles.scoresContainer}>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreLabel}>🟢 {pseudoPlayer}</Text>
                                <Text style={styles.scoreValue}>{playerScore} {playerScore > 1 ? t('gameEndLines') : t('gameEndLine')}</Text>
                            </View>
                            
                            <Text style={styles.vs}>{t('gameEndVs')}</Text>
                            
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreLabel}>🔴 {pseudoOpponent}</Text>
                                <Text style={styles.scoreValue}>{opponentScore} {opponentScore > 1 ? t('gameEndLines') : t('gameEndLine')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Boutons d'action */}
                    <View style={styles.buttonsContainer}>
                        <TouchableOpacity 
                            style={[styles.button, styles.rematchButton]} 
                            onPress={onRematch}
                        >
                            <Text style={styles.buttonText}>{t('gameEndRematch')}</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.button, styles.menuButton]} 
                            onPress={onReturnToMenu}
                        >
                            <Text style={styles.buttonText}>{t('gameEndMenu')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
