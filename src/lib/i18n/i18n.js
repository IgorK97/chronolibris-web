import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Импорт вашего файла перевода
// Убедитесь, что путь соответствует вашей структуре папок в Vite
import translationRu from "./locales/ru-RU/translations.json";

const resources = {
  "ru-RU": { translation: translationRu },
  ru: { translation: translationRu },
};

i18n
  // Автоматическое определение языка (куки, localStorage, язык браузера)
  .use(LanguageDetector)
  // Передача экземпляра i18n в react-i18next
  .use(initReactI18next)
  .init({
    resources,
    // Если язык не определен, используем ru-RU
    fallbackLng: {
      "ru-*": ["ru-RU"],
      default: ["ru-RU"],
    },
    debug: false, // Поставьте true для отладки в консоли

    // Настройки детектора
    detection: {
      order: ["localStorage", "navigator"], // Сначала смотрим сохраненный выбор, потом язык браузера
      caches: ["localStorage"], // Сохраняем выбор пользователя в localStorage автоматически
      lookupLocalStorage: "@app_language", // Тот же ключ, что был в старом проекте
    },

    interpolation: {
      escapeValue: false, // React сам экранирует значения
    },
    react: {
      useSuspense: false, // Отключаем, если не используете React.Suspense
    },
  });

export default i18n;

// import i18n from "i18next";
// import { initReactI18next } from "react-i18next";
// import LanguageDetector from "i18next-browser-languagedetector";

// i18n
//   // detect user language
//   // learn more: https://github.com/i18next/i18next-browser-languageDetector
//   .use(LanguageDetector)
//   // pass the i18n instance to react-i18next.
//   .use(initReactI18next)
//   // init i18next
//   // for all options read: https://www.i18next.com/overview/configuration-options
//   .init({
//     debug: true,
//     fallbackLng: "en",
//     interpolation: {
//       escapeValue: false, // not needed for react as it escapes by default
//     },
//     resources: {
//       en: {
//         translation: {
//           // here we will place our translations...
//         },
//       },
//     },
//   });

// export default i18n;
