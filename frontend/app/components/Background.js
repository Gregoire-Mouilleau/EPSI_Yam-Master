import React from "react";
import { View } from "react-native";
import styles from './Background.styles';

export default function Background() {
  return (
    <View style={styles.background}>
      <View style={styles.patternLayer} />
      <View style={styles.gradientOverlay} />
    </View>
  );
}
