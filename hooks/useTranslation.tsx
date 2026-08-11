
import React, { createContext, useState, useContext, useEffect } from 'react';
import { Language } from '../types';

// Define the shape of the context
interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Define the provider component
export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(Language.English);
  const [translations, setTranslations] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`locales/${language}.json`);
        const contentType = response.headers.get('content-type') || '';
        if (response.ok && contentType.includes('application/json')) {
          const data = await response.json();
          setTranslations(data);
        } else {
          setTranslations({});
        }
      } catch (error) {
        setTranslations({});
      }
    };
    loadTranslations();
  }, [language]);

  const t = (key: string, fallback?: string): string => {
    return translations[key] || fallback || key;
  };

  const value = { language, setLanguage, t };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

// Define the custom hook
export const useTranslation = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
};
