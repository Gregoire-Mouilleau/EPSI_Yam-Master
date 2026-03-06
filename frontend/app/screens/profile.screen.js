import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import Background from '../components/Background';
import { AuthContext } from '../contexts/auth.context';
import { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY, getAvatarSource } from '../constants/avatars';

const PAPER_SPECKLES = [
  { top: '7%', left: '9%', size: 3, opacity: 0.2 },
  { top: '11%', left: '44%', size: 2, opacity: 0.14 },
  { top: '15%', left: '77%', size: 4, opacity: 0.18 },
  { top: '19%', left: '27%', size: 2, opacity: 0.16 },
  { top: '24%', left: '63%', size: 3, opacity: 0.16 },
  { top: '31%', left: '84%', size: 2, opacity: 0.22 },
  { top: '37%', left: '14%', size: 3, opacity: 0.17 },
  { top: '42%', left: '52%', size: 2, opacity: 0.12 },
  { top: '48%', left: '71%', size: 3, opacity: 0.19 },
  { top: '54%', left: '36%', size: 2, opacity: 0.15 },
  { top: '61%', left: '88%', size: 4, opacity: 0.12 },
  { top: '67%', left: '16%', size: 2, opacity: 0.2 },
  { top: '73%', left: '58%', size: 3, opacity: 0.14 },
  { top: '79%', left: '41%', size: 2, opacity: 0.17 },
  { top: '86%', left: '75%', size: 3, opacity: 0.16 },
  { top: '90%', left: '23%', size: 2, opacity: 0.22 },
];

export default function ProfileScreen({ navigation }) {
  const {
    isAuthLoading,
    user,
    login,
    register,
    logout,
    updateAvatar,
    updateProfile,
  } = useContext(AuthContext);

  const [mode, setMode] = useState('login');
  const [pseudo, setPseudo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedAvatarKey, setSelectedAvatarKey] = useState(DEFAULT_AVATAR_KEY);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editPseudo, setEditPseudo] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [message, setMessage] = useState('');

  const isRegisterMode = mode === 'register';

  useEffect(() => {
    if (user?.pseudo) {
      setEditPseudo(user.pseudo);
    }
  }, [user]);

  const canSubmit = useMemo(() => {
    const baseValid = pseudo.trim().length >= 3 && password.length >= 8 && !isSubmitting;
    if (!baseValid) return false;
    if (!isRegisterMode) return true;
    return confirmPassword === password;
  }, [pseudo, password, confirmPassword, isSubmitting, isRegisterMode]);

  const canSaveProfile = useMemo(() => {
    if (!user || isSavingProfile) return false;
    
    // Bouton toujours actif si pseudo valide (3+ chars)
    const trimmedPseudo = editPseudo.trim();
    if (trimmedPseudo.length >= 3) return true;
    
    return false;
  }, [user, isSavingProfile, editPseudo]);

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

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setMessage('');

    const trimmedPseudo = editPseudo.trim();

    // Validation basique
    if (trimmedPseudo.length < 3) {
      setIsSavingProfile(false);
      setMessage('⚠️ Le pseudo doit contenir au moins 3 caractères');
      return;
    }

    // Validation mots de passe si remplis
    if (newPassword.length > 0) {
      if (newPassword !== confirmNewPassword) {
        setIsSavingProfile(false);
        setMessage('⚠️ Les mots de passe ne correspondent pas');
        return;
      }
      if (newPassword.length < 8) {
        setIsSavingProfile(false);
        setMessage('⚠️ Le mot de passe doit contenir au moins 8 caractères');
        return;
      }
      if (currentPassword.length === 0) {
        setIsSavingProfile(false);
        setMessage('⚠️ Mot de passe actuel requis pour changer le mot de passe');
        return;
      }
    }

    // TOUJOURS envoyer le pseudo + mots de passe si présents
    const payload = {
      pseudo: trimmedPseudo,
    };

    if (newPassword.length >= 8 && currentPassword.length > 0) {
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }

    const result = await updateProfile(payload);

    setIsSavingProfile(false);

    if (!result.success) {
      setMessage(`❌ ${result.message || 'Impossible de mettre à jour le profil'}`);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setMessage('✅ Profil mis à jour avec succès !');
  };

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.frameGlow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Retour</Text>
          </TouchableOpacity>

          <View style={styles.topBanner}>
            <Text style={styles.topBannerEmoji}>🎲</Text>
            <Text style={styles.topBannerTitle}>MON PROFIL</Text>
          </View>

          <View style={styles.panel}>
            <View pointerEvents="none" style={styles.paperTextureLayer}>
              <View style={styles.paperWash} />
              {PAPER_SPECKLES.map((speckle, index) => (
                <View
                  key={`paper-speckle-${index}`}
                  style={[
                    styles.paperSpeckle,
                    {
                      top: speckle.top,
                      left: speckle.left,
                      width: speckle.size,
                      height: speckle.size,
                      opacity: speckle.opacity,
                    },
                  ]}
                />
              ))}
              <View style={[styles.paperStain, styles.paperStainTopLeft]} />
              <View style={[styles.paperStain, styles.paperStainTopRight]} />
              <View style={[styles.paperStain, styles.paperStainBottom]} />
              <View style={[styles.paperBurn, styles.paperBurnOne]} />
              <View style={[styles.paperBurn, styles.paperBurnTwo]} />
              <View style={[styles.paperFiber, styles.paperFiberOne]} />
              <View style={[styles.paperFiber, styles.paperFiberTwo]} />
              <View style={styles.paperInnerFrame} />
              <View style={styles.paperEdgeDarken} />
            </View>

            {isAuthLoading ? (
              <ActivityIndicator size="large" color="#8B4513" style={styles.loading} />
            ) : user ? (
              <View style={styles.userBox}>
                <View style={styles.profileTopCard}>
                  <View pointerEvents="none" style={styles.topCardSparkles}>
                    <Text style={[styles.sparkle, styles.sparkleOne]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sparkleTwo]}>✦</Text>
                    <Text style={[styles.sparkle, styles.sparkleThree]}>✦</Text>
                  </View>

                  <View style={styles.currentUserInfo}>
                    <View style={styles.avatarFrame}>
                      <Image source={getAvatarSource(user.avatarKey)} style={styles.currentAvatar} />
                    </View>

                    <View style={styles.usernameSlot}>
                      <Text style={styles.profileNameValue}>{user.pseudo}</Text>
                    </View>

                    <View style={styles.eloBadge}>
                      <Text style={styles.eloLabel}>ELO</Text>
                      <Text style={styles.eloValue}>{user.elo}</Text>
                      <Text style={styles.eloCoin}>🪙</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>1</Text>
                    <Text style={styles.sectionTitle}>Infos du compte</Text>
                  </View>
                  <Text style={styles.label}>Pseudo</Text>
                  <View style={styles.currentPseudoHint}>
                    <Text style={styles.currentPseudoHintText}>Actuel : {user.pseudo}</Text>
                  </View>
                  <TextInput
                    value={editPseudo}
                    onChangeText={setEditPseudo}
                    style={styles.input}
                    placeholder="Pseudo (3-20, lettres/chiffres/_ )"
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>2</Text>
                    <Text style={styles.sectionTitle}>Sécurité</Text>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityCol}>
                      <Text style={styles.label}>Mot de passe actuel</Text>
                      <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={styles.input}
                        placeholder="Laisser vide si inchangé"
                        placeholderTextColor="rgba(90, 44, 13, 0.55)"
                        secureTextEntry
                      />
                    </View>
                    <View style={styles.securityCol}>
                      <Text style={styles.label}>Nouveau mot de passe</Text>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={styles.input}
                        placeholder="Minimum 8 caractères"
                        placeholderTextColor="rgba(90, 44, 13, 0.55)"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    style={styles.input}
                    placeholder="Retaper le nouveau mot de passe"
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    secureTextEntry
                  />
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>3</Text>
                    <Text style={styles.sectionTitle}>Photo de profil</Text>
                  </View>
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
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>4</Text>
                    <Text style={styles.sectionTitle}>Actions</Text>
                  </View>

                  <View style={styles.actionsWrap}>
                    <TouchableOpacity
                      style={[styles.actionButton, !canSaveProfile && styles.disabledButtonLook]}
                      onPress={handleSaveProfile}
                    >
                      <Text style={styles.actionButtonText}>ENREGISTRER LES MODIFS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                      <Text style={styles.secondaryButtonText}>SE DÉCONNECTER</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.userBox}>
                <View style={styles.modeRow}>
                  <TouchableOpacity
                    style={[styles.modeButton, !isRegisterMode && styles.modeButtonActive]}
                    onPress={() => {
                      setMode('login');
                      setMessage('');
                    }}
                  >
                    <Text style={[styles.modeButtonText, !isRegisterMode && styles.modeButtonTextActive]}>
                      SE CONNECTER
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.modeButton, isRegisterMode && styles.modeButtonActive]}
                    onPress={() => {
                      setMode('register');
                      setMessage('');
                    }}
                  >
                    <Text style={[styles.modeButtonText, isRegisterMode && styles.modeButtonTextActive]}>
                      S'INSCRIRE
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>1</Text>
                    <Text style={styles.sectionTitle}>Connexion</Text>
                  </View>

                  <TextInput
                    value={pseudo}
                    onChangeText={setPseudo}
                    style={styles.input}
                    placeholder="Pseudo (3-20, lettres/chiffres/_ )"
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    autoCapitalize="none"
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    placeholder="Mot de passe (min 8 caractères)"
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    secureTextEntry
                  />
                </View>

                {isRegisterMode && (
                  <View style={styles.ruleBlock}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleNumber}>2</Text>
                      <Text style={styles.sectionTitle}>Inscription</Text>
                    </View>

                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                      placeholder="Confirmer le mot de passe"
                      placeholderTextColor="rgba(90, 44, 13, 0.55)"
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
                  </View>
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
              </View>
            )}

            {!!message && <Text style={styles.message}>{message}</Text>}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 16,
  },
  frameGlow: {
    width: '100%',
    maxWidth: 980,
    borderRadius: 34,
    borderWidth: 5,
    borderColor: '#D89A2E',
    backgroundColor: 'rgba(70, 11, 0, 0.76)',
    paddingHorizontal: 12,
    paddingTop: 72,
    paddingBottom: 16,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 22,
  },
  backButton: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(122, 23, 7, 0.98)',
    borderColor: '#F9BC29',
    borderWidth: 2,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 17,
    zIndex: 40,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  backButtonText: {
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 0.4,
  },
  topBanner: {
    position: 'absolute',
    top: -28,
    left: 16,
    right: 16,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7B1F0F',
    borderWidth: 3,
    borderColor: '#E1A02C',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 20,
    gap: 8,
    shadowColor: '#FBBF24',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  topBannerEmoji: {
    fontSize: 30,
  },
  topBannerTitle: {
    color: '#FDE047',
    fontSize: 34,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  panel: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 24,
    backgroundColor: '#EFD2A0',
    borderWidth: 3.4,
    borderColor: '#D69832',
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  paperTextureLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  paperWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 240, 205, 0.52)',
  },
  paperSpeckle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#7A4B1D',
  },
  paperStain: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(128, 75, 24, 0.16)',
  },
  paperStainTopLeft: {
    width: 220,
    height: 110,
    top: -18,
    left: -28,
    transform: [{ rotate: '-12deg' }],
  },
  paperStainTopRight: {
    width: 170,
    height: 90,
    top: 48,
    right: -42,
    opacity: 0.7,
    transform: [{ rotate: '18deg' }],
  },
  paperStainBottom: {
    width: 280,
    height: 120,
    bottom: -44,
    left: 40,
    opacity: 0.6,
    transform: [{ rotate: '6deg' }],
  },
  paperBurn: {
    position: 'absolute',
    backgroundColor: 'rgba(92, 44, 12, 0.12)',
    borderRadius: 999,
  },
  paperBurnOne: {
    width: 100,
    height: 38,
    top: 96,
    right: 56,
    transform: [{ rotate: '-25deg' }],
  },
  paperBurnTwo: {
    width: 130,
    height: 44,
    bottom: 84,
    left: -16,
    transform: [{ rotate: '22deg' }],
  },
  paperFiber: {
    position: 'absolute',
    borderRadius: 20,
    backgroundColor: 'rgba(145, 82, 34, 0.2)',
  },
  paperFiberOne: {
    width: '85%',
    height: 2,
    top: '30%',
    left: '8%',
  },
  paperFiberTwo: {
    width: '72%',
    height: 2,
    top: '64%',
    right: '6%',
    opacity: 0.85,
  },
  paperInnerFrame: {
    ...StyleSheet.absoluteFillObject,
    top: 8,
    bottom: 8,
    left: 8,
    right: 8,
    borderWidth: 1,
    borderColor: 'rgba(123, 71, 26, 0.26)',
    borderRadius: 14,
  },
  paperEdgeDarken: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 11,
    borderColor: 'rgba(95, 49, 13, 0.15)',
    borderRadius: 18,
  },
  loading: {
    paddingVertical: 40,
  },
  userBox: {
    gap: 8,
  },
  profileTopCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 2.2,
    borderColor: '#D59A34',
    backgroundColor: '#6D2110',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 3,
  },
  topCardSparkles: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  sparkle: {
    position: 'absolute',
    color: '#FDE68A',
    fontSize: 15,
    textShadowColor: 'rgba(255, 234, 165, 0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 9,
  },
  sparkleOne: {
    top: 10,
    left: 180,
  },
  sparkleTwo: {
    top: 56,
    right: 170,
    fontSize: 13,
  },
  sparkleThree: {
    bottom: 16,
    left: 28,
    fontSize: 11,
  },
  currentAvatarRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 10,
  },
  currentUserInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 2,
  },
  avatarFrame: {
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 3,
    borderColor: '#F2C14A',
    backgroundColor: '#5B1408',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 7,
  },
  currentAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 2,
    borderColor: '#F5D17B',
  },
  usernameSlot: {
    flex: 1,
    minHeight: 56,
    borderRadius: 14,
    borderWidth: 1.6,
    borderColor: 'rgba(247, 195, 86, 0.45)',
    backgroundColor: 'rgba(113, 28, 11, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  profileNameValue: {
    color: '#F9E08F',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 0.4,
  },
  eloBadge: {
    minWidth: 136,
    minHeight: 96,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(100, 23, 10, 0.95)',
    borderWidth: 2.4,
    borderColor: '#F1B63E',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    zIndex: 2,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  eloLabel: {
    color: '#FDE68A',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.9,
  },
  eloValue: {
    color: '#FFF6C7',
    fontSize: 32,
    fontWeight: 'bold',
  },
  eloCoin: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    fontSize: 20,
    opacity: 0.88,
  },
  ruleBlock: {
    backgroundColor: 'rgba(246, 222, 178, 0.95)',
    borderWidth: 2,
    borderColor: '#CE903A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.16,
    shadowRadius: 3,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  ruleNumber: {
    width: 34,
    height: 34,
    lineHeight: 30,
    borderRadius: 10,
    backgroundColor: '#B91C1C',
    borderWidth: 2,
    borderColor: '#F59E0B',
    textAlign: 'center',
    color: '#FDE047',
    fontWeight: 'bold',
    fontSize: 22,
  },
  sectionTitle: {
    color: '#5B2100',
    fontWeight: 'bold',
    fontSize: 34,
  },
  label: {
    color: '#78350F',
    fontWeight: 'bold',
    marginTop: 3,
    marginBottom: 4,
    fontSize: 17,
  },
  pseudoInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  changesBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  changesBadgeText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  currentPseudoHint: {
    marginBottom: 3,
  },
  currentPseudoHintText: {
    color: '#92400E',
    fontSize: 13,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  securityRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  securityCol: {
    flex: 1,
    minWidth: 240,
  },
  input: {
    borderWidth: 1.8,
    borderColor: '#C08024',
    backgroundColor: 'rgba(255, 245, 214, 0.92)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: '#3F1D00',
    fontWeight: '600',
    marginBottom: 8,
    fontSize: 15,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#B45309',
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#FAE9BF',
  },
  modeButtonActive: {
    backgroundColor: '#F59E0B',
  },
  modeButtonText: {
    color: '#7C2D12',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.4,
  },
  modeButtonTextActive: {
    color: '#FFF8DB',
  },
  buttonsRow: {
    gap: 10,
  },
  actionsWrap: {
    alignItems: 'center',
    gap: 9,
    paddingBottom: 2,
  },
  actionButton: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#8E1E13',
    borderWidth: 2.4,
    borderColor: '#E4A12F',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#FACC15',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  secondaryButton: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: 'rgba(249, 232, 189, 0.85)',
    borderWidth: 2,
    borderColor: '#C88D30',
    borderRadius: 999,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 6,
  },
  debugButton: {
    width: '100%',
    maxWidth: 540,
    backgroundColor: '#7C3AED',
    borderWidth: 2,
    borderColor: '#A78BFA',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledButtonLook: {
    opacity: 0.7,
  },
  actionButtonText: {
    color: '#FDE047',
    fontWeight: 'bold',
    letterSpacing: 0.9,
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#7C2D12',
    fontWeight: 'bold',
    letterSpacing: 0.7,
    fontSize: 14,
  },
  debugButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    fontSize: 13,
  },
  message: {
    color: '#5A2100',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'left',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: 'rgba(251, 233, 195, 0.95)',
    borderWidth: 2,
    borderColor: '#D4A65A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: '#8B5A2B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 6,
  },
  avatarOption: {
    borderRadius: 28,
    borderWidth: 2.4,
    borderColor: '#CC8F31',
    backgroundColor: '#F4D9A0',
    padding: 2,
  },
  avatarOptionSelected: {
    borderColor: '#7C2D12',
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  avatarOptionImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
});
