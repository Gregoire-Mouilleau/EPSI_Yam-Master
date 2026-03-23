import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function DisconnectionModal({ 
    visible, 
    status, // 'waiting', 'reconnected', 'forfeit'
    waitTime = 180,
    message
}) {
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
                    <Text style={styles.title}>Adversaire déconnecté</Text>
                    <Text style={styles.message}>
                        Votre adversaire s'est déconnecté.{'\n'}
                        En attente de reconnexion...
                    </Text>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timer}>
                            {minutes}:{seconds.toString().padStart(2, '0')}
                        </Text>
                        <Text style={styles.timerLabel}>temps restant</Text>
                    </View>
                    <ActivityIndicator size="large" color="#FFD700" style={styles.spinner} />
                </>
            );
        }
        
        if (status === 'reconnected') {
            return (
                <>
                    <Text style={styles.icon}>✅</Text>
                    <Text style={styles.title}>Reconnexion réussie !</Text>
                    <Text style={styles.message}>
                        {message || 'Votre adversaire s\'est reconnecté.\nLa partie reprend !'}
                    </Text>
                </>
            );
        }
        
        if (status === 'forfeit') {
            return (
                <>
                    <Text style={styles.icon}>🏆</Text>
                    <Text style={styles.title}>Victoire par forfait !</Text>
                    <Text style={styles.message}>
                        {message || 'Votre adversaire ne s\'est pas reconnecté.\nVous gagnez la partie !'}
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
    timerContainer: {
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        borderRadius: 15,
        padding: 20,
        marginVertical: 20,
        alignItems: 'center',
        width: '100%',
    },
    timer: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFD700',
        fontFamily: 'monospace',
    },
    timerLabel: {
        fontSize: 14,
        color: '#CCCCCC',
        marginTop: 5,
    },
    spinner: {
        marginTop: 20,
    },
});
