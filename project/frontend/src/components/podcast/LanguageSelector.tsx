import React from 'react';
import { Globe } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../../types/ai';

interface LanguageSelectorProps {
  selectedLanguage: Language;
  onLanguageSelect: (language: Language) => void;
}

export const LanguageSelector = ({ selectedLanguage, onLanguageSelect }: LanguageSelectorProps) => {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <Globe className="h-5 w-5 text-gray-500" />
      <select
        value={selectedLanguage.code}
        onChange={(e) => {
          const language = SUPPORTED_LANGUAGES.find(lang => lang.code === e.target.value);
          if (language) onLanguageSelect(language);
        }}
        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
      >
        {SUPPORTED_LANGUAGES.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
};