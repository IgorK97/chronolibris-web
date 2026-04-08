import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import translationRu from './locales/ru-RU/translations.json';

const resources = {
  'ru-RU': { translation: translationRu },
  ru: { translation: translationRu },
};

i18n
  //Автоматическое определение языка (куки, localStorage, язык браузера)
  .use(LanguageDetector)
  //Передача экземпляра i18n в react-i18next
  .use(initReactI18next)
  .init({
    resources,
    //Использование русского языка поумолчанию
    fallbackLng: {
      'ru-*': ['ru-RU'],
      default: ['ru-RU'],
    },
    debug: false,

    //Настройки детектора
    detection: {
      order: ['localStorage', 'navigator'], //Сначала сохраненный выбор, потом язык браузера
      caches: ['localStorage'], //Сохранение выбора пользователя в localStorage автоматически
      lookupLocalStorage: '@app_language', //Ключ
    },

    interpolation: {
      escapeValue: false, //React сам экранирует значения
    },
    react: {
      useSuspense: false, //Нет использования React.Suspense
    },
  });

export default i18n;
