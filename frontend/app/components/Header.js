import React, { useState } from "react";
import {
  TouchableOpacity, Text, Image, Platform, View,
  useWindowDimensions, Modal, ScrollView, Pressable,
} from "react-native";
import styles from './Header.styles';
import { getAvatarSource } from "../constants/avatars";

export default function Header({
  isHovered,
  onHoverIn,
  onHoverOut,
  onProfilePress,
  onLeaderboardPress,
  profileLabel = 'PROFIL',
  isAuthenticated = false,
  avatarKey = 'avatar_1',
  hideDecorations = false,
}) {
  const { width, height } = useWindowDimensions();
  const showDecorations = width >= 700 && !hideDecorations;
  const scale = Math.min(1, width / 1200);
  const [menuOpen, setMenuOpen] = useState(false);

  const mascotW = 360 * scale;
  const mascotH = 270 * scale;
  const eloSize = 550 * scale;
  const rulesSize = 423 * scale;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {showDecorations && (
        <Image
          source={require('../../assets/mascotte.png')}
          style={[styles.mascot, { width: mascotW, height: mascotH }]}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}

      {showDecorations ? (
        <TouchableOpacity
          style={[
            styles.eloTouchable,
            {
              width: eloSize,
              height: eloSize,
              top: height / 2,
              transform: [{ translateY: -(eloSize / 2) }],
            },
          ]}
          onPress={onLeaderboardPress}
          activeOpacity={0.8}
        >
          <Image
            source={require('../../assets/elo.png')}
            style={styles.eloBadge}
            resizeMode="contain"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setMenuOpen(true)}
          activeOpacity={0.8}
        >
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
          <View style={styles.hamburgerBar} />
        </TouchableOpacity>
      )}

      {showDecorations && (
        <Image
          source={require('../../assets/regles.png')}
          style={[
            styles.rulesBadge,
            {
              width: rulesSize,
              height: rulesSize,
              top: height / 2,
              transform: [{ translateY: -(rulesSize / 2) }],
            },
          ]}
          resizeMode="contain"
          pointerEvents="none"
        />
      )}

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

      {/* Bottom-sheet menu for small screens */}
      <Modal
        visible={menuOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setMenuOpen(false)}
      >
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <Pressable style={styles.menuPanel}>
            <View style={styles.menuHandle} />
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>🎮 Navigation</Text>
              <TouchableOpacity style={styles.menuClose} onPress={() => setMenuOpen(false)}>
                <Text style={styles.menuCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => { setMenuOpen(false); onLeaderboardPress(); }}
              >
                <View style={styles.menuItem}>
                  <Image
                    source={require('../../assets/elo.png')}
                    style={styles.menuBadgeImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.menuItemLabel}>🏆 Classement</Text>
                </View>
              </TouchableOpacity>

              <View style={styles.menuItem}>
                <Image
                  source={require('../../assets/regles.png')}
                  style={styles.menuBadgeImage}
                  resizeMode="contain"
                />
                <Text style={styles.menuItemLabel}>📜 Règles du jeu</Text>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

