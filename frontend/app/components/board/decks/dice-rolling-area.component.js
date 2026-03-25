import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing, TouchableOpacity } from "react-native";
import { Audio } from 'expo-av';

const DiceRollingArea = ({ dices, isRolling, onDicePress }) => {
  const soundRef = useRef(null);
  
  const [diceAnims] = useState(() => 
    Array(5).fill(null).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
      opacity: new Animated.Value(1),
    }))
  );

  const [dicePositions, setDicePositions] = useState(
    Array(5).fill(null).map(() => ({ x: 0, y: 0 }))
  );

  // Positions fixes en ligne pour affichage clair des dés au centre
  const getFinalPosition = (index) => {
    // Disposition en ligne horizontale au centre de l'écran
    // Espacement de 80px entre chaque dé pour qu'ils soient bien visibles
    const spacing = 80;
    const startX = -160; // Commence à gauche pour centrer les 5 dés
    
    return {
      x: startX + (index * spacing),
      y: 0 // Centré verticalement
    };
  };

  // Simulation physique réaliste - lancer chaotique de dés
  const throwDice = (anim, index) => {
    // Position de départ aléatoire (lancé depuis le haut et les côtés)
    const startAngle = Math.random() * Math.PI * 2;
    const startDistance = 180 + Math.random() * 50;
    const startX = Math.cos(startAngle) * startDistance;
    const startY = Math.sin(startAngle) * startDistance - 120;
    
    // Position finale fixe en ligne pour visibilité maximale
    const finalPos = getFinalPosition(index);
    const constrainedX = finalPos.x;
    const constrainedY = finalPos.y;
    
    // Trajectoire chaotique avec plusieurs points intermédiaires
    const bounce1X = constrainedX + (Math.random() - 0.5) * 120;
    const bounce1Y = constrainedY + (Math.random() - 0.5) * 80;
    const bounce2X = constrainedX + (Math.random() - 0.5) * 60;
    const bounce2Y = constrainedY + (Math.random() - 0.5) * 40;
    
    // Rotations TRÈS rapides (dés qui roulent beaucoup)
    const totalSpins = Math.floor(Math.random() * 15) + 10; // 10-25 rotations
    
    // Réinitialiser
    anim.x.setValue(startX);
    anim.y.setValue(startY);
    anim.rotate.setValue(Math.random() * 360);
    anim.scale.setValue(0.3);
    anim.opacity.setValue(0.5);

    // Animation chaotique avec trajectoire imprévisible
    Animated.parallel([
      // Trajectoire X - zigzag chaotique
      Animated.sequence([
        // Phase 1 : Arrivée chaotique
        Animated.timing(anim.x, {
          toValue: bounce1X,
          duration: 400 + Math.random() * 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Phase 2 : Premier rebond latéral
        Animated.timing(anim.x, {
          toValue: bounce2X,
          duration: 300 + Math.random() * 150,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        // Phase 3 : Roulement vers position finale
        Animated.spring(anim.x, {
          toValue: constrainedX + (Math.random() - 0.5) * 20,
          friction: 4 + Math.random() * 3,
          tension: 30 + Math.random() * 20,
          useNativeDriver: true,
        }),
      ]),
      
      // Trajectoire Y - multiples rebonds chaotiques
      Animated.sequence([
        // Chute initiale avec impact
        Animated.timing(anim.y, {
          toValue: bounce1Y + 40,
          duration: 450 + Math.random() * 150,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Premier gros rebond
        Animated.timing(anim.y, {
          toValue: constrainedY - 60,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: constrainedY + 25,
          duration: 280,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        // Deuxième rebond moyen
        Animated.timing(anim.y, {
          toValue: constrainedY - 35,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: constrainedY + 12,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // Troisième petit rebond
        Animated.timing(anim.y, {
          toValue: constrainedY - 18,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: constrainedY + 6,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        // Micro rebonds finaux (roulement)
        Animated.timing(anim.y, {
          toValue: constrainedY - 8,
          duration: 90,
          useNativeDriver: true,
        }),
        Animated.timing(anim.y, {
          toValue: constrainedY + 3,
          duration: 90,
          useNativeDriver: true,
        }),
        // Stabilisation
        Animated.spring(anim.y, {
          toValue: constrainedY,
          friction: 9,
          tension: 100,
          useNativeDriver: true,
        }),
      ]),
      
      // Rotation continue et rapide (dé qui roule)
      Animated.sequence([
        Animated.timing(anim.rotate, {
          toValue: totalSpins * 360,
          duration: 1800,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        // Petites rotations finales (ajustement)
        Animated.timing(anim.rotate, {
          toValue: (totalSpins + 0.5 + Math.random() * 0.5) * 360,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      
      // Scale - effet 3D de profondeur
      Animated.sequence([
        // Apparition
        Animated.timing(anim.scale, {
          toValue: 1.6,
          duration: 250,
          easing: Easing.out(Easing.back(3)),
          useNativeDriver: true,
        }),
        // Pendant le vol (variation pour effet 3D)
        Animated.timing(anim.scale, {
          toValue: 1.3,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1.5,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim.scale, {
          toValue: 1.2,
          duration: 400,
          useNativeDriver: true,
        }),
        // Stabilisation
        Animated.spring(anim.scale, {
          toValue: 1,
          friction: 5,
          tension: 35,
          useNativeDriver: true,
        }),
      ]),
      
      // Opacité - effet d'apparition et profondeur
      Animated.sequence([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        // Variation pendant le vol pour simuler rotation 3D
        Animated.timing(anim.opacity, {
          toValue: 0.9,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // Charger le son au montage du composant
  useEffect(() => {
    let isMounted = true;
    
    const loadSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: false,
        });

        // Décharger l'ancien son s'il existe
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
        }
        
        const { sound } = await Audio.Sound.createAsync(
          require('../../../../assets/dice_roll.mp3'),
          { shouldPlay: false, volume: 1.0 }
        );
        
        if (isMounted) {
          soundRef.current = sound;
          console.log('Son des dés chargé avec succès');
        } else {
          // Si le composant est démonté pendant le chargement, décharger le son
          await sound.unloadAsync();
        }
      } catch (error) {
        console.log('Erreur chargement son dés:', error);
      }
    };
    
    loadSound();
    
    // Cleanup: décharger le son quand le composant est démonté
    return () => {
      isMounted = false;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  // Jouer le son et lancer les animations quand isRolling devient true
  useEffect(() => {
    if (isRolling && dices.length > 0) {
      // Jouer le son de dés
      const playDiceSound = async () => {
        if (soundRef.current) {
          try {
            const status = await soundRef.current.getStatusAsync();
            
            if (status.isLoaded) {
              // Remettre le son au début et le jouer
              await soundRef.current.setPositionAsync(0);
              await soundRef.current.playAsync();
            }
          } catch (error) {
            console.log('Erreur lecture son dés:', error);
          }
        }
      };
      
      playDiceSound();
      
      // Lancer tous les dés non verrouillés simultanément
      dices.forEach((dice, index) => {
        if (dice && !dice.locked) {
          // Petit délai aléatoire pour effet naturel (0-200ms)
          setTimeout(() => {
            throwDice(diceAnims[index], index);
          }, Math.random() * 200);
        }
      });
    }
  }, [isRolling]);

  const renderDots = (value) => {
    if (!value || value === '') return null;

    const val = parseInt(value);
    const dotPositions = {
      1: ['center'],
      2: ['top-left', 'bottom-right'],
      3: ['top-left', 'center', 'bottom-right'],
      4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
      6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right']
    };

    const positions = dotPositions[val] || [];

    return positions.map((position, idx) => (
      <View key={idx} style={[styles.dot, styles[position]]} />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Afficher tous les 5 dés */}
      {Array(5).fill(null).map((_, index) => {
        const dice = dices[index] || { id: index, value: '', locked: true };
        const anim = diceAnims[index];
        
        // Interpolation de la rotation
        const spin = anim.rotate.interpolate({
          inputRange: [0, 360],
          outputRange: ['0deg', '360deg']
        });

        // Les dés sont positionnés en ligne au centre après l'animation
        return (
          <Animated.View
            key={dice.id || index}
            style={[
              styles.diceContainer,
              {
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { rotate: spin },
                  { scale: anim.scale },
                ],
                opacity: anim.opacity,
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.dice,
                dice.locked && styles.lockedDice,
                !dice.value && styles.emptyDice
              ]}
              onPress={() => onDicePress && onDicePress(index)}
              disabled={!dice.value || !onDicePress}
            >
              {renderDots(dice.value)}
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  diceContainer: {
    position: 'absolute',
  },
  dice: {
    width: 65,
    height: 65,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1A1A1A",
    // Effet 3D TRÈS prononcé avec gradients exagérés
    borderTopWidth: 1,
    borderTopColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderLeftColor: "#FAFAFA",
    borderRightWidth: 4,
    borderRightColor: "#909090",
    borderBottomWidth: 4,
    borderBottomColor: "#707070",
    // Ombres multiples TRÈS profondes pour effet 3D
    shadowColor: "#000",
    shadowOffset: { width: 3, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 25,
  },
  lockedDice: {
    backgroundColor: "#B0B0B0",
    borderTopColor: "#CCCCCC",
    borderLeftColor: "#B8B8B8",
    borderRightColor: "#707070",
    borderBottomColor: "#505050",
  },
  emptyDice: {
    backgroundColor: "#F8F8F8",
    borderTopColor: "#FFFFFF",
    borderLeftColor: "#F5F5F5",
    borderRightColor: "#D0D0D0",
    borderBottomColor: "#C0C0C0",
    opacity: 0.35,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#0A0A0A",
    position: 'absolute',
    // Ombre pour les points (effet gravé)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 5,
  },
  'top-left': {
    top: 11,
    left: 11,
  },
  'top-right': {
    top: 11,
    right: 11,
  },
  'center': {
    top: '50%',
    left: '50%',
    marginTop: -6,
    marginLeft: -6,
  },
  'middle-left': {
    top: '50%',
    left: 11,
    marginTop: -6,
  },
  'middle-right': {
    top: '50%',
    right: 11,
    marginTop: -6,
  },
  'bottom-left': {
    bottom: 11,
    left: 11,
  },
  'bottom-right': {
    bottom: 11,
    right: 11,
  },
});

export default DiceRollingArea;
