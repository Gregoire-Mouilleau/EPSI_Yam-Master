import React, { useContext, useEffect, useState, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';
import { useLanguage } from '../../../contexts/language.context';
import styles from './Timer.styles';

const CONFIGS = {
  player: {
    dataKey: 'playerTimer',
    labelKey: 'timerPlayerTurn',
    activeColor: '#32CD32',
    labelBg: 'rgba(34, 139, 34, 0.85)',
  },
  opponent: {
    dataKey: 'opponentTimer',
    labelKey: 'timerOpponentTurn',
    activeColor: '#FF6B4A',
    labelBg: 'rgba(139, 0, 0, 0.85)',
  },
};

const Timer = ({ type }) => {
  const config = CONFIGS[type];
  const socket = useContext(SocketContext);
  const { t } = useLanguage();
  const [timer, setTimer] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    socket.on('game.timer', (data) => {
      setTimer(data[config.dataKey]);
    });
    return () => { socket.off('game.timer'); };
  }, []);

  useEffect(() => {
    if (timer > 0 && timer <= 10) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        ])
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, { toValue: 1, duration: 400, useNativeDriver: false }),
          Animated.timing(glowAnim, { toValue: 0, duration: 400, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [timer]);

  const getTimerColor = () => {
    if (timer === 0) return '#666666';
    if (timer <= 10) return '#FF4444';
    if (timer <= 20) return '#FFA500';
    return config.activeColor;
  };

  const isActive = timer > 0;
  const isUrgent = timer > 0 && timer <= 10;

  return (
    <View style={styles.container}>
      <View style={[styles.labelContainer, { backgroundColor: config.labelBg }, !isActive && styles.inactiveLabel]}>
        <Text style={styles.labelText}>{t(config.labelKey)}</Text>
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
              outputRange: ['#FFD700', '#FF4444'],
            }),
          },
        ]}
      >
        <Text style={[styles.timerValue, { color: getTimerColor() }]}>
          {timer === 0 ? '--' : timer}
        </Text>
        <Text style={styles.timerUnit}>{t('timerSec')}</Text>
      </Animated.View>
    </View>
  );
};

export default Timer;
