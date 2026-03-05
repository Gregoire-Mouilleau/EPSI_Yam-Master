export const AVATAR_OPTIONS = [
  { key: 'avatar_1', source: require('../../assets/profil/profil1.png') },
  { key: 'avatar_2', source: require('../../assets/profil/profil2.png') },
  { key: 'avatar_3', source: require('../../assets/profil/profil3.png') },
  { key: 'avatar_4', source: require('../../assets/profil/profil4.png') },
  { key: 'avatar_5', source: require('../../assets/profil/profil5.png') },
];

export const DEFAULT_AVATAR_KEY = 'avatar_1';

export function getAvatarSource(avatarKey) {
  const match = AVATAR_OPTIONS.find((item) => item.key === avatarKey);
  return (match || AVATAR_OPTIONS[0]).source;
}
