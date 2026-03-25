import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import { Platform } from 'react-native';

const BACKGROUND_MUSIC_ASSET = require('../../assets/musique_background.mp3');

const MusicContext = createContext({ musicVolume: 50, setMusicVolume: () => {} });

export function MusicProvider({ children }) {
  const [musicVolume, setMusicVolume] = useState(50);
  const soundRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const tryPlay = async () => {
      const s = soundRef.current;
      if (!s) return;
      try {
        const status = await s.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await s.playAsync();
        }
      } catch (_) {}
    };

    const initMusic = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        // Charger sans autoplay pour éviter le blocage navigateur
        const { sound } = await Audio.Sound.createAsync(
          BACKGROUND_MUSIC_ASSET,
          { shouldPlay: false, isLooping: true, volume: 0.5 }
        );

        if (!isMounted) {
          await sound.unloadAsync();
          return;
        }

        soundRef.current = sound;

        // Tentative immédiate (fonctionne sur mobile, silencieuse sur web)
        await tryPlay();

        // Sur web : dès la première interaction utilisateur, on démarre la musique
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
          const unlock = async () => {
            await tryPlay();
            // Vérifier si ça a marché et retirer les listeners
            const s = soundRef.current;
            if (s) {
              const status = await s.getStatusAsync().catch(() => null);
              if (status && status.isPlaying) {
                document.removeEventListener('click', unlock);
                document.removeEventListener('keydown', unlock);
                document.removeEventListener('touchstart', unlock);
                document.removeEventListener('pointerdown', unlock);
              }
            }
          };
          document.addEventListener('click', unlock);
          document.addEventListener('keydown', unlock);
          document.addEventListener('touchstart', unlock);
          document.addEventListener('pointerdown', unlock);
        }
      } catch (e) {
        console.log('[Music] Impossible de démarrer la musique de fond:', e);
      }
    };

    initMusic();

    return () => {
      isMounted = false;
      const s = soundRef.current;
      soundRef.current = null;
      if (s) s.unloadAsync();
    };
  }, []);

  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current.setVolumeAsync(musicVolume / 100).catch(() => {});
  }, [musicVolume]);

  return (
    <MusicContext.Provider value={{ musicVolume, setMusicVolume }}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusicContext() {
  return useContext(MusicContext);
}
