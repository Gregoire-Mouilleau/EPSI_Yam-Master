import React from 'react';
import { Modal, View, Text, TouchableOpacity, Platform } from 'react-native';
import styles from './resume-game-modal.styles';
import { useLanguage } from '../../contexts/language.context';
import FloatingDice from '../FloatingDice';

export default function ResumeGameModal({ 
    visible, 
    savedAt,
    currentTurn,
    onResume,
    onNewGame,
    onGoHome,
    errorMessage
}) {
    const { t } = useLanguage();
    
    const getContent = () => {
        if (errorMessage) {
            return (
                <>
                    <Text style={styles.errorIcon}>❌</Text>
                    <Text style={styles.title}>{t('resumeError')}</Text>
                    <Text style={styles.message}>{errorMessage}</Text>
                    <TouchableOpacity style={[styles.actionButton, styles.newGameButton]} onPress={onNewGame} activeOpacity={0.8}>
                        <Text style={styles.actionButtonText}>{t('resumeOk')}</Text>
                    </TouchableOpacity>
                    {onGoHome && (
                        <TouchableOpacity style={styles.homeLink} onPress={onGoHome} activeOpacity={0.7}>
                            <Text style={styles.homeLinkText}>{t('resumeGoHome')}</Text>
                        </TouchableOpacity>
                    )}
                </>
            );
        }
        
        const savedDate = new Date(savedAt);
        const currentTurnText = currentTurn === 'player:1' ? t('resumeYourTurn') : t('resumeBotTurn');
        
        return (
            <>
                {/* Header icon */}
                <View style={styles.iconWrapper}>
                    <Text style={styles.icon}>💾</Text>
                </View>

                <Text style={styles.title}>{t('resumeTitle')}</Text>
                <Text style={styles.message}>{t('resumeMessage')}</Text>

                {/* Info card */}
                <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('resumeSavedAt')}</Text>
                        <Text style={styles.infoValue}>{savedDate.toLocaleString('fr-FR')}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>{t('resumeState')}</Text>
                        <Text style={[styles.infoValue, styles.infoValueHighlight]}>{currentTurnText}</Text>
                    </View>
                </View>

                <Text style={styles.question}>{t('resumeQuestion')}</Text>

                {/* Main action buttons */}
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.actionButton, styles.resumeButton]} onPress={onResume} activeOpacity={0.8}>
                        <Text style={styles.actionButtonText}>{t('resumeButton')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.newGameButton]} onPress={onNewGame} activeOpacity={0.8}>
                        <Text style={styles.actionButtonText}>{t('resumeNewGame')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Go home link */}
                {onGoHome && (
                    <TouchableOpacity style={styles.homeLink} onPress={onGoHome} activeOpacity={0.7}>
                        <Text style={styles.homeLinkText}>{t('resumeGoHome')}</Text>
                    </TouchableOpacity>
                )}
            </>
        );
    };
    
    return (
        <Modal visible={visible} transparent={true} animationType="fade">
            <View style={styles.overlay}>
                {/* Fond identique au Background.js */}
                <View style={styles.bgPattern} />
                <View style={styles.bgGradient} />
                <View style={styles.diceLayer}>
                    <FloatingDice />
                </View>

                <View style={styles.card}>
                    {getContent()}
                </View>
            </View>
        </Modal>
    );
}
