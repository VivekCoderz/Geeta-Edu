import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const translationCache = {};

export const AutoTranslate = ({ text }) => {
  const { user } = useAuth();
  const [translatedText, setTranslatedText] = useState(text);
  const targetLanguage = user?.preferredLanguage || 'English';

  useEffect(() => {
    let isMounted = true;

    const translate = async () => {
      // If English or no text, just display it
      if (!text || targetLanguage === 'English') {
        setTranslatedText(text);
        return;
      }

      const cacheKey = `${targetLanguage}:${text}`;
      
      // Check memory cache first
      if (translationCache[cacheKey]) {
        setTranslatedText(translationCache[cacheKey]);
        return;
      }
      
      // Check local storage cache
      try {
        const stored = localStorage.getItem(`trans_${cacheKey}`);
        if (stored) {
          translationCache[cacheKey] = stored;
          setTranslatedText(stored);
          return;
        }
      } catch (e) {}

      // Fetch from API
      try {
        const res = await api.post('/ai/tutor/translate', {
          text,
          targetLanguage
        });
        
        if (res.data.success && isMounted) {
          const result = res.data.data.translatedText;
          setTranslatedText(result);
          translationCache[cacheKey] = result;
          try {
            localStorage.setItem(`trans_${cacheKey}`, result);
          } catch (e) {}
        }
      } catch (err) {
        console.error("Translation failed", err);
        if (isMounted) setTranslatedText(text); // fallback to English
      }
    };

    translate();

    return () => {
      isMounted = false;
    };
  }, [text, targetLanguage]);

  return <>{translatedText}</>;
};

export default AutoTranslate;
