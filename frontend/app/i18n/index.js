import fr from './fr.json';
import en from './en.json';

const DICTIONARIES = {
  FR: fr,
  EN: en,
};

export function getHomeTexts(language = 'FR') {
  const normalized = String(language).toUpperCase();
  return DICTIONARIES[normalized] || DICTIONARIES.FR;
}

export function getLeaderboardTexts(language = 'FR') {
  const normalized = String(language).toUpperCase();
  const dict = DICTIONARIES[normalized] || DICTIONARIES.FR;
  return {
    title: dict.leaderboardTitle,
    yourRank: dict.leaderboardYourRank,
    topPercentage: dict.leaderboardTopPercentage,
    topPlayers: dict.leaderboardTopPlayers,
    back: dict.leaderboardBack,
    loading: dict.leaderboardLoading,
    retry: dict.leaderboardRetry,
  };
}
