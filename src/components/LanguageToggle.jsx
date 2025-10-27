import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

export default function LanguageToggle() {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState(localStorage.getItem("i18nextLng") || "ua");

    useEffect(() => {
        i18n.changeLanguage(language);
        localStorage.setItem("i18nextLng", language);
    }, [language, i18n]);

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === "ua" ? "en" : "ua"));
    };

    return (
        <motion.div
            onClick={toggleLanguage}
            title={language === "ua" ? "Change language" : "Змінити мову"}
            className="relative w-40 h-12 bg-gradient-to-r from-[#111827] via-[#1f2937] to-[#0f172a] rounded-full cursor-pointer flex items-center justify-between px-6 shadow-md hover:shadow-[0_0_20px_#10b98170] transition-all duration-300 select-none border border-gray-700/40 backdrop-blur-md"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            {/* 🔘 Скляний ефект активної мови */}
            <motion.div
                layout
                className="absolute top-1 left-1 w-10 h-10 rounded-full bg-[rgba(34,197,94,0.2)] backdrop-blur-xl border border-green-400/30 shadow-[0_0_12px_#22c55e70,inset_0_0_8px_#22c55e30]"
                style={{
                    background: "linear-gradient(145deg, rgba(34,197,94,0.35), rgba(16,185,129,0.55))",
                }}
                initial={false}
                animate={{ x: language === "en" ? 96 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />

            {/* 🇺🇦 Українська */}
            <div className="flex items-center gap-3 z-10 pl-1">
                <img
                    src="https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Ukraine.svg"
                    alt="UA"
                    className="w-5 h-4 rounded-sm shadow-sm"
                />
                <span
                    className={`text-sm font-semibold tracking-wide ${
                        language === "ua"
                            ? "text-white drop-shadow-[0_0_6px_#22c55e]"
                            : "text-gray-400"
                    }`}
                >
          UA
        </span>
            </div>

            {/* 🇬🇧 Англійська */}
            <div className="flex items-center gap-3 z-10 pr-1 ml-3">
                <img
                    src="https://upload.wikimedia.org/wikipedia/en/a/ae/Flag_of_the_United_Kingdom.svg"
                    alt="EN"
                    className="w-5 h-4 rounded-sm shadow-sm"
                />
                <span
                    className={`text-sm font-semibold tracking-wide ${
                        language === "en"
                            ? "text-white drop-shadow-[0_0_6px_#22c55e]"
                            : "text-gray-400"
                    }`}
                >
          EN
        </span>
            </div>
        </motion.div>
    );
}
