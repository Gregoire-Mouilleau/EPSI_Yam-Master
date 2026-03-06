import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, StyleSheet, Animated } from "react-native";

const Dice = ({ index, locked, value, onPress, opponent }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isRolling, setIsRolling] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    // Détecter quand le dé change de valeur (nouveau lancer)
    if (value !== prevValue.current && value !== '' && !locked) {
      setIsRolling(true);
      
      // Animation de rotation et d'échelle
      Animated.parallel([
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(scaleAnim, {
            toValue: 1.2,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
          }),
        ]),
      ]).start();

      // Animation des valeurs qui changent rapidement
      let counter = 0;
      const interval = setInterval(() => {
        setDisplayValue(String(Math.floor(Math.random() * 6) + 1));
        counter += 50;
        if (counter >= 550) {
          clearInterval(interval);
          setDisplayValue(value);
          setIsRolling(false);
        }
      }, 50);

      return () => clearInterval(interval);
    }
    
    if (value === '') {
      setDisplayValue('');
    } else if (!isRolling) {
      setDisplayValue(value);
    }
    
    prevValue.current = value;
  }, [value, locked]);

  const handlePress = () => {
    if (!opponent) {
      onPress(index);
    }
  };

  const renderDots = (value) => {
    if (!value || value === '') return null;

    const dots = [];
    const val = parseInt(value);

    // Configuration des positions des points pour chaque face
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

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Animated.View
      style={{
        transform: [
          { rotate: spin },
          { scale: scaleAnim }
        ]
      }}
    >
      <TouchableOpacity
        style={[
          styles.dice, 
          locked && styles.lockedDice,
          !displayValue && styles.emptyDice,
          isRolling && styles.rollingDice
        ]}
        onPress={handlePress}
        disabled={opponent || !displayValue || isRolling}
      >
        {renderDots(displayValue)}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  dice: {
    width: 50,
    height: 50,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2C2C2C",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    position: 'relative',
  },
  lockedDice: {
    backgroundColor: "#CCCCCC",
    borderColor: "#666666",
  },
  emptyDice: {
    backgroundColor: "#F5F5F5",
    borderColor: "#CCCCCC",
  },
  rollingDice: {
    backgroundColor: "#FFF8DC",
    borderColor: "#FFD700",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2C2C2C",
    position: 'absolute',
  },
  // Positions des points
  'top-left': {
    top: 8,
    left: 8,
  },
  'top-right': {
    top: 8,
    right: 8,
  },
  'center': {
    top: '50%',
    left: '50%',
    marginTop: -4,
    marginLeft: -4,
  },
  'middle-left': {
    top: '50%',
    left: 8,
    marginTop: -4,
  },
  'middle-right': {
    top: '50%',
    right: 8,
    marginTop: -4,
  },
  'bottom-left': {
    bottom: 8,
    left: 8,
  },
  'bottom-right': {
    bottom: 8,
    right: 8,
  },
});

export default Dice;
