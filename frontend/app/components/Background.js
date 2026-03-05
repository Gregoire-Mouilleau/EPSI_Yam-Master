import React from "react";
import { View, StyleSheet, Platform } from "react-native";

export default function Background() {
  return (
    <View style={styles.background}>
      <View style={styles.patternLayer} />
      <View style={styles.gradientOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0a0a0a',
  },
  patternLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: Platform.OS === 'web' 
      ? 'repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(139, 0, 0, 0.1) 35px, rgba(139, 0, 0, 0.1) 70px), repeating-linear-gradient(-45deg, transparent, transparent 35px, rgba(255, 215, 0, 0.05) 35px, rgba(255, 215, 0, 0.05) 70px)'
      : undefined,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: Platform.OS === 'web'
      ? 'radial-gradient(ellipse at top, rgba(139, 0, 0, 0.4) 0%, transparent 60%), radial-gradient(ellipse at bottom, rgba(255, 215, 0, 0.2) 0%, transparent 60%), linear-gradient(180deg, rgba(10, 10, 10, 0.8) 0%, rgba(139, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0.9) 100%)'
      : undefined,
  },
});
