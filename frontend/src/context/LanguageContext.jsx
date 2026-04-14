import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'pcm', label: 'Pidgin', flag: '🇳🇬' },
];

export const LanguageProvider = ({ children }) => {
  const { user } = useAuth();
  const [currentLang, setCurrentLang] = useState(user?.preferredLanguage || 'en');
  const [translationCache, setTranslationCache] = useState({});
  const [translating, setTranslating] = useState(false);

  const changeLang = useCallback(async (langCode) => {
    setCurrentLang(langCode);
    // Persist to user profile
    try {
      await api.put('/auth/updatedetails', { preferredLanguage: langCode });
    } catch (e) {
      console.warn('Could not persist language preference:', e.message);
    }
  }, []);

  const translate = useCallback(async (text, targetLang = null) => {
    const lang = targetLang || currentLang;
    if (lang === 'en') return text;
    
    // Check cache
    const cacheKey = `${text.substring(0, 50)}_${lang}`;
    if (translationCache[cacheKey]) return translationCache[cacheKey];

    setTranslating(true);
    try {
      const res = await api.post('/ai/translate', { text, targetLang: lang });
      const translated = res.data?.data?.translated || text;
      
      setTranslationCache(prev => ({ ...prev, [cacheKey]: translated }));
      return translated;
    } catch (e) {
      console.warn('Translation failed:', e.message);
      return text;
    } finally {
      setTranslating(false);
    }
  }, [currentLang, translationCache]);

  const value = {
    currentLang,
    changeLang,
    translate,
    translating,
    languages: LANGUAGES,
    isEnglish: currentLang === 'en',
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
