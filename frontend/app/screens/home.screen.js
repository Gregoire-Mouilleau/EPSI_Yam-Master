import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Background from "../components/Background";
import FloatingDice from "../components/FloatingDice";
import Header from "../components/Header";
import Logo from "../components/Logo";
import GameButton from "../components/GameButton";
import { SocketContext } from "../contexts/socket.context";
import { AuthContext } from "../contexts/auth.context";
import { LanguageContext } from "../contexts/language.context";
import { useMusicContext } from "../contexts/music.context";
import styles from "./home.styles";
import { getHomeTexts } from "../i18n";

export default function HomeScreen({ navigation }) {
  const socket = useContext(SocketContext);
  const { user, logout } = useContext(AuthContext);
  const { language, toggleLanguage } = useContext(LanguageContext);
  const { musicVolume, setMusicVolume } = useMusicContext();
  const [hoverOnline, setHoverOnline] = useState(false);
  const [hoverBot, setHoverBot] = useState(false);
  const [hoverProfile, setHoverProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const settingsRotate = useRef(new Animated.Value(0)).current;
  const settingsFloat = useRef(new Animated.Value(0)).current;
  const settingsScale = useRef(new Animated.Value(1)).current;
  const settingsHoverLoopRef = useRef(null);

  const decreaseVolume = () => setMusicVolume((prev) => Math.max(0, prev - 10));
  const increaseVolume = () => setMusicVolume((prev) => Math.min(100, prev + 10));

  const handleDisconnect = async () => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
    await logout();
  };

  const handleOpenSettings = () => {
    setShowSettings((prev) => !prev);
  };

  const startSettingsHoverAnimation = () => {
    if (settingsHoverLoopRef.current) return;

    settingsRotate.setValue(0);

    Animated.timing(settingsScale, {
      toValue: 1.08,
      duration: 140,
      useNativeDriver: true,
    }).start();

    settingsHoverLoopRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(settingsRotate, {
          toValue: 1,
          duration: 650,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(settingsFloat, {
            toValue: -4,
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(settingsFloat, {
            toValue: 3,
            duration: 180,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(settingsFloat, {
            toValue: 0,
            duration: 150,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    settingsHoverLoopRef.current.start();
  };

  const stopSettingsHoverAnimation = () => {
    if (settingsHoverLoopRef.current) {
      settingsHoverLoopRef.current.stop();
      settingsHoverLoopRef.current = null;
    }

    settingsRotate.stopAnimation(() => settingsRotate.setValue(0));

    Animated.parallel([
      Animated.timing(settingsFloat, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(settingsScale, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  };

  useEffect(() => {
    return () => {
      if (settingsHoverLoopRef.current) {
        settingsHoverLoopRef.current.stop();
        settingsHoverLoopRef.current = null;
      }
    };
  }, []);

  const settingsRotation = settingsRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const texts = getHomeTexts(language);

  return (
    <View style={styles.container}>
      <Background />
      <FloatingDice />
      <Header 
        isHovered={hoverProfile}
        onHoverIn={() => setHoverProfile(true)}
        onHoverOut={() => setHoverProfile(false)}
        onProfilePress={() => navigation.navigate('ProfileScreen')}
        onLeaderboardPress={() => {
          navigation.navigate('LeaderboardScreen');
        }}
        profileLabel={user ? user.pseudo : texts.signIn}
        isAuthenticated={!!user}
        avatarKey={user?.avatarKey}
      />

      <View style={styles.content}>
        <Logo />

        <View style={styles.buttonsContainer}>
          <GameButton
            iconImage={require('../../assets/logo.png')}
            title={texts.playOnline}
            onPress={() => {
              if (!user) {
                navigation.navigate('ProfileScreen');
                return;
              }
              navigation.navigate('OnlineGameScreen');
            }}
            isHovered={hoverOnline}
            onHoverIn={() => setHoverOnline(true)}
            onHoverOut={() => setHoverOnline(false)}
          />
          
          <GameButton
            iconImage={require('../../assets/mascotte.png')}
            title={texts.playVsBot}
            onPress={() => {
              if (!user) {
                navigation.navigate('ProfileScreen');
                return;
              }
              navigation.navigate('VsBotGameScreen');
            }}
            isHovered={hoverBot}
            onHoverIn={() => setHoverBot(true)}
            onHoverOut={() => setHoverBot(false)}
          />
        </View>

        <View style={styles.decorativeElements}>
          <View style={styles.chipGroup}>
            <Text style={styles.chip}>🎲</Text>
            <Text style={styles.chip}>🏆</Text>
            <Text style={styles.chip}>🎲</Text>
          </View>
        </View>
      </View>

      <View style={styles.settingsArea}>
        <TouchableOpacity
          style={styles.settingsEmojiTouch}
          onPress={handleOpenSettings}
          onMouseEnter={Platform.OS === 'web' ? startSettingsHoverAnimation : undefined}
          onMouseLeave={Platform.OS === 'web' ? stopSettingsHoverAnimation : undefined}
          activeOpacity={0.85}
        >
          <Animated.View
            style={[
              styles.settingsEmoji,
              {
                transform: [
                  { translateY: settingsFloat },
                  { scale: settingsScale },
                  { rotate: settingsRotation },
                ],
              },
            ]}
          >
            <MaterialCommunityIcons name="cog" size={62} color="#B8BDC6" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {showSettings && (
        <View style={styles.settingsOverlay}>
          <View style={styles.settingsPanel}>
            <View style={styles.settingsHeaderRow}>
              <View style={styles.settingsTitleContainer}>
                <Text style={styles.settingsTitleEmoji}>⚙️</Text>
                <Text style={styles.settingsPanelTitle}>{texts.settingsTitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingsDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingEmoji}>🎵</Text>
                <Text style={styles.settingLabel}>{texts.musicVolume}</Text>
              </View>
              <View style={styles.volumeControls}>
                <TouchableOpacity style={styles.smallControlButton} onPress={decreaseVolume}>
                  <Text style={styles.smallControlButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.settingValue}>{musicVolume}%</Text>
                <TouchableOpacity style={styles.smallControlButton} onPress={increaseVolume}>
                  <Text style={styles.smallControlButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLabelRow}>
                <Text style={styles.settingEmoji}>🌍</Text>
                <Text style={styles.settingLabel}>{texts.language}</Text>
              </View>
              <TouchableOpacity style={styles.inlineActionButton} onPress={toggleLanguage}>
                <Text style={styles.inlineActionButtonText}>{language}</Text>
              </TouchableOpacity>
            </View>

            {!!user && (
              <View>
                <View style={styles.settingsDivider} />
                <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                  <Text style={styles.disconnectButtonEmoji}></Text>
                  <Text style={styles.disconnectButtonText}>{texts.disconnect}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

