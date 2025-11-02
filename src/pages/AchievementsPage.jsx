import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserAchievements } from "../services/achievementsService";
import { Trophy, Star, Zap, Award, Lock } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import AuthModal from "../components/AuthModal";

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState({
    personal: true,
    global: true,
    creative: true,
  });
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ua";

  const loadAchievements = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsGuest(true);
      setLoading(false);
      return;
    }

    try {
      const data = await getUserAchievements();
      setAchievements(data);
    } catch (err) {
      console.error("❌ Failed to load achievements:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAchievements();
    const reload = () => loadAchievements();
    window.addEventListener("achievementUpdated", reload);
    return () => window.removeEventListener("achievementUpdated", reload);
  }, []);

  useEffect(() => {
    const unlock = () => {
      const audio = new Audio("/unlock.mp3");
      audio.volume = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            audio.pause();
            audio.currentTime = 0;
            console.log("✅ Audio context unlocked");
            setAudioUnlocked(true);
          })
          .catch((err) => console.warn("⚠️ Unlock failed:", err.message));
      }
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        {lang === "ua" ? "Завантаження досягнень..." : "Loading achievements..."}
      </div>
    );
  }

  if (isGuest) {
    return (
      <section className="flex flex-col items-center justify-center h-screen text-white bg-gradient-to-br from-black via-gray-900 to-gray-800">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center p-8 bg-gray-900/70 rounded-2xl border border-gray-700 shadow-xl max-w-md"
        >
          <Lock size={60} className="mx-auto mb-4 text-yellow-400" />
          <h2 className="text-2xl font-bold mb-2">
            {lang === "ua"
              ? "Досягнення доступні лише користувачам"
              : "Achievements are available for users only"}
          </h2>
          <p className="text-gray-400 mb-6">
            {lang === "ua"
              ? "Створіть акаунт, щоб відслідковувати прогрес, відкривати нагороди та змагатися зі студентами 💪"
              : "Create an account to track your progress, unlock rewards, and compete with students 💪"}
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition"
          >
            {lang === "ua" ? "Зареєструватися" : "Sign up"}
          </button>
        </motion.div>
        {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
      </section>
    );
  }

  const total = achievements.length;
  const unlocked = achievements.filter((a) => a.achieved).length;
  const overallProgress = total ? Math.round((unlocked / total) * 100) : 0;

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

  const toggleSection = (key) => setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const playUnlockEffect = (achievement) => {
    if (!localStorage.getItem(`unlocked-${achievement.id}`)) {
      const audio = new Audio("/unlock.mp3");
      audio.volume = 0.7;
      if (audioUnlocked) {
        audio.play().catch((err) => console.warn("⚠️ Audio blocked:", err.message));
      }
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
        },
      );
      localStorage.setItem(`unlocked-${achievement.id}`, "true");
    }
  };

  return (
    <div className="bg-gradient-to-b from-black via-gray-900 to-gray-800 text-gray-200 min-h-screen pb-40">
      <Toaster position="top-center" />

      {}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-8 bg-gray-900/80 shadow-lg sticky top-0 z-20 backdrop-blur-md"
      >
        <h1 className="text-3xl font-bold text-green-400 mb-2">
          {lang === "ua" ? "🏆 Мої досягнення" : "🏆 My Achievements"}
        </h1>
        <p className="text-gray-400 text-sm mb-2">
          {lang === "ua"
            ? `Відкрито ${unlocked} з ${total} (${overallProgress}%)`
            : `Unlocked ${unlocked} of ${total} (${overallProgress}%)`}
        </p>
        <div className="w-64 mx-auto h-3 bg-gray-700 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: 0 }}
            animate={{ width: `${overallProgress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      </motion.div>

      {}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 mt-10">
        {Object.keys(grouped).map((category, catIndex) => (
          <div key={category} className="mb-10">
            <motion.div
              className="flex justify-between items-center cursor-pointer mb-4 border-b border-gray-700 pb-2"
              onClick={() => toggleSection(category)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: catIndex * 0.2 }}
            >
              <div className="flex items-center space-x-2">
                {icons[category]}
                <h2 className="text-lg font-semibold text-white">{categoryNames[category]}</h2>
              </div>
              <span className="text-gray-400 text-sm">{openSections[category] ? "▲" : "▼"}</span>
            </motion.div>

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
                        className={`relative bg-gray-800/70 border rounded-2xl p-5 shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                          a.achieved ? "border-green-500 shadow-green-500/20" : "border-gray-700"
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
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
                        <p className="text-sm text-gray-400 mb-4">{a[`description_${lang}`]}</p>

                        {a.achieved ? (
                          <div className="flex items-center text-green-400 text-sm font-medium gap-1">
                            <Trophy size={16} /> {lang === "ua" ? "Отримано" : "Unlocked"}
                          </div>
                        ) : (
                          <div className="flex items-center text-gray-500 text-sm font-medium gap-1">
                            <Trophy size={16} />{" "}
                            {lang === "ua" ? "Ще не отримано" : "Not unlocked yet"}
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
