
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
        // In a real build system, these files would be in a public folder.
        // For this environment, we assume they are accessible at this path.
        const response = await fetch(`locales/${language}.json`);
        if (!response.ok) {
            console.error(`Could not load ${language}.json, falling back to English.`);
            throw new Error(`Could not load ${language}.json`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error("Failed to load translations, loading English fallback:", error);
        try {
            const fallbackResponse = await fetch(`locales/en.json`);
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
        } catch (fallbackError) {
            console.error("Failed to load English fallback translations:", fallbackError);
            setTranslations({}); // No translations available
        }
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
