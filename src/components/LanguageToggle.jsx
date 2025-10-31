import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(localStorage.getItem("i18nextLng") || "ua");

    useEffect(() => {
        i18n.changeLanguage(language);
        localStorage.setItem("i18nextLng", language);
    }, [language, i18n]);

    const isEnglish = language === "en";

    const toggleLanguage = () => {
        setLanguage(isEnglish ? "ua" : "en");
    };

    return (
        <motion.div
            onClick={toggleLanguage}
            title={isEnglish ? "Switch to Ukrainian" : "Switch to English"}
            className="relative w-[90px] h-[38px] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900
                 rounded-full cursor-pointer flex items-center justify-between px-4
                 shadow-inner hover:shadow-[0_0_15px_#22c55e60] border border-gray-700/50
                 transition-all duration-300 backdrop-blur-md select-none"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            {/* Повзунок */}
            <motion.div
                className="absolute top-[4px] left-[4px] w-[32px] h-[30px] rounded-full
                   bg-gradient-to-br from-green-400/80 to-emerald-500/80
                   shadow-[0_0_15px_#22c55e60,inset_0_0_10px_#22c55e40]"
                animate={{ x: isEnglish ? 48 : 0 }}
                transition={{
                    type: "spring",
                    stiffness: 140,
                    damping: 18,
                    mass: 0.5,
                }}
            />

            {/* Текст */}
            <div className="flex items-center justify-between w-full text-sm font-semibold z-10">
        <span
            className={`transition-colors duration-300 ${
                !isEnglish ? "text-white drop-shadow-[0_0_4px_#22c55e]" : "text-gray-400"
            }`}
        >
          UA
        </span>
                <span
                    className={`transition-colors duration-300 ${
                        isEnglish ? "text-white drop-shadow-[0_0_4px_#22c55e]" : "text-gray-400"
                    }`}
                >
          EN
        </span>
            </div>
        </motion.div>
    );
}
