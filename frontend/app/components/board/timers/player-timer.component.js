import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';

const PlayerTimer = () => {
  const socket = useContext(SocketContext);
  const [playerTimer, setPlayerTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    socket.on("game.timer", (data) => {
      setPlayerTimer(data['playerTimer']);
    });

    return () => {
      socket.off("game.timer");
    };
  }, []);

  // Animation de pulsation quand le temps est bas
  useEffect(() => {
    if (playerTimer > 0 && playerTimer <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [playerTimer]);

  const getTimerColor = () => {
    if (playerTimer === 0) return '#666666';
    if (playerTimer <= 10) return '#FF4444';
    if (playerTimer <= 20) return '#FFA500';
    return '#32CD32';
  };

  const formatTime = (seconds) => {
    if (seconds === 0) return '--';
    return seconds;
  };

  const isActive = playerTimer > 0;
  const isUrgent = playerTimer > 0 && playerTimer <= 10;

  return (
    <View style={styles.container}>
      <View style={[styles.labelContainer, !isActive && styles.inactiveLabel]}>
        <Text style={styles.labelText}>⏱️ TON TOUR</Text>
      </View>
      
      <Animated.View
        style={[
          styles.timerBox,
          !isActive && styles.inactiveBox,
          isUrgent && styles.urgentBox,
          {
            transform: [{ scale: pulseAnim }],
            borderColor: glowAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['#FFD700', '#FF4444']
            })
          }
        ]}
      >
        <Text style={[
          styles.timerValue,
          { color: getTimerColor() }
        ]}>
          {formatTime(playerTimer)}
        </Text>
        <Text style={styles.timerUnit}>sec</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  labelContainer: {
    backgroundColor: 'rgba(34, 139, 34, 0.85)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    marginBottom: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  inactiveLabel: {
    backgroundColor: 'rgba(50, 50, 50, 0.6)',
    borderColor: '#888888',
    shadowOpacity: 0,
  },
  labelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  timerBox: {
    width: 120,
    height: 120,
    backgroundColor: 'rgba(70, 11, 0, 0.95)',
    borderRadius: 60,
    borderWidth: 5,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
  },
  inactiveBox: {
    backgroundColor: 'rgba(40, 40, 40, 0.7)',
    borderColor: '#666666',
    shadowOpacity: 0.2,
  },
  urgentBox: {
    backgroundColor: 'rgba(139, 0, 0, 0.95)',
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#32CD32',
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  timerUnit: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
    marginTop: -5,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default PlayerTimer;
