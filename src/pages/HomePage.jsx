import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

import LiquidEther from "../components/LiquidEther";
import "../components/LiquidEther.css";
import MagicBento from "../components/MagicBento";
import ProfileCard from "../components/ProfileCard";
import AuthModal from "../components/AuthModal";

/** ────────────────────────────────────────────────────────────────────────────
 *  Локальна утиліта для плавного підрахунку чисел (без дод. бібліотек)
 *  ───────────────────────────────────────────────────────────────────────────*/
function AnimatedNumber({ to = 0, duration = 1200, prefix = "", suffix = "" }) {
    const [val, setVal] = useState(0);
    const rafRef = useRef(0);


    useEffect(() => {
        const start = performance.now();
        const from = 0;
        const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
            setVal(Math.floor(from + (to - from) * eased));
            if (p < 1) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [to, duration]);

    const formatted = useMemo(() => {
        try {
            return `${prefix}${val.toLocaleString("uk-UA")}${suffix}`;
        } catch {
            return `${prefix}${val}${suffix}`;
        }
    }, [val, prefix, suffix]);

    return <span>{formatted}</span>;
}

/** ────────────────────────────────────────────────────────────────────────────
 *  Auto-play карусель без сторонніх бібліотек
 *  ───────────────────────────────────────────────────────────────────────────*/
function AutoCarousel({ items = [], interval = 3800 }) {
    const [idx, setIdx] = useState(0);
    useEffect(() => {
        if (!items.length) return;
        const id = setInterval(() => setIdx((i) => (i + 1) % items.length), interval);
        return () => clearInterval(id);
    }, [items, interval]);

    if (!items.length) return null;

    const current = items[idx];
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 p-6"
        >
            <AnimatePresence mode="wait">
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.98 }}
                    transition={{ duration: 0.45 }}
                    className="grid gap-4 sm:grid-cols-[72px_1fr]"
                >
                    <img
                        src={current.avatar}
                        alt={current.name}
                        className="h-16 w-16 rounded-full object-cover ring-2 ring-emerald-400/40"
                    />
                    <div>
                        <div className="flex items-baseline gap-3">
                            <p className="text-lg font-semibold text-white">{current.name}</p>
                            <span className="text-xs text-gray-400">{current.role}</span>
                        </div>
                        <p className="mt-2 text-gray-300 leading-relaxed">“{current.text}”</p>
                    </div>
                </motion.div>
            </AnimatePresence>
        </motion.div>
    );
}
function ScrollToTopButton() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setVisible(y > 500); // показуємо після 500px
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <motion.button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-6 right-6 z-50 p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full shadow-lg transition-all duration-300 hover:scale-110"
            title="Повернутися нагору"
        >
            ↑
        </motion.button>
    );
}

export default function HomePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [openIndex, setOpenIndex] = useState(null);

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [stats, setStats] = useState({
        learners: 3390000,
        courses: 480,
        certificates: 3070000,
        years: 10,
    });

    const [popularTests, setPopularTests] = useState([]);
    const [loadingTests, setLoadingTests] = useState(true);

    const handleTakeTest = async (tst) => {
        const token = localStorage.getItem("token");
        const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

        // 🔐 якщо користувач не авторизований — відкриваємо модалку входу
        if (!token || !isAuthenticated) {
            localStorage.setItem("redirectTestId", tst.id);
            setShowAuthModal(true);
            return;
        }

        try {
            // 🔎 перевіряємо, чи користувач уже має доступ
            const res = await fetch(`http://localhost:5000/api/user/tests/check/${tst.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (data.hasAccess) {
                // ✅ вже має доступ → йдемо одразу на тест
                navigate(`/tests/${tst.id}`);
            } else if ((tst.price_cents || 0) > 0) {
                // 💳 якщо платний — відкриваємо checkout
                navigate(`/checkout/${tst.id}`);
            } else {
                // 🆓 безкоштовний → відразу запускаємо тест
                navigate(`/tests/${tst.id}`);
            }
        } catch (err) {
            console.error("❌ handleTakeTest error:", err);
        }
    };



    useEffect(() => {
        let cancelled = false;
        const lang = i18n.language === "en" ? "en" : "ua";

        const fetchStats = async () => {
            try {
                const urls = [
                    "http://localhost:5000/api/analytics/public/overview",
                    "http://localhost:5000/api/public/stats",
                ];
                for (const url of urls) {
                    try {
                        const r = await fetch(url);
                        if (!r.ok) continue;
                        const data = await r.json();
                        if (cancelled) return;
                        const s = data?.data || data || {};
                        setStats((prev) => ({
                            learners: Number(s.learners ?? prev.learners),
                            courses: Number(s.courses ?? prev.courses),
                            certificates: Number(s.certificates ?? prev.certificates),
                            years: Number(s.years ?? prev.years),
                        }));
                        break;
                    } catch {}
                }
            } catch {}
        };

        const fetchTests = async () => {
            try {
                setLoadingTests(true);
                const res = await fetch(`http://localhost:5000/api/tests?lang=${lang}`);
                const json = res.ok ? await res.json() : { tests: [] };
                const arr = json.tests || [];
                const top = [...arr]
                    .sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0))
                    .slice(0, 6);
                if (!cancelled) setPopularTests(top);
            } catch {
                if (!cancelled) setPopularTests([]);
            } finally {
                if (!cancelled) setLoadingTests(false);
            }
        };

        fetchStats();
        fetchTests();

        return () => {
            cancelled = true;
        };
    }, [i18n.language]);

    const testimonials = [
        {
            name: "Марія",
            role: "Frontend-розробниця",
            avatar:
                "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
            text: "Пройшла тест із JavaScript — отримала сертифікат, який допоміг знайти першу роботу!",
        },
        {
            name: "Олег",
            role: "Project-менеджер",
            avatar:
                "https://images.unsplash.com/photo-1502767089025-6572583495b0?q=80&w=256&auto=format&fit=crop",
            text: "Зручно оцінювати знання кандидатів через онлайн-тести. Все в одному місці!",
        },
        {
            name: "Ірина",
            role: "Студентка КНУ",
            avatar:
                "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=256&auto=format&fit=crop",
            text: "QR-сертифікат виглядає дуже професійно. Використовую в резюме!",
        },
    ];

    const partners = [
        "Microsoft",
        "GlobalLogic",
        "SoftServe",
        "EPAM",
        "Grammarly",
        "Genesis",
        "Luxoft",
        "DataArt",
        "Amazon",
        "Google",
        "Нова пошта",
        "Київстар",
    ];

    const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

    return (
        <section className="relative min-h-screen flex flex-col items-center text-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
            {/* 🌌 Ефектний фон */}
            <LiquidEther
                colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
                mouseForce={20}
                cursorSize={100}
                autoDemo={true}
                autoSpeed={0.5}
                autoIntensity={2.2}
            />

            {/* HERO */}
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1 }}
                className="relative z-10 px-6 pt-16 pb-8 max-w-6xl mx-auto"
            >
                <div className="inline-flex items-center gap-3 bg-gray-800/40 border border-gray-700 px-5 py-2 rounded-full text-sm text-gray-300 mb-6 backdrop-blur-md">
                    <span className="text-green-400 font-medium">
                        📜 {t("top_label") ?? "Отримай офіційний сертифікат онлайн"}
                    </span>
                </div>

                <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
                    <span className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
                        CertifyMe
                    </span>{" "}
                    — {t("welcome_title") ?? "твій крок до професійного росту"}
                </h1>

                <p className="text-gray-300/90 text-lg md:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
                    {t("welcome_subtitle") ??
                        "Проходь тести, отримуй сертифікати та підтверджуй свої навички перед роботодавцем."}
                </p>

                <div className="flex flex-wrap justify-center gap-4">
                    <Link
                        to="/tests"
                        className="px-7 py-3 bg-green-500 hover:bg-green-400 text-gray-900 font-semibold rounded-lg shadow-lg transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                    >
                        {t("btn_view_courses") ?? "Перейти до тестів"}
                    </Link>
                    <a
                        href="#popular"
                        onClick={() =>
                            document
                                .getElementById("popular")
                                ?.scrollIntoView({ behavior: "smooth" })
                        }
                        className="px-7 py-3 bg-gray-800/70 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                        {tLabel("Популярні тести", "Popular tests")}
                    </a>
                </div>

                {/* MagicBento */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                    className="mt-16 flex justify-center items-center"
                >
                    <MagicBento
                        textAutoHide
                        enableStars
                        enableSpotlight
                        enableBorderGlow
                        enableTilt
                        enableMagnetism
                        clickEffect
                        spotlightRadius={300}
                        particleCount={12}
                        glowColor="132, 0, 255"
                    >
                        <div className="p-10 text-center">
                            <h2 className="text-3xl font-bold text-white mb-3">
                                Підтверджуй свої знання офіційно
                            </h2>
                            <p className="text-gray-300 text-lg max-w-xl mx-auto">
                                CertifyMe — це сучасна платформа, що автоматизує перевірку знань,
                                оплату та створення сертифікатів із QR-кодом.
                            </p>
                        </div>
                    </MagicBento>
                </motion.div>
            </motion.div>

            {/*  🏆 Наші переваги */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative z-10 w-full mt-20"
            >
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-left mb-8">
                        {i18n.language === "ua" ? "Чому обирають нас" : "Why people choose us"}
                    </h2>
                    <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-6">
                        {[
                            {
                                icon: "⚡",
                                ua: {
                                    title: "Миттєві результати",
                                    desc: "Результати тесту та сертифікат доступні одразу після проходження.",
                                },
                                en: {
                                    title: "Instant results",
                                    desc: "Your test result and certificate are available immediately after completion.",
                                },
                            },
                            {
                                icon: "🌍",
                                ua: {
                                    title: "Мульти-мовна підтримка",
                                    desc: "Українська та англійська мови для зручності користувачів.",
                                },
                                en: {
                                    title: "Multi-language support",
                                    desc: "Ukrainian and English versions for user convenience.",
                                },
                            },
                            {
                                icon: "💳",
                                ua: {
                                    title: "Безпечні оплати",
                                    desc: "Усі транзакції проходять через захищені сервіси.",
                                },
                                en: {
                                    title: "Secure payments",
                                    desc: "All transactions are processed through secure services.",
                                },
                            },
                            {
                                icon: "🎓",
                                ua: {
                                    title: "Корисно для кар’єри",
                                    desc: "Сертифікати підвищують шанси при працевлаштуванні.",
                                },
                                en: {
                                    title: "Career advantage",
                                    desc: "Certificates increase your chances when applying for a job.",
                                },
                            },
                        ].map((f, i) => {
                            const content = i18n.language === "ua" ? f.ua : f.en;
                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: i * 0.1 }}
                                    viewport={{ once: true }}
                                    className="border border-gray-800 bg-gray-900/60 rounded-2xl p-6 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)] transition"
                                >
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h3 className="font-semibold text-white text-lg mb-1">{content.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{content.desc}</p>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>


            {/* Партнери */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative z-10 w-full mt-20 overflow-hidden border-y border-gray-800 bg-gray-900/40"
            >
                <div className="flex animate-[marquee_35s_linear_infinite] gap-16 py-6 px-8 whitespace-nowrap">
                    {partners.concat(partners).map((p, i) => (
                        <span
                            key={i}
                            className="text-gray-300/80 text-lg tracking-wide hover:text-white transition select-none"
                        >
                            {p}
                        </span>
                    ))}
                </div>
                <div className="flex animate-[marqueeReverse_40s_linear_infinite] gap-16 py-6 px-8 whitespace-nowrap opacity-70">
                    {partners.concat(partners).map((p, i) => (
                        <span
                            key={"second" + i}
                            className="text-gray-400/80 text-base tracking-wide select-none"
                        >
                            {p}
                        </span>
                    ))}
                </div>
            </motion.div>



            {/* FAQ */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative z-10 w-full mt-16 mb-20"
            >
                <div className="mx-auto max-w-6xl px-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-left mb-6">
                        {i18n.language === "ua" ? "Питання та відповіді" : "FAQ"}
                    </h2>

                    {/* 🔹 Один список, але двоколонковий лише стилями */}
                    <div className="columns-1 md:columns-2 gap-4 space-y-4">
                        {[
                            {
                                ua: {
                                    q: "Чи всі тести безкоштовні?",
                                    a: "Ні, частина тестів безкоштовна, а частина — платна. Після оплати одразу відкривається доступ до проходження.",
                                },
                                en: {
                                    q: "Are all tests free?",
                                    a: "No, some tests are free, while others require payment. Access is granted immediately after payment.",
                                },
                            },
                            {
                                ua: {
                                    q: "Як отримати сертифікат?",
                                    a: "Після проходження тесту можна завантажити сертифікат у форматі PDF з QR-кодом для перевірки дійсності.",
                                },
                                en: {
                                    q: "How do I get my certificate?",
                                    a: "After completing the test, you can download a PDF certificate with a QR code for verification.",
                                },
                            },
                            {
                                ua: {
                                    q: "Чи потрібна реєстрація?",
                                    a: "Так, щоб зберігати результати й отримувати сертифікати, потрібно авторизуватися.",
                                },
                                en: {
                                    q: "Do I need to register?",
                                    a: "Yes, you need to sign in to save results and receive certificates.",
                                },
                            },
                            {
                                ua: {
                                    q: "Якою мовою доступна платформа?",
                                    a: "Українською та англійською. Перемикач мови — у верхньому меню.",
                                },
                                en: {
                                    q: "Which languages are available?",
                                    a: "Ukrainian and English. You can switch the language in the top menu.",
                                },
                            },
                            {
                                ua: {
                                    q: "Як швидко приходить підтвердження оплати?",
                                    a: "Миттєво! Одразу після оплати ви отримуєте доступ до тесту та сертифікату.",
                                },
                                en: {
                                    q: "How fast is payment confirmation?",
                                    a: "Instantly! You get immediate access to the test and certificate after payment.",
                                },
                            },
                            {
                                ua: {
                                    q: "Чи можу я повторно пройти тест?",
                                    a: "Так, повторне проходження доступне — це гарний спосіб покращити результат.",
                                },
                                en: {
                                    q: "Can I retake a test?",
                                    a: "Yes, you can retake any test to improve your result.",
                                },
                            },
                            {
                                ua: {
                                    q: "Як перевірити справжність сертифіката?",
                                    a: "Кожен сертифікат має QR-код. Відскануйте його або введіть ID на сторінці «Verify».",
                                },
                                en: {
                                    q: "How can I verify a certificate?",
                                    a: "Each certificate includes a QR code. Scan it or enter the ID on the 'Verify' page.",
                                },
                            },
                            {
                                ua: {
                                    q: "Чи є підтримка?",
                                    a: "Так! Ми доступні через пошту info@certifyme.com або Telegram-бот @CertifyMeBot.",
                                },
                                en: {
                                    q: "Is there support available?",
                                    a: "Yes! You can contact us via email at info@certifyme.com or Telegram bot @CertifyMeBot.",
                                },
                            },
                        ].map((item, i) => {
                            const content = i18n.language === "ua" ? item.ua : item.en;
                            const isOpen = openIndex === i;

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: i * 0.05 }}
                                    viewport={{ once: true }}
                                    className={`break-inside-avoid group rounded-2xl border ${
                                        isOpen
                                            ? "border-emerald-500/60 bg-gray-900/80 shadow-[0_0_25px_rgba(34,197,94,0.15)]"
                                            : "border-gray-800 bg-gray-900/70"
                                    } p-5 hover:border-emerald-500/50 transition duration-300`}
                                >
                                    <button
                                        onClick={() => setOpenIndex(isOpen ? null : i)}
                                        className="w-full flex items-center justify-between text-white font-medium text-left"
                                    >
                                        <span>{content.q}</span>
                                        <span
                                            className={`ml-4 text-emerald-400 transform transition-transform ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        >
                ⌄
              </span>
                                    </button>

                                    <AnimatePresence>
                                        {isOpen && (
                                            <motion.p
                                                key="answer"
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="mt-3 text-gray-300 leading-relaxed overflow-hidden"
                                            >
                                                {content.a}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>



            {/* ───────────────────────────── Популярні тести ───────────────────────────── */}
            <motion.div
                id="popular"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="relative z-10 w-full mt-20"
            >
                <div className="mx-auto max-w-6xl px-6">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-2xl md:text-3xl font-bold text-left">
                            {tLabel("Популярні тести", "Popular tests")}
                        </h2>
                        <Link
                            to="/tests"
                            className="text-emerald-400 hover:text-emerald-300 transition font-medium"
                        >
                            {tLabel("Переглянути всі →", "See all →")}
                        </Link>
                    </div>

                    {loadingTests ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => (
                                <div
                                    key={i}
                                    className="h-64 rounded-2xl border border-gray-800 bg-gray-900/50 animate-pulse"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {popularTests.length > 0 ? (
                                popularTests.map((tst) => (
                                    <motion.div
                                        key={tst.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.5 }}
                                        className="group rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden text-left hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)] transition flex flex-col h-full"
                                    >
                                        {tst.image_url ? (
                                            <img
                                                src={tst.image_url}
                                                alt={tst.title}
                                                className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="h-40 w-full bg-gray-800/70 flex items-center justify-center text-gray-500 text-2xl">
                                                📘
                                            </div>
                                        )}

                                        <div className="flex flex-col flex-grow justify-between p-5">
                                            <div>
                                                <div className="flex items-start justify-between gap-4">
                                                    <h3 className="text-lg font-semibold text-white line-clamp-2">
                                                        {tst.title}
                                                    </h3>
                                                    <span className="text-xs rounded-md px-2 py-1 bg-gray-800 text-gray-300 border border-gray-700 whitespace-nowrap">
                                            {(tst.price_cents ?? 0) > 0
                                                ? new Intl.NumberFormat(
                                                    i18n.language === "ua" ? "uk-UA" : "en-US",
                                                    {
                                                        style: "currency",
                                                        currency:
                                                            (tst.currency || "usd").toUpperCase() === "UAH"
                                                                ? "UAH"
                                                                : "USD",
                                                    }
                                                ).format(
                                                    (tst.currency || "usd").toUpperCase() === "UAH"
                                                        ? tst.price_uah || 0
                                                        : (tst.price_cents || 0) / 100
                                                )
                                                : tLabel("Безкоштовно", "Free")}
                                        </span>
                                                </div>

                                                <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                                                    {tst.description}
                                                </p>
                                            </div>

                                            <div className="mt-4 flex gap-2">
                                                <button
                                                    onClick={() => navigate(`/tests/${tst.id}/details`)}
                                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
                                                >
                                                    {tLabel("Деталі", "Details")}
                                                </button>
                                                <button
                                                    onClick={() => handleTakeTest(tst)}
                                                    className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 hover:shadow-[0_0_12px_rgba(34,197,94,0.4)] transition"
                                                >
                                                    {tLabel("Пройти", "Take")}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-gray-400 text-center py-10">
                                    {tLabel("Немає тестів для відображення.", "No tests to show.")}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>


            {/* ───────────────────────────── Profile Card ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="relative z-10 mt-16 md:mt-20 flex justify-center items-center px-4 w-full"
            >
                <ProfileCard
                    name="Олександр Кравчук"
                    title="Розробник CertifyMe"
                    handle="@certifyme"
                    status="Online"
                    contactText={t("contact_us") ?? "Зв’язатися"}
                    avatarUrl="https://avatars.githubusercontent.com/u/1?v=4"
                    showUserInfo={true}
                    enableTilt={true}
                    enableMobileTilt={false}
                    onContactClick={() => window.open("mailto:info@certifyme.com")}
                />
            </motion.div>

            {/* ───────────────────────────── CTA ───────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9 }}
                className="relative z-10 w-full mt-16 mb-20"
            >
                <div className="mx-auto max-w-4xl px-6">
                    <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 via-teal-600/10 to-emerald-600/20 p-8 backdrop-blur text-left">
                        <h3 className="text-2xl md:text-3xl font-bold">
                            {tLabel(
                                "Готові прокачати навички?",
                                "Ready to level up your skills?"
                            )}
                        </h3>
                        <p className="mt-2 text-gray-300 text-lg leading-relaxed">
                            {tLabel(
                                "Обирайте тест, проходьте перевірку та отримуйте сертифікат, який підтвердить ваші знання.",
                                "Choose a test, pass the assessment, and receive a verifiable certificate."
                            )}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                to="/tests"
                                className="px-6 py-3 rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 transition hover:shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                            >
                                {tLabel("Перейти до тестів", "Go to tests")}
                            </Link>
                            <a
                                href="#popular"
                                className="px-6 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
                            >
                                {tLabel("Популярні зараз", "Trending now")}
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ───────────────────────────── Scroll to top ───────────────────────────── */}
            {/** Плавна поява при скролі */}
            <ScrollToTopButton />

            {/* ───────────────────────────── Анімації ───────────────────────────── */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes marqueeReverse {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
            `}</style>


            {/* ───────────────────────────── Анімації ───────────────────────────── */}
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes marqueeReverse {
                    0% { transform: translateX(-50%); }
                    100% { transform: translateX(0); }
                }
            `}</style>
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

        </section>
    );
}

