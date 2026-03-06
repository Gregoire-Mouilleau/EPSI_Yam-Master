import React, { useState, useContext, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";

const OpponentDeck = ({ opponentDices = [] }) => {
  const socket = useContext(SocketContext);
  const [displayOpponentDeck, setDisplayOpponentDeck] = useState(false);

  useEffect(() => {
    socket.on("game.deck.view-state", (data) => {
      setDisplayOpponentDeck(data['displayOpponentDeck']);
    });

    return () => {
      socket.off("game.deck.view-state");
    };
  }, []);

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
    <View style={styles.deckOpponentContainer}>
      {displayOpponentDeck ? (
        <View style={styles.opponentSection}>
          <View style={styles.turnIndicator}>
            <Text style={styles.turnText}>⏳ Tour de l'adversaire</Text>
          </View>
          <View style={styles.dicesContainer}>
            {opponentDices.map((dice, index) => (
              <View
                key={dice.id || index}
                style={[
                  styles.dice,
                  dice.locked && styles.lockedDice,
                  !dice.value && styles.emptyDice
                ]}
              >
                {renderDots(dice.value)}
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.turnIndicator}>
          <Text style={styles.yourTurnText}>✨ À votre tour !</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  deckOpponentContainer: {
    width: '100%',
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  opponentSection: {
    alignItems: 'center',
  },
  turnIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#D4AF37',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 8,
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFB84D',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  yourTurnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#32CD32',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dicesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dice: {
    width: 35,
    height: 35,
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#2C2C2C",
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
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#2C2C2C",
    position: 'absolute',
  },
  'top-left': {
    top: 6,
    left: 6,
  },
  'top-right': {
    top: 6,
    right: 6,
  },
  'center': {
    top: '50%',
    left: '50%',
    marginTop: -2.5,
    marginLeft: -2.5,
  },
  'middle-left': {
    top: '50%',
    left: 6,
    marginTop: -2.5,
  },
  'middle-right': {
    top: '50%',
    right: 6,
    marginTop: -2.5,
  },
  'bottom-left': {
    bottom: 6,
    left: 6,
  },
  'bottom-right': {
    bottom: 6,
    right: 6,
  },
});

export default OpponentDeck;
