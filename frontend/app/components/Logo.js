import React from "react";
import { View, Image } from "react-native";
import styles from './Logo.styles';

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
