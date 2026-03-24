import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated } from 'react-native';

export default function RockPaperScissors({ visible, playerPseudo, opponentPseudo, opponentChoice, onChoice }) {
    const [playerChoice, setPlayerChoice] = useState(null);
    const [showResult, setShowResult] = useState(false);
    
    const scaleAnims = {
        rock: new Animated.Value(1),
        paper: new Animated.Value(1),
        scissors: new Animated.Value(1),
    };
    
    const fadeAnim = new Animated.Value(0);
    const slideAnim = new Animated.Value(50);
    const pulseAnim = new Animated.Value(1);

    const choices = [
        { id: 'rock', name: 'Pierre', image: require('../../assets/pierre.png') },
        { id: 'paper', name: 'Papier', image: require('../../assets/papier.png') },
        { id: 'scissors', name: 'Ciseaux', image: require('../../assets/ciseaux.png') },
    ];
    
    // Animation d'entrée du composant
    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.spring(slideAnim, {
                    toValue: 0,
                    friction: 8,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]).start();
            
            // Animation pulse continue pour les boutons
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
        }
    }, [visible]);

    const handleChoice = (choice) => {
        if (playerChoice) return; // Déjà choisi
        
        setPlayerChoice(choice);
        onChoice(choice); // Envoyer le choix au backend
        
        // Animation de sélection
        Animated.sequence([
            Animated.timing(scaleAnims[choice], {
                toValue: 1.3,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnims[choice], {
                toValue: 1.1,
                friction: 5,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    };

    useEffect(() => {
        if (playerChoice && opponentChoice) {
            setShowResult(true);
        }
    }, [playerChoice, opponentChoice]);
    
    // Réinitialiser quand opponentChoice redevient null (égalité)
    useEffect(() => {
        if (opponentChoice === null && playerChoice !== null) {
            setPlayerChoice(null);
            setShowResult(false);
        }
    }, [opponentChoice]);

    if (!visible) return null;

    return (
        <View style={styles.overlay}>
            <Animated.View 
                style={[
                    styles.container,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}
            >
                <Text style={styles.title}>🎮 Pierre, Papier, Ciseaux ! 🎮</Text>
                <Text style={styles.subtitle}>Choisis ton arme pour décider qui commence !</Text>
                
                {!showResult && (
                    <>
                        <View style={styles.choicesContainer}>
                            {choices.map((choice) => (
                                <View key={choice.id} style={styles.choiceWrapper}>
                                    <TouchableOpacity
                                        style={[
                                            styles.choiceButton,
                                            playerChoice === choice.id && styles.choiceButtonSelected,
                                        ]}
                                        onPress={() => handleChoice(choice.id)}
                                        disabled={playerChoice !== null}
                                        activeOpacity={0.8}
                                    >
                                        <Animated.View
                                            style={{
                                                transform: [
                                                    { 
                                                        scale: playerChoice === null 
                                                            ? pulseAnim 
                                                            : scaleAnims[choice.id] 
                                                    }
                                                ],
                                            }}
                                        >
                                            <Image source={choice.image} style={styles.choiceImage} />
                                        </Animated.View>
                                    </TouchableOpacity>
                                    <Text style={styles.choiceName}>{choice.name}</Text>
                                </View>
                            ))}
                        </View>
                        
                        {playerChoice && !opponentChoice && (
                            <View style={styles.waitingContainer}>
                                <Text style={styles.waitingText}>⏳ En attente de {opponentPseudo}...</Text>
                            </View>
                        )}
                    </>
                )}
                
                {showResult && (
                    <View style={styles.resultContainer}>
                        <View style={styles.vsContainer}>
                            <View style={styles.resultChoice}>
                                <Text style={styles.resultPlayerName}>{playerPseudo}</Text>
                                <Image 
                                    source={choices.find(c => c.id === playerChoice).image} 
                                    style={styles.resultImage}
                                />
                                <Text style={styles.resultChoiceName}>
                                    {choices.find(c => c.id === playerChoice).name}
                                </Text>
                            </View>
                            
                            <Text style={styles.vsText}>VS</Text>
                            
                            <View style={styles.resultChoice}>
                                <Text style={styles.resultPlayerName}>{opponentPseudo}</Text>
                                <Image 
                                    source={choices.find(c => c.id === opponentChoice).image} 
                                    style={styles.resultImage}
                                />
                                <Text style={styles.resultChoiceName}>
                                    {choices.find(c => c.id === opponentChoice).name}
                                </Text>
                            </View>
                        </View>
                    </View>
                )}
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    container: {
        width: '90%',
        maxWidth: 600,
        backgroundColor: '#1a1a2e',
        borderRadius: 20,
        padding: 30,
        borderWidth: 3,
        borderColor: '#FFD700',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 30,
        textAlign: 'center',
    },
    choicesContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
        gap: 15,
    },
    choiceWrapper: {
        alignItems: 'center',
        gap: 10,
    },
    choiceButton: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 140,
        height: 140,
        borderRadius: 70, // Rend le bouton parfaitement circulaire
        borderWidth: 4,
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    choiceButtonSelected: {
        borderColor: '#FFD700',
        backgroundColor: 'rgba(255, 215, 0, 0.25)',
        borderWidth: 5,
        shadowOpacity: 0.8,
        shadowRadius: 15,
        transform: [{ scale: 1.05 }],
    },
    choiceImage: {
        width: 90,
        height: 90,
    },
    choiceName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    waitingContainer: {
        marginTop: 20,
        padding: 20,
        backgroundColor: 'rgba(255, 215, 0, 0.15)',
        borderRadius: 15,
        borderWidth: 2,
        borderColor: 'rgba(255, 215, 0, 0.3)',
    },
    waitingText: {
        fontSize: 18,
        color: '#FFD700',
        textAlign: 'center',
        fontWeight: '600',
    },
    resultContainer: {
        width: '100%',
        alignItems: 'center',
    },
    vsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 30,
    },
    resultChoice: {
        alignItems: 'center',
    },
    resultPlayerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: 10,
    },
    resultImage: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    resultChoiceName: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    vsText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFD700',
        marginHorizontal: 20,
    },
    resultText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFD700',
        textAlign: 'center',
        lineHeight: 30,
    },
});
