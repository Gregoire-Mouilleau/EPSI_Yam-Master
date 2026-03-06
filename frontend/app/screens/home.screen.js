import React, { useContext, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Animated, Easing, Platform } from "react-native";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Background from "../components/Background";
import FloatingDice from "../components/FloatingDice";
import Header from "../components/Header";
import Logo from "../components/Logo";
import GameButton from "../components/GameButton";
import { SocketContext } from "../contexts/socket.context";
import { AuthContext } from "../contexts/auth.context";
import styles from "./home.styles";
import { getHomeTexts } from "../i18n";

const BACKGROUND_MUSIC_ASSET = require('../../assets/musique_background.mp3');

export default function HomeScreen({ navigation }) {
  const socket = useContext(SocketContext);
  const { user, logout } = useContext(AuthContext);
  const [hoverOnline, setHoverOnline] = useState(false);
  const [hoverBot, setHoverBot] = useState(false);
  const [hoverProfile, setHoverProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [musicVolume, setMusicVolume] = useState(50);
  const [language, setLanguage] = useState('FR');
  const musicRef = useRef(null);
  const settingsRotate = useRef(new Animated.Value(0)).current;
  const settingsFloat = useRef(new Animated.Value(0)).current;
  const settingsScale = useRef(new Animated.Value(1)).current;
  const settingsHoverLoopRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    let removeWebUnlockListeners = null;

    const startMusic = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_MUSIC_ASSET,
          {
            shouldPlay: true,
            isLooping: true,
            volume: musicVolume / 100,
          }
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        musicRef.current = sound;

        const tryPlaySound = async () => {
          try {
            await sound.playAsync();
          } catch (error) {
            // Sur web, Chrome peut exiger une interaction utilisateur.
          }
        };

        await tryPlaySound();

        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const unlockOnInteraction = () => {
            tryPlaySound();
          };

          window.addEventListener('pointerdown', unlockOnInteraction);
          window.addEventListener('keydown', unlockOnInteraction);
          window.addEventListener('touchstart', unlockOnInteraction);

          removeWebUnlockListeners = () => {
            window.removeEventListener('pointerdown', unlockOnInteraction);
            window.removeEventListener('keydown', unlockOnInteraction);
            window.removeEventListener('touchstart', unlockOnInteraction);
          };
        }
      } catch (error) {
        console.log('Impossible de lancer la musique de fond:', error);
      }
    };

    startMusic();

    return () => {
      isMounted = false;

      if (removeWebUnlockListeners) {
        removeWebUnlockListeners();
      }

      const sound = musicRef.current;
      musicRef.current = null;

      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    const updateMusicVolume = async () => {
      if (!musicRef.current) return;

      try {
        await musicRef.current.setVolumeAsync(musicVolume / 100);
      } catch (error) {
        console.log('Impossible de mettre à jour le volume:', error);
      }
    };

    updateMusicVolume();
  }, [musicVolume]);

  const ensureMusicPlayback = () => {
    if (musicRef.current) {
      musicRef.current.playAsync().catch(() => {});
    }
  };

  const decreaseVolume = () => {
    setMusicVolume((prev) => Math.max(0, prev - 10));
  };

  const increaseVolume = () => {
    setMusicVolume((prev) => Math.min(100, prev + 10));
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'FR' ? 'EN' : 'FR'));
  };

  const handleDisconnect = async () => {
    ensureMusicPlayback();
    if (socket && socket.connected) {
      socket.disconnect();
    }
    await logout();
  };

  const handleOpenSettings = () => {
    ensureMusicPlayback();
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
          ensureMusicPlayback();
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
            icon="🎮"
            title={texts.playOnline}
            onPress={() => {
              ensureMusicPlayback();
              navigation.navigate('OnlineGameScreen');
            }}
            isHovered={hoverOnline}
            onHoverIn={() => setHoverOnline(true)}
            onHoverOut={() => setHoverOnline(false)}
          />
          
          <GameButton
            icon="🤖"
            title={texts.playVsBot}
            onPress={() => {
              ensureMusicPlayback();
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
              <Text style={styles.settingsPanelTitle}>{texts.settingsTitle}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowSettings(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>{texts.musicVolume}</Text>
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
              <Text style={styles.settingLabel}>{texts.language}</Text>
              <TouchableOpacity style={styles.inlineActionButton} onPress={toggleLanguage}>
                <Text style={styles.inlineActionButtonText}>{language}</Text>
              </TouchableOpacity>
            </View>

            {!!user && (
              <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
                <Text style={styles.disconnectButtonText}>{texts.disconnect}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

