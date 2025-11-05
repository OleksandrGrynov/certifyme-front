import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useTranslation } from "react-i18next";

import LiquidEther from "../components/LiquidEther";
import "../components/LiquidEther.css";
import MagicBento from "../components/MagicBento";
import ProfileCard from "../components/ProfileCard";
import AuthModal from "../components/AuthModal";

/* ─────────────────────────────────────────────────────────
 * Motion utils (variants, helpers)
 * ─────────────────────────────────────────────────────────*/
const fadeUp = (delay = 0, distance = 24) => ({
  hidden: { opacity: 0, y: distance },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
});

const scaleIn = (delay = 0) => ({
  hidden: { opacity: 0, scale: 0.96 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 220, damping: 24, delay },
  },
});


/* ─────────────────────────────────────────────────────────
 * AnimatedNumber
 * ─────────────────────────────────────────────────────────*/
function AnimatedNumber({ to = 0, duration = 1200, prefix = "", suffix = "" }) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      setVal(to);
      return;
    }
    const start = performance.now();
    const from = 0;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(from + (to - from) * eased));
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [to, duration, prefersReducedMotion]);

  const formatted = useMemo(() => {
    try {
      return `${prefix}${val.toLocaleString("uk-UA")}${suffix}`;
    } catch {
      return `${prefix}${val}${suffix}`;
    }
  }, [val, prefix, suffix]);

  return <span>{formatted}</span>;
}

/* ─────────────────────────────────────────────────────────
 * AutoCarousel (Testimonials)
 * ─────────────────────────────────────────────────────────*/
function AutoCarousel({ items = [], interval = 3800 }) {
  const [idx, setIdx] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!items.length || prefersReducedMotion) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), interval);
    return () => clearInterval(id);
  }, [items, interval, prefersReducedMotion]);

  if (!items.length) return null;
  const current = items[idx];

  return (
    <motion.div
      variants={scaleIn(0)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/70 p-5 md:p-6"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, scale: 0.98 }}
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

      {/* soft glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────
 * ScrollToTopButton
 * ─────────────────────────────────────────────────────────*/
function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setVisible(window.scrollY > 480);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={visible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-5 right-5 z-50 p-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-full shadow-lg transition-all duration-300 hover:scale-110"
      title="Повернутися нагору"
    >
      ↑
    </motion.button>
  );
}

/* ─────────────────────────────────────────────────────────
 * HomePage
 * ─────────────────────────────────────────────────────────*/
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

  // soft parallax on hero content
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], ["0px", "-60px"]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.85]);

  const handleTakeTest = async (tst) => {
    const token = localStorage.getItem("token");
    const isAuthenticated = localStorage.getItem("isAuthenticated") === "true";

    if (!token || !isAuthenticated) {
      localStorage.setItem("redirectTestId", tst.id);
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/user/tests/check/${tst.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.hasAccess) {
        navigate(`/tests/${tst.id}`);
      } else if ((tst.price_cents || 0) > 0) {
        navigate(`/checkout/${tst.id}`);
      } else {
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
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ9i8QEMASYcfGCx2Hxs-Rxn98_32qcgoI9Bw&s",
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

  /* ─────────────────────────────────────────────────────────
   * Cursor parallax for hero ring
   * ─────────────────────────────────────────────────────────*/
  const ringRef = useRef(null);
  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;
    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      el.style.setProperty("--tx", `${x * 0.02}px`);
      el.style.setProperty("--ty", `${y * 0.02}px`);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center text-center overflow-hidden bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
      {/* Floating liquid background */}
      <LiquidEther
        colors={["#5227FF", "#FF9FFC", "#B19EEF"]}
        mouseForce={20}
        cursorSize={100}
        autoDemo={true}
        autoSpeed={0.45}
        autoIntensity={2.1}
      />

      {/* HERO */}
      <motion.div
        ref={heroRef}
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative z-10 px-5 md:px-6 pt-14 md:pt-16 pb-6 md:pb-8 max-w-6xl mx-auto"
      >
        <motion.div
          variants={fadeUp(0.05, 16)}
          initial="hidden"
          animate="show"
          className={`inline-flex items-center gap-3 bg-gray-800/40 border border-gray-700 px-4 md:px-5 py-2 rounded-full text-sm text-gray-300 mb-5 md:mb-6 backdrop-blur-md `}
        >
          <span className="text-green-400 font-medium">
            📜 {t("top_label") ?? "Отримай офіційний сертифікат онлайн"}
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp(0.1, 18)}
          initial="hidden"
          animate="show"
          className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-4 md:mb-6 leading-[1.12]"
        >
          <span className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.6)]">
            CertifyMe
          </span>{" "}
          — {t("welcome_title") ?? "твій крок до професійного росту"}
        </motion.h1>

        <motion.p
          variants={fadeUp(0.15, 16)}
          initial="hidden"
          animate="show"
          className="text-gray-300/90 text-base md:text-xl mb-6 md:mb-8 max-w-3xl mx-auto leading-relaxed"
        >
          {t("welcome_subtitle") ??
            "Проходь тести, отримуй сертифікати та підтверджуй свої навички перед роботодавцем."}
        </motion.p>

        <motion.div
          variants={fadeUp(0.2, 14)}
          initial="hidden"
          animate="show"
          className="flex flex-col sm:flex-row justify-center gap-7 sm:gap-4 w-full sm:w-auto px-4"
        >

        <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
          <Link
            to="/tests"
            className="px-6 py-2.5 md:px-6 md:py-3 rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 transition"
          >
            {tLabel("Перейти до тестів", "Go to tests")}
          </Link>

          </motion.div>

          <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
            <a
              href="#popular"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("popular")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="px-5 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base bg-gray-800/70 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition w-full sm:w-auto text-center"
            >
              {tLabel("Популярні тести", "Popular tests")}
            </a>
          </motion.div>
        </motion.div>

        {/* Bento card with subtle parallax glow */}
        <motion.div
          variants={scaleIn(0.15)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-12 md:mt-14 flex justify-center items-center"
        >
          <div ref={ringRef} className="relative">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[40px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.10),transparent_50%)]"
              style={{ transform: "translate(var(--tx, 0px), var(--ty, 0px))" }}
            />
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
              <div className="p-8 md:p-10 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2.5 md:mb-3">
                  Підтверджуй свої знання офіційно
                </h2>
                <p className="text-gray-300 text-base md:text-lg max-w-xl mx-auto">
                  CertifyMe — це сучасна платформа, що автоматизує перевірку знань, оплату та
                  створення сертифікатів із QR-кодом.
                </p>
              </div>
            </MagicBento>
          </div>
        </motion.div>
      </motion.div>

      {/* WHY US (4 features) */}
      <motion.div
        variants={fadeUp(0.05, 24)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 w-full mt-12 md:mt-16"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <h2 className="text-xl md:text-3xl font-bold text-left mb-5 md:mb-8">
            {i18n.language === "ua" ? "Чому обирають нас" : "Why people choose us"}
          </h2>
          <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-4 md:gap-6">
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
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                  className="border border-gray-800 bg-gray-900/60 rounded-2xl p-5 md:p-6 hover:border-emerald-500/50 hover:shadow-[0_0_25px_rgba(34,197,94,0.15)] transition"
                >
                  <div className="text-2xl md:text-3xl mb-2.5 md:mb-3">{f.icon}</div>
                  <h3 className="font-semibold text-white text-base md:text-lg mb-1">
                    {content.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{content.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* PARTNERS MARQUEE (denser, less empty space) */}
      <motion.div
        variants={scaleIn(0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 w-full mt-10 md:mt-14 overflow-hidden border-y border-gray-800 bg-gray-900/40"
      >
        <div className="flex animate-[marquee_28s_linear_infinite] gap-12 md:gap-16 py-4 md:py-6 px-6 md:px-8 whitespace-nowrap">
          {partners.concat(partners).map((p, i) => (
            <span
              key={i}
              className="text-gray-300/80 text-base md:text-lg tracking-wide hover:text-white transition select-none"
            >
              {p}
            </span>
          ))}
        </div>
        <div className="flex animate-[marqueeReverse_32s_linear_infinite] gap-12 md:gap-16 py-4 md:py-6 px-6 md:px-8 whitespace-nowrap opacity-70">
          {partners.concat(partners).map((p, i) => (
            <span key={"second" + i} className="text-gray-400/80 text-sm md:text-base tracking-wide select-none">
              {p}
            </span>
          ))}
        </div>
      </motion.div>

      {/* TESTIMONIALS — AutoCarousel */}
      <motion.div
        variants={fadeUp(0.05, 24)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 w-full mt-10 md:mt-14"
      >
        <div className="mx-auto max-w-4xl px-5 md:px-6">
          <h2 className="text-xl md:text-3xl font-bold text-left mb-4 md:mb-6">
            {tLabel("Відгуки користувачів", "What users say")}
          </h2>
          <AutoCarousel items={testimonials} />
        </div>
      </motion.div>

      {/* FAQ (Accordion with smoother spacing) */}
      <motion.div
        variants={fadeUp(0.05, 24)}
        initial="hidden"
        whileInView="show"
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 w-full mt-10 md:mt-14"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <h2 className="text-xl md:text-3xl font-bold text-left mb-4 md:mb-6">
            {i18n.language === "ua" ? "Питання та відповіді" : "FAQ"}
          </h2>

          <div className="columns-1 md:columns-2 gap-3 md:gap-4 space-y-3 md:space-y-4">
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
                  whileHover={{ y: -2 }}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.03 }}
                  viewport={{ once: true }}
                  className={`break-inside-avoid group rounded-2xl border ${
                    isOpen
                      ? "border-emerald-500/60 bg-gray-900/80 shadow-[0_0_25px_rgba(34,197,94,0.15)]"
                      : "border-gray-800 bg-gray-900/70"
                  } p-4 md:p-5 hover:border-emerald-500/50 transition duration-300`}
                >
                  <button
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-white font-medium text-left"
                  >
                    <span>{content.q}</span>
                    <motion.span
                      className="ml-4 text-emerald-400"
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    >
                      ⌄
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.p
                        key="answer"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.28 }}
                        className="mt-2.5 text-gray-300 leading-relaxed overflow-hidden"
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

      {/* POPULAR TESTS */}
      <motion.div
        id="popular"
        variants={fadeUp(0.05, 24)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 w-full mt-10 md:mt-14"
      >
        <div className="mx-auto max-w-6xl px-5 md:px-6">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <h2 className="text-xl md:text-3xl font-bold text-left">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-60 md:h-64 rounded-2xl border border-gray-800 bg-gray-900/50 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {popularTests.length > 0 ? (
                popularTests.map((tst) => (
                  <motion.div
                    key={tst.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45 }}
                    whileHover={{ y: -4 }}
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

                    <div className="flex flex-col flex-grow justify-between p-4 md:p-5">
                      <div>
                        <div className="flex items-start justify-between gap-4">
                          <h3 className="text-base md:text-lg font-semibold text-white line-clamp-2">
                            {tst.title}
                          </h3>
                          <span className="text-xs rounded-md px-2 py-1 bg-gray-800 text-gray-300 border border-gray-700 whitespace-nowrap">
                            {(tst.price_cents ?? 0) > 0
                              ? new Intl.NumberFormat(i18n.language === "ua" ? "uk-UA" : "en-US", {
                                style: "currency",
                                currency:
                                  (tst.currency || "usd").toUpperCase() === "UAH" ? "UAH" : "USD",
                              }).format(
                                (tst.currency || "usd").toUpperCase() === "UAH"
                                  ? tst.price_uah || 0
                                  : (tst.price_cents || 0) / 100,
                              )
                              : tLabel("Безкоштовно", "Free")}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-400 line-clamp-2">{tst.description}</p>
                      </div>

                      <div className="mt-3 md:mt-4 flex gap-2">
                        <button
                          onClick={() => navigate(`/tests/${tst.id}/details`)}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-gray-800 border border-gray-700 text-white hover:bg-gray-700 transition"
                        >
                          {tLabel("Деталі", "Details")}
                        </button>

                        <button
                          onClick={() => handleTakeTest(tst)}
                          className="flex-1 px-3 py-1.5 text-sm rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 transition"
                        >
                          {tLabel("Пройти", "Take")}
                        </button>

                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full text-gray-400 text-center py-8 md:py-10">
                  {tLabel("Немає тестів для відображення.", "No tests to show.")}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* PROFILE CARD (CTA) */}
      <motion.div
        variants={scaleIn(0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.25 }}
        className="relative z-10 mt-10 md:mt-14 flex justify-center items-center px-4 w-full"
      >
        <ProfileCard
          name="Олександр Гриньов"
          title="CertifyMe"
          handle="@certifyme"
          status="Online"
          contactText={t("contact_us") ?? "Зв’язатися"}
          avatarUrl="https://media.licdn.com/dms/image/v2/D4E03AQHY58oah0y-Yw/profile-displayphoto-scale_400_400/B4EZndyOpWHMAg-/0/1760362557538?e=1764201600&v=beta&t=wWV-GlQ-WPAOLjAiS-GUrq9l83mzS-0vBxGR5d7c_G4"
          showUserInfo={true}
          enableTilt={true}
          enableMobileTilt={false}
          onContactClick={() => window.open("https://www.linkedin.com/in/oleksandr-hrynov-5a8a63356/")}
        />
      </motion.div>

      {/* BOTTOM CTA */}
      <motion.div
        variants={fadeUp(0.05, 24)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.2 }}
        className="relative z-10 w-full mt-10 md:mt-14 mb-12 md:mb-16"
      >
        <div className="mx-auto max-w-4xl px-5 md:px-6">
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600/20 via-teal-600/10 to-emerald-600/20 p-6 md:p-8 backdrop-blur text-left">
            <h3 className="text-xl md:text-3xl font-bold">
              {tLabel("Готові прокачати навички?", "Ready to level up your skills?")}
            </h3>
            <p className="mt-2 text-gray-300 text-base md:text-lg leading-relaxed">
              {tLabel(
                "Обирайте тест, проходьте перевірку та отримуйте сертифікат, який підтвердить ваші знання.",
                "Choose a test, pass the assessment, and receive a verifiable certificate.",
              )}
            </p>
            <div className="mt-4 md:mt-5 flex flex-wrap gap-5">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to="/tests"
                  className="px-2 py-2 sm:px-5 sm:py-2 text-sm sm:text-base rounded-lg bg-emerald-500 text-gray-900 font-semibold hover:bg-emerald-400 transition w-full sm:w-auto text-center"
                >
                  {tLabel("Перейти до тестів", "Go to tests")}
                </Link>

                <a
                  href="#popular"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById("popular")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="px-2 py-2 sm:px-5 sm:py-2 text-sm sm:text-base bg-gray-800/70 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition w-full sm:w-auto text-center"
                >
                  {tLabel("Популярні тести", "Popular tests")}
                </a>

              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Scroll-to-top */}
      <ScrollToTopButton />

      {/* Keyframe styles (kept tight to avoid duplication & empty space) */}
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }
        @keyframes marqueeReverse { 0% { transform: translateX(-50%) } 100% { transform: translateX(0) } }
        @keyframes shimmer { 0% { transform: translateX(-120%) } 100% { transform: translateX(120%) } }
      `}</style>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
}
