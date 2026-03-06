import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const LanguageContext = createContext();

const LANGUAGE_STORAGE_KEY = '@app_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('FR'); // Default to French
  const [isLoading, setIsLoading] = useState(true);

  // Load language from storage on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (savedLanguage) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, []);

  // Save language to storage whenever it changes
  const setLanguage = async (newLanguage) => {
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'FR' ? 'EN' : 'FR';
    setLanguage(newLanguage);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};
