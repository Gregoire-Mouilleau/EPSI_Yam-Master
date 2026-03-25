import React, { useEffect, useState } from 'react';
import { Modal, View, Text, ActivityIndicator } from 'react-native';
import styles from './disconnection-modal.styles';
import { useLanguage } from '../../contexts/language.context';

export default function DisconnectionModal({ 
    visible, 
    status, // 'waiting', 'reconnected', 'forfeit'
    waitTime = 180,
    message
}) {
    const { t } = useLanguage();
    const [remainingTime, setRemainingTime] = useState(waitTime);
    
    useEffect(() => {
        if (visible && status === 'waiting') {
            setRemainingTime(waitTime);
            
            const interval = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            
            return () => clearInterval(interval);
        }
    }, [visible, status, waitTime]);
    
    const getContent = () => {
        if (status === 'waiting') {
            const minutes = Math.floor(remainingTime / 60);
            const seconds = remainingTime % 60;
            
            return (
                <>
                    <Text style={styles.icon}>⏳</Text>
                    <Text style={styles.title}>{t('disconnectOpponentTitle')}</Text>
                    <Text style={styles.message}>
                        {t('disconnectOpponentMessage')}
                    </Text>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timer}>
                            {minutes}:{seconds.toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.timerLabel}>{t('disconnectTimeRemaining')}</Text>
                    </View>
                    <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
                </>
            );
        }
        
        if (status === 'reconnected') {
            return (
                <>
                    <Text style={styles.icon}>✅</Text>
                    <Text style={styles.title}>{t('disconnectReconnected')}</Text>
                    <Text style={styles.message}>
                        {message || t('disconnectReconnectedMessage')}
                    </Text>
                </>
            );
        }
        
        if (status === 'forfeit') {
            return (
                <>
                    <Text style={styles.icon}>🏆</Text>
                    <Text style={styles.title}>{t('disconnectForfeitTitle')}</Text>
                    <Text style={styles.message}>
                        {message || t('disconnectForfeitMessage')}
                    </Text>
                </>
            );
        }
        
        return null;
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
