import React, { useEffect, useState } from "react";
import { Animated, Dimensions } from "react-native";
import styles from './FloatingDice.styles';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SCREEN_WIDTH = Dimensions.get('window').width;
const FALL_SPEED_FACTOR = 0.48;
const DICE_SIZE = 60;

export default function FloatingDice() {
  const [dices, setDices] = useState([]);

  const removeDice = (diceId) => {
    setDices((prev) => prev.filter((dice) => dice.id !== diceId));
  };

  useEffect(() => {
    // Créer des dés à intervalles réguliers
    const interval = setInterval(() => {
      const startX = Math.random() * (SCREEN_WIDTH - DICE_SIZE);
      const newDice = {
        id: Date.now() + Math.random(),
        x: startX,
        anim: new Animated.Value(-DICE_SIZE),
        animX: new Animated.Value(startX),
        rotation: Math.random() * 360,
        velocityY: 0,
        velocityX: (Math.random() - 0.5) * 1.6,
      };
      
      setDices(prev => [...prev.slice(-9), newDice]); // Garde max 10 dés
      
      // Animation de chute simple en arrière-plan
      animateFalling(newDice.anim, newDice.animX, newDice, removeDice);
    }, 1500); // Nouveau dé toutes les 1.5 secondes

    return () => clearInterval(interval);
  }, []);

  const animateFalling = (animY, animX, dice, onDespawn) => {
    let currentY = -DICE_SIZE;
    let currentX = dice.x;
    let velocityY = 1.35 * FALL_SPEED_FACTOR;
    let velocityX = dice.velocityX * 0.55;
    const gravity = 0.18 * FALL_SPEED_FACTOR;
    const maxFallSpeed = 3.1 * FALL_SPEED_FACTOR;
    const horizontalDrag = 0.999;
    let isDespawning = false;

    const despawn = () => {
      if (isDespawning) return;
      isDespawning = true;
      onDespawn(dice.id);
    };

    const fall = () => {
      velocityY = Math.min(maxFallSpeed, velocityY + gravity);
      velocityX *= horizontalDrag;

      currentY += velocityY;
      currentX += velocityX;

      if (currentX < -DICE_SIZE) currentX = SCREEN_WIDTH;
      if (currentX > SCREEN_WIDTH) currentX = -DICE_SIZE;

      // Si sort de l'écran, despawn
      if (currentY > SCREEN_HEIGHT) {
        despawn();
        return;
      }

      animY.setValue(currentY);
      animX.setValue(currentX);

      requestAnimationFrame(fall);
    };

    fall();
  };

  return (
    <>
      {dices.map(dice => (
        <Animated.Text
          key={dice.id}
          pointerEvents="none"
          style={[
            styles.dice,
            {
              left: dice.animX,
              transform: [
                { translateY: dice.anim },
                { rotate: `${dice.rotation}deg` }
              ],
            },
          ]}
        >
          🎲
        </Animated.Text>
      ))}
    </>
  );
}
