import React, { useState, useContext, useEffect } from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { SocketContext } from "../../../contexts/socket.context";
import { useLanguage } from '../../../contexts/language.context';
import styles from './player-deck.styles';
import Dice from "./dice.component";

const PlayerDeck = () => {

  const socket = useContext(SocketContext);
  const { t } = useLanguage();
  const [displayPlayerDeck, setDisplayPlayerDeck] = useState(false);
  const [dices, setDices] = useState(Array(5).fill(false));
  const [displayRollButton, setDisplayRollButton] = useState(false);
  const [rollsCounter, setRollsCounter] = useState(0);
  const [rollsMaximum, setRollsMaximum] = useState(3);

  useEffect(() => {

    socket.on("game.deck.view-state", (data) => {
      setDisplayPlayerDeck(data['displayPlayerDeck']);
      if (data['displayPlayerDeck']) {
        setDisplayRollButton(data['displayRollButton']);
        setRollsCounter(data['rollsCounter']);
        setRollsMaximum(data['rollsMaximum']);
        setDices(data['dices']);
      }
    });

    return () => {
      socket.off("game.deck.view-state");
    };
  }, []);

  const toggleDiceLock = (index) => {
    const newDices = [...dices];
    if (newDices[index].value !== '' && displayRollButton) {
      socket.emit("game.dices.lock", newDices[index].id);
    }
  };

  const rollDices = () => {
    if (rollsCounter <= rollsMaximum) {
      socket.emit("game.dices.roll");
    }
  };

  return (

    <View style={styles.deckPlayerContainer}>

      {displayPlayerDeck && (

        <>
          <View style={styles.rollInfoContainer}>
            <Text style={styles.rollInfoText}>
              {t('playerRollLabel')} {rollsCounter - 1} / {rollsMaximum}
            </Text>
          </View>

          {displayRollButton && (
            <TouchableOpacity style={styles.rollButton} onPress={rollDices}>
              <Text style={styles.rollButtonText}>{t('playerRollButton')}</Text>
            </TouchableOpacity>
          )}
        </>
      )}

    </View>
  );
};

export default PlayerDeck;
