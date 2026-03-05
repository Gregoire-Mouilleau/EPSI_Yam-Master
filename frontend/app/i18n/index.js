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
