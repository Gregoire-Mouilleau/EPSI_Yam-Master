import React, { useEffect, useRef, useState } from "react";
import { View, TouchableOpacity, Animated, Platform } from "react-native";
import styles from './dice.styles';

const DOT_POSITIONS = {
  1: ['center'],
  2: ['top-left', 'bottom-right'],
  3: ['top-left', 'center', 'bottom-right'],
  4: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
  5: ['top-left', 'top-right', 'center', 'bottom-left', 'bottom-right'],
  6: ['top-left', 'top-right', 'middle-left', 'middle-right', 'bottom-left', 'bottom-right'],
};

const Dice = ({ index, locked, value, onPress, opponent }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isRolling, setIsRolling] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current && value !== '' && !locked) {
      setIsRolling(true);

      Animated.parallel([
        Animated.sequence([
          Animated.timing(rotateAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(rotateAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.25, friction: 3, tension: 40, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, tension: 40, useNativeDriver: true }),
        ]),
      ]).start();

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

  const renderDots = (val) => {
    if (!val || val === '') return null;
    const positions = DOT_POSITIONS[parseInt(val)] || [];
    const dotColor = locked ? '#FFE090' : '#6B0000';
    return positions.map((pos, idx) => (
      <View key={idx} style={[styles.dot, styles[pos], { backgroundColor: dotColor }]} />
    ));
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Faux effet 3D via gradient CSS (web uniquement)
  const webStyle = Platform.OS === 'web' ? {
    backgroundImage: locked
      ? 'linear-gradient(135deg, #E8AA30 0%, #C48A18 55%, #9A6A08 100%)'
      : isRolling
      ? 'linear-gradient(135deg, #FFFDE0 0%, #FFF0A0 50%, #F0D860 100%)'
      : 'linear-gradient(145deg, #FFF8E8 0%, #F5E4BB 45%, #E4CDA0 100%)',
    boxShadow: locked
      ? '3px 5px 0px #6A4A06, 5px 8px 18px rgba(0,0,0,0.55), inset 1px 1px 3px rgba(255,240,160,0.6)'
      : isRolling
      ? '2px 4px 0px #9B8020, 0 0 22px rgba(255,220,60,0.75), inset 1px 1px 3px rgba(255,255,200,0.8)'
      : '3px 5px 0px #7A5A14, 5px 8px 18px rgba(20,5,0,0.45), inset 1px 1px 3px rgba(255,248,230,0.7)',
  } : {};

  return (
    <Animated.View style={{ transform: [{ rotate: spin }, { scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[
          styles.dice,
          locked && styles.lockedDice,
          !displayValue && styles.emptyDice,
          isRolling && styles.rollingDice,
          webStyle,
        ]}
        onPress={() => !opponent && onPress(index)}
        disabled={opponent || !displayValue || isRolling}
        activeOpacity={0.75}
      >
        {renderDots(displayValue)}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default Dice;