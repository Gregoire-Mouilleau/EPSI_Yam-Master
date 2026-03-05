import React, { useContext, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import Background from '../components/Background';
import { AuthContext } from '../contexts/auth.context';
import { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY, getAvatarSource } from '../constants/avatars';

export default function ProfileScreen({ navigation }) {
  const { isAuthLoading, user, login, register, logout, updateAvatar } = useContext(AuthContext);
  const [mode, setMode] = useState('login');
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const isRegisterMode = mode === 'register';

  const canSubmit = useMemo(() => {
    const baseValid = pseudo.trim().length >= 3 && password.length >= 8 && !isSubmitting;
    if (!baseValid) return false;
    if (!isRegisterMode) return true;
    return confirmPassword === password;
  }, [pseudo, password, confirmPassword, isSubmitting, isRegisterMode]);

  const handleRegister = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setMessage('');

    if (password !== confirmPassword) {
      setIsSubmitting(false);
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    const result = await register({
      pseudo: pseudo.trim(),
      password,
      avatarKey: selectedAvatarKey,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setMessage(result.message || 'Inscription impossible');
      return;
    }

    setMessage('Compte créé et connecté ✅');
    navigation.navigate('HomeScreen');
  };

  const handleLogin = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setMessage('');

    const result = await login({ pseudo: pseudo.trim(), password });
    setIsSubmitting(false);

    if (!result.success) {
      setMessage(result.message || 'Connexion impossible');
      return;
    }

    setMessage('Connexion réussie ✅');
    navigation.navigate('HomeScreen');
  };

  const handleLogout = async () => {
    await logout();
    setMessage('Déconnecté');
  };

  const handleSelectAvatar = async (avatarKey) => {
    const result = await updateAvatar(avatarKey);
    if (!result.success) {
      setMessage(result.message || 'Impossible de changer la photo');
      return;
    }
    setMessage('Photo de profil mise à jour ✅');
  };

  return (
    <View style={styles.container}>
      <Background />

      <View style={styles.content}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Retour</Text>
        </TouchableOpacity>

        <View style={styles.panel}>
          <Text style={styles.title}>PROFIL</Text>

          {isAuthLoading ? (
            <ActivityIndicator size="large" color="#FFD700" />
          ) : user ? (
            <View style={styles.userBox}>
              <View style={styles.currentAvatarRow}>
                <Image source={getAvatarSource(user.avatarKey)} style={styles.currentAvatar} />
              </View>

              <Text style={styles.label}>Pseudo</Text>
              <Text style={styles.value}>{user.pseudo}</Text>

              <Text style={styles.label}>ELO</Text>
              <Text style={styles.value}>{user.elo}</Text>

              <Text style={styles.label}>Photo de profil</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((avatar) => {
                  const isSelected = user.avatarKey === avatar.key;
                  return (
                    <TouchableOpacity
                      key={avatar.key}
                      style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                      onPress={() => handleSelectAvatar(avatar.key)}
                    >
                      <Image source={avatar.source} style={styles.avatarOptionImage} />
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
                <Text style={styles.actionButtonText}>SE DÉCONNECTER</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.modeRow}>
                <TouchableOpacity
                  style={[styles.modeButton, !isRegisterMode && styles.modeButtonActive]}
                  onPress={() => {
                    setMode('login');
                    setMessage('');
                  }}
                >
                  <Text style={[styles.modeButtonText, !isRegisterMode && styles.modeButtonTextActive]}>SE CONNECTER</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modeButton, isRegisterMode && styles.modeButtonActive]}
                  onPress={() => {
                    setMode('register');
                    setMessage('');
                  }}
                >
                  <Text style={[styles.modeButtonText, isRegisterMode && styles.modeButtonTextActive]}>S'INSCRIRE</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                value={pseudo}
                onChangeText={setPseudo}
                style={styles.input}
                placeholder="Pseudo (3-20, lettres/chiffres/_ )"
                placeholderTextColor="rgba(255,255,255,0.6)"
                autoCapitalize="none"
              />

              <TextInput
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                placeholder="Mot de passe (min 8 caractères)"
                placeholderTextColor="rgba(255,255,255,0.6)"
                secureTextEntry
              />

              {isRegisterMode && (
                <>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    style={styles.input}
                    placeholder="Confirmer le mot de passe"
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    secureTextEntry
                  />

                  <Text style={styles.label}>Choisir une photo de profil</Text>
                  <View style={styles.avatarGrid}>
                    {AVATAR_OPTIONS.map((avatar) => {
                      const isSelected = selectedAvatarKey === avatar.key;
                      return (
                        <TouchableOpacity
                          key={avatar.key}
                          style={[styles.avatarOption, isSelected && styles.avatarOptionSelected]}
                          onPress={() => setSelectedAvatarKey(avatar.key)}
                        >
                          <Image source={avatar.source} style={styles.avatarOptionImage} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={styles.buttonsRow}>
                {!isRegisterMode ? (
                  <TouchableOpacity
                    style={[styles.actionButton, !canSubmit && styles.disabledButton]}
                    onPress={handleLogin}
                    disabled={!canSubmit}
                  >
                    <Text style={styles.actionButtonText}>SE CONNECTER</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionButton, !canSubmit && styles.disabledButton]}
                    onPress={handleRegister}
                    disabled={!canSubmit}
                  >
                    <Text style={styles.actionButtonText}>CRÉER PROFIL</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}

          {!!message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 20,
    backgroundColor: 'rgba(139, 0, 0, 0.55)',
    borderColor: '#FFD700',
    borderWidth: 2,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  panel: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFD700',
    padding: 20,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  title: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: 2,
  },
  input: {
    borderWidth: 2,
    borderColor: '#FFD700',
    backgroundColor: 'rgba(139, 0, 0, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    marginBottom: 12,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.08)',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.28)',
  },
  modeButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.8,
  },
  modeButtonTextActive: {
    color: '#8B0000',
  },
  buttonsRow: {
    gap: 10,
  },
  actionButton: {
    backgroundColor: 'rgba(139, 0, 0, 0.6)',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#FFD700',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  message: {
    color: '#FFF',
    marginTop: 14,
    textAlign: 'center',
  },
  userBox: {
    gap: 8,
  },
  currentAvatarRow: {
    alignItems: 'center',
    marginBottom: 6,
  },
  currentAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  label: {
    color: '#FFD700',
    fontWeight: 'bold',
    marginTop: 6,
  },
  value: {
    color: '#FFF',
    fontSize: 18,
    marginBottom: 4,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  avatarOption: {
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.35)',
    padding: 2,
  },
  avatarOptionSelected: {
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  avatarOptionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
