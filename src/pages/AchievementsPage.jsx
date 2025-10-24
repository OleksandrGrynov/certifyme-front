import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserAchievements } from "../services/achievementsService";
import { Trophy, Star, Zap, Award } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";

export default function AchievementsPage() {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState({
        personal: true,
        global: true,
        creative: true,
    });

    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getUserAchievements();
                setAchievements(data);
            } catch (err) {
                console.error("❌ Failed to load achievements:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center text-gray-400">
                {lang === "ua" ? "Завантаження досягнень..." : "Loading achievements..."}
            </div>
        );
    }

    const grouped = {
        personal: achievements.filter((a) => a.category === "personal"),
        global: achievements.filter((a) => a.category === "global"),
        creative: achievements.filter((a) => a.category === "creative"),
    };

    const categoryNames = {
        personal: lang === "ua" ? "Особисті досягнення" : "Personal achievements",
        global: lang === "ua" ? "Глобальні серед студентів" : "Global among students",
        creative: lang === "ua" ? "Креативні / Пасхальні" : "Creative / Easter eggs",
    };

    const icons = {
        personal: <Award className="text-yellow-400" size={24} />,
        global: <Star className="text-green-400" size={24} />,
        creative: <Zap className="text-pink-400" size={24} />,
    };

    const CircleProgress = ({ percent }) => {
        const radius = 26;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <svg width="64" height="64" className="transform -rotate-90">
                <circle cx="32" cy="32" r={radius} stroke="gray" strokeWidth="6" fill="transparent" />
                <circle
                    cx="32"
                    cy="32"
                    r={radius}
                    stroke={percent >= 100 ? "#22c55e" : "#16a34a"}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-700"
                />
                <text x="50%" y="54%" textAnchor="middle" fill="#fff" fontSize="14">
                    {percent}%
                </text>
            </svg>
        );
    };

    const toggleSection = (key) =>
        setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

    const playUnlockEffect = (achievement) => {
        if (!localStorage.getItem(`unlocked-${achievement.id}`)) {
            const audio = new Audio("/unlock.mp3");
            audio.volume = 0.4;
            audio.play().catch(() => {});
            toast.success(
                lang === "ua"
                    ? `🏆 Ви розблокували "${achievement.title_ua}"!`
                    : `🏆 You unlocked "${achievement.title_en}"!`,
                {
                    style: {
                        background: "#111",
                        color: "#22c55e",
                        border: "1px solid #22c55e",
                    },
                }
            );
            localStorage.setItem(`unlocked-${achievement.id}`, "true");
        }
    };

    return (
        <div className="bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-200 min-h-screen pb-40">
            <Toaster position="top-center" />

            <motion.h1
                className="sticky top-0 z-20 bg-gradient-to-b from-black via-gray-900/95 to-transparent py-6 text-center backdrop-blur-md shadow-md text-3xl font-bold text-green-400"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {lang === "ua" ? "🏆 Мої досягнення" : "🏆 My Achievements"}
            </motion.h1>

            <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10">
                {Object.keys(grouped).map((category, catIndex) => (
                    <div key={category} className="mb-10">
                        {/* Заголовок секції */}
                        <motion.div
                            className="flex justify-between items-center cursor-pointer mb-4 border-b border-gray-700 pb-2"
                            onClick={() => toggleSection(category)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: catIndex * 0.2 }}
                        >
                            <div className="flex items-center space-x-2">
                                {icons[category]}
                                <h2 className="text-lg font-semibold text-white">
                                    {categoryNames[category]}
                                </h2>
                            </div>
                            <span className="text-gray-400 text-sm">
                                {openSections[category] ? "▲" : "▼"}
                            </span>
                        </motion.div>

                        {/* Контент секції */}
                        <AnimatePresence initial={false}>
                            {openSections[category] && (
                                <motion.div
                                    key={category}
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                                        {grouped[category].map((a, index) => (
                                            <motion.div
                                                key={a.id}
                                                className={`relative bg-gray-800/70 border rounded-2xl p-5 shadow-lg transition-all duration-300 overflow-hidden ${
                                                    a.achieved ? "border-green-500" : "border-gray-700"
                                                }`}
                                                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                                animate={{
                                                    opacity: 1,
                                                    scale: a.achieved ? [1, 1.1, 1] : 1,
                                                    boxShadow: a.achieved
                                                        ? [
                                                            "0 0 0px #22c55e",
                                                            "0 0 40px #22c55e",
                                                            "0 0 0px #22c55e",
                                                        ]
                                                        : "0 0 0px transparent",
                                                }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: index * 0.1 + catIndex * 0.2,
                                                }}
                                                onAnimationComplete={() => {
                                                    if (a.achieved) playUnlockEffect(a);
                                                }}
                                            >
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-2xl">{a.icon}</span>
                                                    <CircleProgress percent={a.progress} />
                                                </div>

                                                <h3 className="text-lg font-semibold text-white mb-1">
                                                    {a[`title_${lang}`]}
                                                </h3>
                                                <p className="text-sm text-gray-400 mb-4">
                                                    {a[`description_${lang}`]}
                                                </p>

                                                {a.achieved ? (
                                                    <div className="flex items-center space-x-1 text-green-400 text-sm font-medium">
                                                        <Trophy size={16} />
                                                        <span>
                                                            {lang === "ua" ? "Отримано" : "Unlocked"}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center space-x-1 text-gray-500 text-sm font-medium">
                                                        <Trophy size={16} />
                                                        <span>
                                                            {lang === "ua"
                                                                ? "Ще не отримано"
                                                                : "Not unlocked yet"}
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </div>
        </div>
    );
}
