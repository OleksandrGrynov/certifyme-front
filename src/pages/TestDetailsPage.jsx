import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function TestDetailsPage() {
    const { id } = useParams();
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();
    const lang = i18n.language === "en" ? "en" : "ua";
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [hasAccess, setHasAccess] = useState(false);
    const [checkingAccess, setCheckingAccess] = useState(false);
    const [paying, setPaying] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const [inferred, setInferred] = useState({ difficulty: null, tags: [] });

    // 🧩 Збір тексту для аналізу
    const gatherText = (t) => {
        const parts = [];
        if (!t) return "";
        if (t.title_ua) parts.push(t.title_ua);
        if (t.title_en) parts.push(t.title_en);
        if (t.description_ua) parts.push(t.description_ua);
        if (t.description_en) parts.push(t.description_en);
        (t.questions || []).forEach((q) => {
            if (q.question_ua) parts.push(q.question_ua);
            if (q.question_en) parts.push(q.question_en);
            (q.answers || []).forEach((a) => {
                if (a.answer_ua) parts.push(a.answer_ua);
                if (a.answer_en) parts.push(a.answer_en);
            });
        });
        return parts.join(" ").toLowerCase();
    };

    // 🔎 Локальне визначення тегів
    const inferTagsLocal = (t) => {
        if (!t || !t.questions || t.questions.length === 0) return [];
        const text = gatherText(t);
        const keywords = {
            react: ["react", "jsx", "useState", "useEffect"],
            javascript: ["javascript", "js", "node", "es6"],
            css: ["css", "tailwind", "scss", "sass"],
            html: ["html", "doctype"],
            sql: ["sql", "select", "join", "database", "postgres", "mysql"],
            docker: ["docker", "container", "image", "dockerfile"],
            git: ["git", "commit", "branch", "merge", "rebase"],
            security: ["xss", "csrf", "encryption", "oauth", "jwt"],
            algorithms: ["algorithm", "complexity", "big o", "sorting", "binary"],
            regex: ["regex", "regular expression"],
            network: ["http", "https", "tcp", "udp", "socket"],
            typescript: ["typescript", "ts", "interface", "type"],
            python: ["python", "django", "flask"],
        };
        const found = [];
        for (const tag in keywords) {
            for (const kw of keywords[tag]) {
                if (text.includes(kw)) {
                    found.push(tag);
                    break;
                }
            }
        }
        if (found.length === 0) {
            const words = text.split(/\W+/).filter(Boolean);
            const freq = {};
            words.forEach((w) => {
                if (w.length > 4) freq[w] = (freq[w] || 0) + 1;
            });
            return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
        }
        return found.slice(0, 5);
    };

    // 📊 Визначення складності
    const inferDifficultyLocal = (t) => {
        if (!t || !t.questions || t.questions.length === 0)
            return { key: "unknown", labelUa: "—", labelEn: "—" };
        const qs = t.questions;
        const avgOptions = qs.reduce((s, q) => s + (q.answers?.length || 0), 0) / qs.length;
        const avgCorrect = qs.reduce((s, q) => s + (q.answers?.filter(a => a.is_correct).length || 0), 0) / qs.length;
        const avgQLen = qs.reduce((s, q) => s + ((q.question_ua || q.question_en || "").length || 0), 0) / qs.length;
        let score = 0;
        score += (avgOptions - 2) * 0.6;
        score += (avgCorrect - 1) * 1.2;
        score += (Math.min(avgQLen, 400) / 400) * 0.8;
        if (score <= 0.8) return { key: "easy", labelUa: "Легкий", labelEn: "Easy" };
        if (score <= 1.8) return { key: "medium", labelUa: "Середній", labelEn: "Medium" };
        return { key: "hard", labelUa: "Важкий", labelEn: "Hard" };
    };

    const secondsPerQuestion = 120;

    // ✅ Якщо повернулись після Stripe (?paid=true)
    useEffect(() => {
        const grantAccessAfterPayment = async () => {
            const params = new URLSearchParams(location.search);
            const isPaid = params.get("paid") === "true";
            if (!isPaid) return;

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 4000);

            try {
                const token = localStorage.getItem("token");
                const lastPaidTestId = localStorage.getItem("lastPaidTestId");
                if (!token || !lastPaidTestId) return;

                const res = await fetch("http://localhost:5000/api/user/tests/grant", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ testId: lastPaidTestId }),
                });

                const data = await res.json();
                if (data.success) {
                    localStorage.removeItem("lastPaidTestId");
                    setHasAccess(true);
                    navigate(`/tests/${id}`, { replace: true });
                }
            } catch (err) {
                console.error("❌ Failed to grant access:", err);
            }
        };

        grantAccessAfterPayment();
    }, [location, id, navigate]);

    // 🧠 Завантаження тесту
    useEffect(() => {
        let mounted = true;
        fetch(`http://localhost:5000/api/tests/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                if (data.success && data.test) {
                    setTest(data.test);
                    try {
                        const tags = inferTagsLocal(data.test);
                        const difficulty = inferDifficultyLocal(data.test);
                        setInferred({ difficulty, tags });
                    } catch (e) {
                        console.warn("Inference error", e);
                    }
                } else {
                    setError("Test not found");
                }
            })
            .catch((e) => {
                console.error("Fetch test details error:", e);
                if (mounted) setError("Failed to load test");
            })
            .finally(() => mounted && setLoading(false));
        return () => (mounted = false);
    }, [id]);

    // 🔐 Перевірка доступу
    useEffect(() => {
        if (!token) return;
        const checkAccess = async () => {
            setCheckingAccess(true);
            try {
                const res = await fetch(`http://localhost:5000/api/user/tests/check/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setHasAccess(!!data.hasAccess);
            } catch {
                setHasAccess(false);
            } finally {
                setCheckingAccess(false);
            }
        };
        checkAccess();
    }, [id, token]);

    const getText = (item, field) =>
        item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

    // 💳 Купівля / старт
    const handleStartOrBuy = async () => {
        if (!token) {
            alert(lang === "ua" ? "Спочатку увійдіть у профіль" : "Please sign in first");
            return;
        }

        if (hasAccess) {
            navigate(`/tests/${id}`);
            return;
        }

        try {
            setPaying(true);
            const res = await fetch("http://localhost:5000/api/payments/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ testId: id }),
            });
            const data = await res.json();
            if (data?.url) {
                localStorage.setItem("lastPaidTestId", id);
                window.location.href = data.url;
            } else {
                alert(data?.message || (lang === "ua" ? "Помилка створення оплати" : "Payment error"));
            }
        } catch (err) {
            console.error(err);
            alert(lang === "ua" ? "Помилка мережі" : "Network error");
        } finally {
            setPaying(false);
        }
    };

    const difficultyLabel = (test?.difficulty && test.difficulty !== "")
        ? test.difficulty
        : (inferred.difficulty ? (lang === "ua" ? inferred.difficulty.labelUa : inferred.difficulty.labelEn) : "—");

    const tagsToShow = (test?.tags && test.tags.length > 0) ? test.tags : inferred.tags || [];

    if (loading)
        return <div className="text-center text-white mt-10">{lang === "ua" ? "Завантаження..." : "Loading..."}</div>;

    if (error || !test)
        return (
            <div className="text-center text-white mt-10">
                {lang === "ua" ? "Помилка: " : "Error: "} {error || "No test"}
                <div className="mt-4">
                    <Link to="/tests" className="text-green-400 underline">
                        {lang === "ua" ? "Назад до списку тестів" : "Back to tests"}
                    </Link>
                </div>
            </div>
        );

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            {/* ✅ Повідомлення про оплату */}
            {showSuccess && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold">
                    {lang === "ua"
                        ? "✅ Оплата успішна! Доступ до тесту відкрито."
                        : "✅ Payment successful! Access granted."}
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg"
            >
                <h1 className="text-3xl font-bold text-green-400 mb-2">{getText(test, "title")}</h1>
                <p className="text-gray-300 mb-6">{getText(test, "description")}</p>

                {/* 📊 Інфо блоки */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-400">{lang === "ua" ? "Питань" : "Questions"}</div>
                        <div className="text-lg font-semibold">{test.questions?.length || 0}</div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-400">{lang === "ua" ? "Час" : "Time"}</div>
                        <div className="text-lg font-semibold">
                            {Math.ceil(secondsPerQuestion / 60)} {lang === "ua" ? "хв на питання" : "min per question"}
                            <div className="text-sm text-gray-400 mt-1">
                                {lang === "ua" ? "Всього: " : "Total: "}
                                {Math.ceil(((test.questions?.length || 0) * secondsPerQuestion) / 60)}{" "}
                                {lang === "ua" ? "хв" : "min"}
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-400">{lang === "ua" ? "Складність" : "Difficulty"}</div>
                        <div className="text-lg font-semibold">{difficultyLabel}</div>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-400">{lang === "ua" ? "Теги" : "Tags"}</div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {tagsToShow.length > 0 ? (
                                tagsToShow.map((t) => (
                                    <span key={t} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                        {t}
                                    </span>
                                ))
                            ) : (
                                <span className="text-gray-400">—</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🧩 Приблизні питання */}
                <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">
                        {lang === "ua" ? "Приблизний перегляд питань" : "Sample questions"}
                    </h3>

                    <div className="space-y-4">
                        {(test.questions || []).slice(0, 3).map((q, idx) => (
                            <div key={q.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                                <div className="font-medium mb-2">
                                    {idx + 1}. {getText(q, "question")}
                                </div>
                                <div className="text-sm text-gray-300">
                                    {lang === "ua" ? "Варіанти: " : "Options: "}
                                    {(q.answers || []).map((a, i) => (
                                        <span key={a.id} className="inline-block mr-2">
                                            {i + 1}) {getText(a, "answer")?.slice(0, 60)}
                                            {(getText(a, "answer") || "").length > 60 ? "…" : ""}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {(test.questions || []).length === 0 && (
                            <div className="text-gray-400">{lang === "ua" ? "Питань немає" : "No questions"}</div>
                        )}
                    </div>
                </div>

                {/* 🎯 Кнопки */}
                <div className="flex gap-3">
                    <button
                        onClick={handleStartOrBuy}
                        disabled={checkingAccess || paying}
                        className={`flex-1 py-2 rounded-md font-semibold transition ${
                            hasAccess
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-yellow-600 hover:bg-yellow-700 text-white"
                        }`}
                    >
                        {checkingAccess || paying
                            ? (lang === "ua" ? "Завантаження..." : "Loading...")
                            : hasAccess
                                ? (lang === "ua" ? "Пройти тест" : "Start test")
                                : (lang === "ua" ? "Оплатити тест" : "Buy test")}
                    </button>

                    <Link to="/tests" className="flex-1">
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md transition">
                            {lang === "ua" ? "Назад до тестів" : "Back to tests"}
                        </button>
                    </Link>
                </div>
            </motion.div>
        </section>
    );
}
