import React from "react";
import { TouchableOpacity, Text, Image, StyleSheet, Platform, View, Dimensions } from "react-native";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Header({ isHovered, onHoverIn, onHoverOut, onProfilePress, profileLabel = 'PROFIL' }) {
  return (
    <View>
      <Image
        source={require('../../assets/mascotte.png')}
        style={styles.mascot}
        resizeMode="contain"
      />

      <Image
        source={require('../../assets/elo.png')}
        style={styles.eloBadge}
        resizeMode="contain"
      />

      <TouchableOpacity
        style={[styles.profileButton, isHovered && styles.profileButtonHovered]}
        onPress={onProfilePress}
        onMouseEnter={Platform.OS === 'web' ? onHoverIn : undefined}
        onMouseLeave={Platform.OS === 'web' ? onHoverOut : undefined}
      >
        <Text style={styles.profileIcon}>👤</Text>
        <Text style={styles.profileText}>{profileLabel}</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  profileButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#FFD700',
    borderBottomWidth: 4,
    zIndex: 100,
    transition: Platform.OS === 'web' ? 'all 0.3s ease' : undefined,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
  },
  profileButtonHovered: {
    backgroundColor: 'rgba(255, 215, 0, 0.4)',
    borderColor: '#FFF',
    transform: [{ scale: 1.08 }],
    shadowColor: '#FFD700',
    shadowOpacity: 0.9,
    shadowRadius: 20,
  },
  profileIcon: {
    fontSize: 26,
    marginRight: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  profileText: {
    color: '#FFD700',
    fontSize: 15,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mascot: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 360,
    height: 270,
    opacity: 0.95,
    zIndex: 100,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  eloBadge: {
    position: 'absolute',
    top: SCREEN_HEIGHT / 2,
    right: -80,
    transform: [{ translateY: -212 }],
    width: 423,
    height: 423,
    zIndex: 100,
    shadowColor: 'rgba(0, 0, 0, 0.5)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
