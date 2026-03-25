import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import styles from './profile.styles';
import FramedPage from '../components/FramedPage';
import { AuthContext } from '../contexts/auth.context';
import { useLanguage } from '../contexts/language.context';
import { AVATAR_OPTIONS, DEFAULT_AVATAR_KEY, getAvatarSource } from '../constants/avatars';
import { getRankFromElo, getNextRank, getProgressToNextRank, getEloToNextRank } from '../constants/ranks';

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
  const { t } = useLanguage();

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
      setMessage(t('profilePwMismatch'));
      return;
    }

    const result = await register({
      pseudo: pseudo.trim(),
      password,
      avatarKey: selectedAvatarKey,
    });
    setIsSubmitting(false);

    if (!result.success) {
      setMessage(result.message || t('profileRegisterFailed'));
      return;
    }

    setMessage(t('profileAccountCreated'));
    navigation.navigate('HomeScreen');
  };

  const handleLogin = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    setMessage('');

    const result = await login({ pseudo: pseudo.trim(), password });
    setIsSubmitting(false);

    if (!result.success) {
      setMessage(result.message || t('profileLoginFailed'));
      return;
    }

    setMessage(t('profileLoginSuccess'));
    navigation.navigate('HomeScreen');
  };

  const handleLogout = async () => {
    await logout();
    setMessage(t('profileLoggedOut'));
  };

  const handleSelectAvatar = async (avatarKey) => {
    const result = await updateAvatar(avatarKey);
    if (!result.success) {
      setMessage(result.message || t('profileAvatarFailed'));
      return;
    }
    setMessage(t('profileAvatarSuccess'));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setMessage('');

    const trimmedPseudo = editPseudo.trim();

    // Validation basique
    if (trimmedPseudo.length < 3) {
      setIsSavingProfile(false);
      setMessage(t('profilePseudoTooShort'));
      return;
    }

    // Validation mots de passe si remplis
    if (newPassword.length > 0) {
      if (newPassword !== confirmNewPassword) {
        setIsSavingProfile(false);
        setMessage(t('profilePwMismatchWarning'));
        return;
      }
      if (newPassword.length < 8) {
        setIsSavingProfile(false);
        setMessage(t('profilePwTooShort'));
        return;
      }
      if (currentPassword.length === 0) {
        setIsSavingProfile(false);
        setMessage(t('profileCurrentPwRequired'));
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
      setMessage(`❌ ${result.message || t('profileUpdateFailed')}`);
      return;
    }

    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setMessage(t('profileUpdateSuccess'));
  };

  return (
    <FramedPage navigation={navigation} emoji="🎲" title={t('profileTitle')} maxWidth={980}>
            {isAuthLoading ? (
              <ActivityIndicator size="large" color="#8B4513" style={styles.loading} />
            ) : user ? (
              <View style={styles.userBox}>
                {(() => {
                  const currentRank = getRankFromElo(user.elo);
                  const nextRank = getNextRank(user.elo);
                  const progress = getProgressToNextRank(user.elo);
                  const eloToNext = getEloToNextRank(user.elo);

                  return (
                    <>
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
                            <View style={styles.rankHeader}>
                              <Text style={[styles.rankEmoji]}>{currentRank.emoji}</Text>
                              <Text style={[styles.rankName, { color: currentRank.color }]}>
                                {currentRank.name}
                              </Text>
                            </View>
                            <Text style={styles.eloValue}>{user.elo} ELO</Text>
                            {nextRank && (
                              <>
                                <View style={styles.progressBarContainer}>
                                  <View style={[styles.progressBarFill, { width: `${progress}%`, backgroundColor: nextRank.color }]} />
                                </View>
                                <Text style={styles.eloToNext}>
                                  {eloToNext} pts → {nextRank.emoji} {nextRank.name}
                                </Text>
                              </>
                            )}
                            {!nextRank && (
                              <Text style={styles.maxRankText}>{t('profileMaxRank')}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </>
                  );
                })()}

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>1</Text>
                    <Text style={styles.sectionTitle}>{t('profileAccountInfo')}</Text>
                  </View>
                  <Text style={styles.label}>{t('profilePseudo')}</Text>
                  <View style={styles.currentPseudoHint}>
                    <Text style={styles.currentPseudoHintText}>{t('profileCurrentHint')} {user.pseudo}</Text>
                  </View>
                  <TextInput
                    value={editPseudo}
                    onChangeText={setEditPseudo}
                    style={styles.input}
                    placeholder={t('profilePseudoPlaceholder')}
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>2</Text>
                    <Text style={styles.sectionTitle}>{t('profileSecurity')}</Text>
                  </View>

                  <View style={styles.securityRow}>
                    <View style={styles.securityCol}>
                      <Text style={styles.label}>{t('profileCurrentPw')}</Text>
                      <TextInput
                        value={currentPassword}
                        onChangeText={setCurrentPassword}
                        style={styles.input}
                        placeholder={t('profileLeaveEmpty')}
                        placeholderTextColor="rgba(90, 44, 13, 0.55)"
                        secureTextEntry
                      />
                    </View>
                    <View style={styles.securityCol}>
                      <Text style={styles.label}>{t('profileNewPw')}</Text>
                      <TextInput
                        value={newPassword}
                        onChangeText={setNewPassword}
                        style={styles.input}
                        placeholder={t('profilePwMinChars')}
                        placeholderTextColor="rgba(90, 44, 13, 0.55)"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>{t('profileConfirmNewPw')}</Text>
                  <TextInput
                    value={confirmNewPassword}
                    onChangeText={setConfirmNewPassword}
                    style={styles.input}
                    placeholder={t('profileConfirmPwPlaceholder')}
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    secureTextEntry
                  />
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>3</Text>
                    <Text style={styles.sectionTitle}>{t('profileAvatarSection')}</Text>
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
                    <Text style={styles.sectionTitle}>{t('profileActionsSection')}</Text>
                  </View>

                  <View style={styles.actionsWrap}>
                    <TouchableOpacity
                      style={[styles.actionButton, !canSaveProfile && styles.disabledButtonLook]}
                      onPress={handleSaveProfile}
                    >
                      <Text style={styles.actionButtonText}>{t('profileSave')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
                      <Text style={styles.secondaryButtonText}>{t('disconnect')}</Text>
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
                      {t('signIn')}
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
                      {t('profileRegisterMode')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.ruleBlock}>
                  <View style={styles.ruleHeader}>
                    <Text style={styles.ruleNumber}>1</Text>
                    <Text style={styles.sectionTitle}>{t('profileLoginSection')}</Text>
                  </View>

                  <TextInput
                    value={pseudo}
                    onChangeText={setPseudo}
                    style={styles.input}
                    placeholder={t('profilePseudoPlaceholder')}
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    autoCapitalize="none"
                  />

                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    style={styles.input}
                    placeholder={t('profilePwPlaceholder')}
                    placeholderTextColor="rgba(90, 44, 13, 0.55)"
                    secureTextEntry
                  />
                </View>

                {isRegisterMode && (
                  <View style={styles.ruleBlock}>
                    <View style={styles.ruleHeader}>
                      <Text style={styles.ruleNumber}>2</Text>
                      <Text style={styles.sectionTitle}>{t('profileRegisterSection')}</Text>
                    </View>

                    <TextInput
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      style={styles.input}
                      placeholder={t('profileConfirmPwRegister')}
                      placeholderTextColor="rgba(90, 44, 13, 0.55)"
                      secureTextEntry
                    />

                    <Text style={styles.label}>{t('chooseAvatar')}</Text>
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
                      <Text style={styles.actionButtonText}>{t('signIn')}</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.actionButton, !canSubmit && styles.disabledButton]}
                      onPress={handleRegister}
                      disabled={!canSubmit}
                    >
                      <Text style={styles.actionButtonText}>{t('profileCreateAccount')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {!!message && <Text style={styles.message}>{message}</Text>}
    </FramedPage>
  );
}
