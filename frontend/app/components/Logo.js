import React from "react";
import { View, Image, StyleSheet } from "react-native";

export default function Logo() {
  return (
    <View style={styles.logoWrapper}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.centerLogo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  centerLogo: {
    width: 811,
    height: 406,
    opacity: 0.95,
  },
});
