import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Animated } from 'react-native';
import styles from './rock-paper-scissors.styles';
import { useLanguage } from '../contexts/language.context';

export default function RockPaperScissors({ visible, playerPseudo, opponentPseudo, opponentChoice, onChoice }) {
    const { t } = useLanguage();
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
        { id: 'rock', name: t('rpsRock'), image: require('../../assets/pierre.png') },
        { id: 'paper', name: t('rpsPaper'), image: require('../../assets/papier.png') },
        { id: 'scissors', name: t('rpsScissors'), image: require('../../assets/ciseaux.png') },
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
                <Text style={styles.title}>{t('rpsTitle')}</Text>
                <Text style={styles.subtitle}>{t('rpsSubtitle')}</Text>
                
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
                                <Text style={styles.waitingText}>{t('rpsWaiting')} {opponentPseudo}...</Text>
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
                            
                            <Text style={styles.vsText}>{t('rpsVs')}</Text>
                            
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
