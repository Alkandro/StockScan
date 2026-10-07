import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import es from "./translations/es";
import en from "./translations/en";
import ja from "./translations/ja";
import pt from "./translations/pt";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",

  resources: {
    es: {
      translation: es,
    },

    pt: {
      translation: pt,
    },

    ja: {
      translation: ja,
    },

    en: {
      translation: en,
    },
  },

  lng: "es",

  fallbackLng: "es",

  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
