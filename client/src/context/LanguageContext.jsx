import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../constants/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
    // Load from local storage or default to 'es'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('app_language');
        return saved || 'es';
    });

    useEffect(() => {
        localStorage.setItem('app_language', language);
    }, [language]);

    // Translation function
    const t = (key) => {
        const keys = key.split('.');
        let value = translations[language];

        for (const k of keys) {
            value = value?.[k];
            if (!value) break;
        }

        return value || key; // Fallback to key if not found
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'es' ? 'en' : 'es');
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
