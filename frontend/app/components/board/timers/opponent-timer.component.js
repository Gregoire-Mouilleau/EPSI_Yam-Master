import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SocketContext } from '../../../contexts/socket.context';

const OpponentTimer = () => {
  const socket = useContext(SocketContext);
  const [opponentTimer, setOpponentTimer] = useState(0);

  useEffect(() => {
    socket.on("game.timer", (data) => {
      setOpponentTimer(data['opponentTimer']);
    });

    return () => {
      socket.off("game.timer");
    };
  }, []);

  return (
    <View style={styles.opponentTimerContainer}>
      <Text style={styles.timerText}>Timer: {opponentTimer}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  opponentTimerContainer: {
    padding: 10,
    backgroundColor: '#FF5722',
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

export default OpponentTimer;
