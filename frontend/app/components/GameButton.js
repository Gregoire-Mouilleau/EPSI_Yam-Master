import React from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";

export default function GameButton({ title, icon, onPress, isHovered, onHoverIn, onHoverOut }) {
  return (
    <TouchableOpacity
      style={[styles.button, isHovered && styles.buttonHovered]}
      onPress={onPress}
      onMouseEnter={Platform.OS === 'web' ? onHoverIn : undefined}
      onMouseLeave={Platform.OS === 'web' ? onHoverOut : undefined}
      activeOpacity={0.8}
    >
      <Text style={[styles.buttonIcon, isHovered && styles.buttonIconHovered]}>
        {icon}
      </Text>
      <Text style={[styles.buttonText, isHovered && styles.buttonTextHovered]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC143C',
    paddingVertical: 20,
    paddingHorizontal: 50,
    borderRadius: 60,
    minWidth: 380,
    borderWidth: 5,
    borderColor: '#FFD700',
    borderBottomWidth: 8,
    borderRightWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 15,
    transform: [{ scale: 1 }],
    transition: Platform.OS === 'web' ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : undefined,
    position: 'relative',
    overflow: 'visible',
  },
  buttonHovered: {
    backgroundColor: '#FFD700',
    transform: [{ scale: 1.08 }, { translateY: -4 }],
    borderColor: '#FFF',
    borderBottomWidth: 6,
    shadowColor: '#FFD700',
    shadowOpacity: 1,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 15 },
  },
  buttonIcon: {
    fontSize: 32,
    marginRight: 15,
    transition: Platform.OS === 'web' ? 'all 0.3s ease' : undefined,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  buttonIconHovered: {
    transform: [{ scale: 1.3 }, { rotate: '15deg' }],
    textShadowColor: 'rgba(139, 0, 0, 0.8)',
    textShadowRadius: 10,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
    textTransform: 'uppercase',
  },
  buttonTextHovered: {
    color: '#8B0000',
    textShadowColor: 'rgba(255, 215, 0, 0.5)',
    textShadowRadius: 8,
  },
});
