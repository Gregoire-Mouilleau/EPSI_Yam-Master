import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Animated, Dimensions, ImageBackground, TouchableOpacity } from "react-native";

const DiceRollingArea = ({ dices, isRolling, onDicePress }) => {
  const [diceAnims] = useState(() => 
    Array(5).fill(null).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      rotate: new Animated.Value(0),
      scale: new Animated.Value(1),
    }))
  );

  useEffect(() => {
    if (isRolling && dices.length > 0) {
      // Animation de lancer pour chaque dé
      dices.forEach((dice, index) => {
        if (!dice.locked && dice.value) {
          const anim = diceAnims[index];
          
          // Position de départ aléatoire en haut
          const startX = Math.random() * 150 - 75;
          const startY = -150;
          
          // Positions finales en grille pour 5 dés
          const positions = [
            { x: -80, y: -30 },
            { x: 0, y: -30 },
            { x: 80, y: -30 },
            { x: -40, y: 40 },
            { x: 40, y: 40 },
          ];
          
          const endPos = positions[index] || { x: 0, y: 0 };
          const endX = endPos.x + (Math.random() * 20 - 10);
          const endY = endPos.y + (Math.random() * 20 - 10);
          
          // Rotation aléatoire
          const rotations = Math.floor(Math.random() * 4) + 3;

          anim.x.setValue(startX);
          anim.y.setValue(startY);
          anim.rotate.setValue(0);
          anim.scale.setValue(1.5);

          Animated.parallel([
            Animated.spring(anim.x, {
              toValue: endX,
              friction: 5,
              tension: 25,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(anim.y, {
                toValue: endY - 40,
                duration: 500,
                useNativeDriver: true,
              }),
              Animated.spring(anim.y, {
                toValue: endY,
                friction: 4,
                tension: 50,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(anim.rotate, {
              toValue: rotations,
              duration: 700,
              useNativeDriver: true,
            }),
            Animated.timing(anim.scale, {
              toValue: 1,
              duration: 700,
              useNativeDriver: true,
            }),
          ]).start();
        }
      });
    }
  }, [isRolling, dices]);

  // Positions statiques des dés (en grille)
  const getDicePosition = (index) => {
    const positions = [
      { x: -80, y: -30 },
      { x: 0, y: -30 },
      { x: 80, y: -30 },
      { x: -40, y: 40 },
      { x: 40, y: 40 },
    ];
    return positions[index] || { x: 0, y: 0 };
  };

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
        const staticPos = getDicePosition(index);
        
        const spin = anim.rotate.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg']
        });

        // Si on est en train de lancer ET que ce dé n'est pas locked, utiliser l'animation
        // Sinon, utiliser les positions statiques
        const shouldAnimate = isRolling && !dice.locked && dice.value;

        return (
          <Animated.View
            key={dice.id || index}
            style={[
              styles.diceContainer,
              shouldAnimate ? {
                transform: [
                  { translateX: anim.x },
                  { translateY: anim.y },
                  { rotate: spin },
                  { scale: anim.scale },
                ]
              } : {
                transform: [
                  { translateX: staticPos.x },
                  { translateY: staticPos.y },
                ]
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
              disabled={!dice.value}
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
    width: 60,
    height: 60,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#2C2C2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  lockedDice: {
    backgroundColor: "#CCCCCC",
    borderColor: "#666666",
  },
  emptyDice: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCCCCC",
    opacity: 0.5,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#2C2C2C",
    position: 'absolute',
  },
  'top-left': {
    top: 10,
    left: 10,
  },
  'top-right': {
    top: 10,
    right: 10,
  },
  'center': {
    top: '50%',
    left: '50%',
    marginTop: -5,
    marginLeft: -5,
  },
  'middle-left': {
    top: '50%',
    left: 10,
    marginTop: -5,
  },
  'middle-right': {
    top: '50%',
    right: 10,
    marginTop: -5,
  },
  'bottom-left': {
    bottom: 10,
    left: 10,
  },
  'bottom-right': {
    bottom: 10,
    right: 10,
  },
});

export default DiceRollingArea;
