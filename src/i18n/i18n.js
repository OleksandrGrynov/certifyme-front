import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector"; // 🧩 зберігає вибір у localStorage
import en from "./locales/en/translation.json";
import ua from "./locales/ua/translation.json";

i18n
    .use(LanguageDetector) // 👈 додаємо
    .use(initReactI18next)
    .init({
        resources: {
            en: { translation: en },
            ua: { translation: ua },
        },

        fallbackLng: "ua", // мова за замовчуванням

        detection: {
            // 💾 алгоритм пошуку вибору користувача
            order: ["localStorage", "navigator", "htmlTag"],
            caches: ["localStorage"], // зберігає вибір
        },

        interpolation: { escapeValue: false },
    });

export default i18n;
