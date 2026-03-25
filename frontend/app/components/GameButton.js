import React from "react";
import { TouchableOpacity, Text, Image, Platform } from "react-native";
import styles from './GameButton.styles';

export default function GameButton({ title, icon, iconImage, onPress, isHovered, onHoverIn, onHoverOut }) {
  return (
    <TouchableOpacity
      style={[styles.button, isHovered && styles.buttonHovered]}
      onPress={onPress}
      onMouseEnter={Platform.OS === 'web' ? onHoverIn : undefined}
      onMouseLeave={Platform.OS === 'web' ? onHoverOut : undefined}
      activeOpacity={0.8}
    >
      {iconImage ? (
        <Image
          source={iconImage}
          style={[styles.buttonIconImage, isHovered && styles.buttonIconImageHovered]}
          resizeMode="contain"
        />
      ) : (
        <Text style={[styles.buttonIcon, isHovered && styles.buttonIconHovered]}>
          {icon}
        </Text>
      )}
      <Text style={[styles.buttonText, isHovered && styles.buttonTextHovered]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}
