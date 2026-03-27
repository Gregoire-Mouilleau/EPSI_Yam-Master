import React from "react";
import { View, Image, useWindowDimensions } from "react-native";
import styles from './Logo.styles';

export default function Logo() {
  const { width } = useWindowDimensions();
  const logoW = Math.min(width * 0.75, 600);
  const logoH = logoW * (406 / 811);

  return (
    <View style={styles.logoWrapper}>
      <Image
        source={require('../../assets/logo.png')}
        style={[styles.centerLogo, { width: logoW, height: logoH }]}
        resizeMode="contain"
      />
    </View>
  );
}

