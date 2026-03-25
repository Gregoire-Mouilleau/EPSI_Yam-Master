import React from "react";
import { TouchableOpacity, Text, Image, Platform, View, Dimensions } from "react-native";
import styles from './Header.styles';
import { getAvatarSource } from "../constants/avatars";

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function Header({
  isHovered,
  onHoverIn,
  onHoverOut,
  onProfilePress,
  onLeaderboardPress,
  profileLabel = 'PROFIL',
  isAuthenticated = false,
  avatarKey = 'avatar_1',
}) {
  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Image
        source={require('../../assets/mascotte.png')}
        style={styles.mascot}
        resizeMode="contain"
        pointerEvents="none"
      />

      <TouchableOpacity
        style={styles.eloTouchable}
        onPress={onLeaderboardPress}
        activeOpacity={0.8}
      >
        <Image
          source={require('../../assets/elo.png')}
          style={styles.eloBadge}
          resizeMode="contain"
        />
      </TouchableOpacity>

      <Image
        source={require('../../assets/regles.png')}
        style={styles.rulesBadge}
        resizeMode="contain"
        pointerEvents="none"
      />

      <TouchableOpacity
        style={[styles.profileButton, isHovered && styles.profileButtonHovered]}
        onPress={onProfilePress}
        onMouseEnter={Platform.OS === 'web' ? onHoverIn : undefined}
        onMouseLeave={Platform.OS === 'web' ? onHoverOut : undefined}
      >
        {isAuthenticated ? (
          <Image source={getAvatarSource(avatarKey)} style={styles.profileAvatar} />
        ) : (
          <Text style={styles.profileIcon}>👤</Text>
        )}
        <Text style={styles.profileText}>{profileLabel}</Text>
      </TouchableOpacity>

    </View>
  );
}
