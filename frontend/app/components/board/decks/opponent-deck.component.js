import React from "react";
import { View, Text } from "react-native";
import { useLanguage } from '../../../contexts/language.context';
import styles from './opponent-deck.styles';

const OpponentDeck = ({ displayOpponentDeck = false }) => {
  const { t } = useLanguage();
  return (
    <View style={styles.deckOpponentContainer}>
      {displayOpponentDeck ? (
        <View style={styles.turnIndicator}>
          <Text style={styles.turnText}>{t('opponentTurn')}</Text>
        </View>
      ) : (
        <View style={styles.turnIndicator}>
          <Text style={styles.yourTurnText}>{t('yourTurn')}</Text>
        </View>
      )}
    </View>
  );
};

export default OpponentDeck;
