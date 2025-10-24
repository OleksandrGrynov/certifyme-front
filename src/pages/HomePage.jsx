import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LiquidEther from "../components/LiquidEther";
import "../components/LiquidEther.css";
import MagicBento from "../components/MagicBento";
import ProfileCard from "../components/ProfileCard";
import { useTranslation } from "react-i18next";

export default function HomePage() {
    const { t } = useTranslation();

    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
            {/* 🌌 Ефектний фон */}
            <LiquidEther
                colors={[ '#5227FF', '#FF9FFC', '#B19EEF' ]}
                mouseForce={20}
                cursorSize={100}
                isViscous={false}
                viscous={30}
                iterationsViscous={32}
                iterationsPoisson={32}
                resolution={0.5}
                isBounce={false}
                autoDemo={true}
                autoSpeed={0.5}
                autoIntensity={2.2}
                takeoverDuration={0.25}
                autoResumeDelay={3000}
                autoRampDuration={0.6}
            />

            {/* Світлові плями */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-1/3 -left-1/3 w-[600px] h-[600px] bg-green-500/20 blur-[200px] rounded-full animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-emerald-400/20 blur-[200px] rounded-full animate-[pulse_6s_ease-in-out_infinite]"></div>
            </div>

            {/* 🧠 Основний контент */}
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 px-6 max-w-5xl mx-auto"
            >
                {/* Мітка зверху */}
                <div className="inline-flex items-center gap-3 bg-gray-800/40 border border-gray-700 px-5 py-2 rounded-full text-sm text-gray-300 mb-6 backdrop-blur-md">
          <span className="text-green-400 font-medium">
            📜 {t("top_label") ?? "Отримай сертифікат після тесту"}
          </span>
                </div>

                {/* Заголовок */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
          <span className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
            CertifyMe
          </span>{" "}
                    — {t("welcome_title")}
                </h1>

                {/* Підзаголовок */}
                <p className="text-gray-400 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
                    {t("welcome_subtitle")}
                </p>

                {/* Кнопка CTA */}
                <div className="flex flex-wrap justify-center gap-6">
                    <Link
                        to="/tests"
                        className="px-8 py-3 bg-green-500 hover:bg-green-400 text-gray-900 font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                        {t("btn_view_courses")}
                    </Link>
                </div>

                {/* --- MagicBento блок --- */}
                <div className="mt-24 flex justify-center items-center">
                    <MagicBento
                        textAutoHide={true}
                        enableStars={true}
                        enableSpotlight={true}
                        enableBorderGlow={true}
                        enableTilt={true}
                        enableMagnetism={true}
                        clickEffect={true}
                        spotlightRadius={300}
                        particleCount={12}
                        glowColor="132, 0, 255"
                    >
                        <div className="p-10 text-center">
                            <h2 className="text-3xl font-bold text-white mb-3">
                                {t("discover_potential", {
                                    defaultValue:
                                        "Отримуй офіційні сертифікати разом із CertifyMe",
                                })}
                            </h2>
                            <p className="text-gray-300 text-lg max-w-xl mx-auto">
                                {t("platform_description", {
                                    defaultValue:
                                        "Платформа, що автоматизує перевірку знань, оплату та створення сертифікатів із QR-кодом. Перевірка дійсності — у один клік.",
                                })}
                            </p>
                        </div>
                    </MagicBento>
                </div>
            </motion.div>

            {/* 🧩 Картка профілю */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="relative z-10 mt-16 md:mt-20 flex justify-center items-center px-4"
            >
                <ProfileCard
                    name="Олександр Кравчук"
                    title="Розробник CertifyMe"
                    handle="@certifyme"
                    status="Online"
                    contactText={t("contact_us")}
                    avatarUrl="https://avatars.githubusercontent.com/u/1?v=4"
                    showUserInfo={true}
                    enableTilt={true}
                    enableMobileTilt={false}
                    onContactClick={() => window.open("mailto:info@certifyme.com")}
                />
            </motion.div>
        </section>
    );
}
