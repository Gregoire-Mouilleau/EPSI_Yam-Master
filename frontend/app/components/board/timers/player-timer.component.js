import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';

const PlayerTimer = () => {
  const socket = useContext(SocketContext);
  const [playerTimer, setPlayerTimer] = useState(0);

  useEffect(() => {
    socket.on("game.timer", (data) => {
      setPlayerTimer(data['playerTimer']);
    });

    return () => {
      socket.off("game.timer");
    };
  }, []);

  return (
    <View style={styles.playerTimerContainer}>
      <Text style={styles.timerText}>Timer: {playerTimer}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  playerTimerContainer: {
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
  },
  timerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default PlayerTimer;
