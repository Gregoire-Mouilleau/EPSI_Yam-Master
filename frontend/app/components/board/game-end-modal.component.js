import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { getAvatarSource } from '../../constants/avatars';

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
    onClose 
}) {
    const isPlayerWinner = winner === playerKey;
    const isDraw = winner === 'draw';
    
    let displayedPseudo = '';
    let displayedAvatar = null;
    
    if (!isDraw) {
        // Toujours afficher le gagnant, peu importe qui c'est
        if (winner === 'player:1') {
            displayedPseudo = pseudoPlayer;
            displayedAvatar = getAvatarSource(avatarKeyPlayer);
        } else {
            displayedPseudo = pseudoOpponent;
            displayedAvatar = getAvatarSource(avatarKeyOpponent);
        }
    }
    
    const getReasonText = () => {
        if (reason === 'line-of-5') {
            return '🏆 Ligne de 5 jetons !';
        } else if (reason === 'score') {
            return '🏆 Plateau rempli - Victoire au score !';
        }
        return '';
    };

    const getHeaderText = () => {
        if (isDraw) {
            return '⚔️ ÉGALITÉ ⚔️';
        }
        return isPlayerWinner ? '🎉 VICTOIRE ! 🎉' : '😔 DÉFAITE 😔';
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
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
                            {isDraw ? 'Match nul !' : `${displayedPseudo} gagne !`}
                        </Text>
                        
                        <Text style={styles.reasonText}>{getReasonText()}</Text>

                        {/* Scores */}
                        <View style={styles.scoresContainer}>
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreLabel}>🟢 {pseudoPlayer}</Text>
                                <Text style={styles.scoreValue}>{player1Score} {player1Score > 1 ? 'lignes' : 'ligne'}</Text>
                            </View>
                            
                            <Text style={styles.vs}>VS</Text>
                            
                            <View style={styles.scoreBox}>
                                <Text style={styles.scoreLabel}>🔴 {pseudoOpponent}</Text>
                                <Text style={styles.scoreValue}>{player2Score} {player2Score > 1 ? 'lignes' : 'ligne'}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Bouton rejouer */}
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>🎮 Rejouer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        maxWidth: 500,
        backgroundColor: 'rgba(70, 11, 0, 0.98)',
        borderRadius: 20,
        borderWidth: 4,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
        elevation: 10,
        overflow: 'hidden',
    },
    header: {
        backgroundColor: '#8B0000',
        paddingVertical: 20,
        borderBottomWidth: 3,
        borderBottomColor: '#FFD700',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        textShadowColor: '#000',
        textShadowOffset: { width: 2, height: 2 },
        textShadowRadius: 4,
    },
    content: {
        padding: 30,
        alignItems: 'center',
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFD700',
        marginBottom: 20,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 15,
    },
    winnerText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    reasonText: {
        fontSize: 18,
        color: '#FFA500',
        marginBottom: 30,
        textAlign: 'center',
        fontWeight: '600',
    },
    scoresContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        marginTop: 10,
    },
    scoreBox: {
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        padding: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D89A2E',
        minWidth: 120,
        alignItems: 'center',
    },
    scoreLabel: {
        fontSize: 14,
        color: '#FFD700',
        fontWeight: '600',
        marginBottom: 8,
    },
    scoreValue: {
        fontSize: 20,
        color: '#FFF',
        fontWeight: 'bold',
    },
    vs: {
        fontSize: 20,
        color: '#FFA500',
        fontWeight: 'bold',
        marginHorizontal: 10,
    },
    button: {
        backgroundColor: '#8B0000',
        paddingVertical: 18,
        marginHorizontal: 30,
        marginBottom: 30,
        borderRadius: 12,
        borderWidth: 3,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 10,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        textShadowColor: '#000',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
});
