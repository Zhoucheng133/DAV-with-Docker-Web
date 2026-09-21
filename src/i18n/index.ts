import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enUS from "./content/en_us";
import zhCN from "./content/zh_cn";
import zhTW from "./content/zh_tw";

const resources = {
  en: {
    translation: enUS,
  },
  "zh-CN": {
    translation: zhCN,
  },
  "zh-TW": {
    translation: zhTW,
  },
};

// Get saved language or detect browser language
const getInitialLanguage = () => {
  const saved = localStorage.getItem("dav_lang");
  if (saved && resources[saved as keyof typeof resources]) {
    return saved;
  }

  const browserLang = navigator.language || (navigator as any).userLanguage || "en";
  
  // Match standard codes
  if (browserLang.toLowerCase().startsWith("zh")) {
    if (browserLang.toLowerCase() === "zh-tw" || browserLang.toLowerCase() === "zh-hk" || browserLang.toLowerCase() === "zh-hant") {
      return "zh-TW";
    }
    return "zh-CN";
  }

  if (resources[browserLang as keyof typeof resources]) {
    return browserLang;
  }

  return "en";
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getInitialLanguage(),
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  localStorage.setItem("dav_lang", lng);
});

export default i18n;
