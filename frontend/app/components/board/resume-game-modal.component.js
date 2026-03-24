import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useLanguage } from '../../contexts/language.context';

export default function ResumeGameModal({ 
    visible, 
    savedAt,
    currentTurn,
    onResume,
    onNewGame,
    errorMessage
}) {
    const { t } = useLanguage();
    
    const getContent = () => {
        if (errorMessage) {
            return (
                <>
                    <Text style={styles.icon}>❌</Text>
                    <Text style={styles.title}>{t('resumeError')}</Text>
                    <Text style={styles.message}>{errorMessage}</Text>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={onNewGame}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{t('resumeOk')}</Text>
                    </TouchableOpacity>
                </>
            );
        }
        
        const savedDate = new Date(savedAt);
        const currentTurnText = currentTurn === 'player:1' ? t('resumeYourTurn') : t('resumeBotTurn');
        
        return (
            <>
                <Text style={styles.icon}>💾</Text>
                <Text style={styles.title}>{t('resumeTitle')}</Text>
                <Text style={styles.message}>
                    {t('resumeMessage')}
                </Text>
                
                <View style={styles.infoContainer}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('resumeSavedAt')}</Text>
                        <Text style={styles.infoValue}>{savedDate.toLocaleString('fr-FR')}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('resumeState')}</Text>
                        <Text style={styles.infoValue}>{currentTurnText}</Text>
                    </View>
                </View>
                
                <Text style={styles.question}>{t('resumeQuestion')}</Text>
                
                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.resumeButton]}
                        onPress={onResume}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{t('resumeButton')}</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.button, styles.newGameButton]}
                        onPress={onNewGame}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>{t('resumeNewGame')}</Text>
                    </TouchableOpacity>
                </View>
            </>
        );
    };
    
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {getContent()}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 30,
        width: '85%',
        maxWidth: 400,
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFD700',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    icon: {
        fontSize: 64,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 15,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 24,
    },
    infoContainer: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 15,
        padding: 20,
        marginVertical: 20,
        width: '100%',
    },
    infoRow: {
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#CCCCCC',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
    },
    question: {
        fontSize: 16,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 20,
        fontWeight: '600',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    resumeButton: {
        backgroundColor: '#4CAF50',
    },
    newGameButton: {
        backgroundColor: '#2196F3',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
