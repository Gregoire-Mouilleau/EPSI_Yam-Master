import React from "react";
import { View, Text, StyleSheet } from "react-native";

const OpponentDeck = ({ displayOpponentDeck = false }) => {
  return (
    <View style={styles.deckOpponentContainer}>
      {displayOpponentDeck ? (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>⏳ Tour de l'adversaire</Text>
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
});

export default OpponentDeck;
