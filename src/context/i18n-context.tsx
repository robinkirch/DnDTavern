'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import en from '@/locales/en.json';
import de from '@/locales/de.json';

type Language = 'en' | 'de';
type Translations = typeof en;

const translations: Record<Language, Translations> = { en, de };

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: keyof Translations, options?: { [key: string]: string | number }) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('tavern-lang') as Language | null;
    if (storedLang && ['en', 'de'].includes(storedLang)) {
      setLanguage(storedLang);
    } else {
        const browserLang = navigator.language.split('-')[0];
        if(browserLang === 'de') {
            setLanguage('de');
        }
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    localStorage.setItem('tavern-lang', lang);
    setLanguage(lang);
    // This is a simple way to force a re-render of the layout to get the new language
    // In a more complex app, you might handle this differently.
    document.documentElement.lang = lang;
  };

  const t = useCallback((key: keyof Translations, options?: { [key: string]: string | number }) => {
    let translation = translations[language][key] || translations['en'][key] || key;
    
    if (options) {
      Object.keys(options).forEach(optionKey => {
        translation = translation.replace(`{{${optionKey}}}`, String(options[optionKey]));
      });
    }

    return translation;
  }, [language]);

  return (
    <I18nContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
