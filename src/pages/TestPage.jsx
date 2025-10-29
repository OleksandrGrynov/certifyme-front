import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import {jwtDecode} from "jwt-decode";

export default function TestPage() {
    const { id } = useParams();
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [explanations, setExplanations] = useState({});

    const secondsPerQuestion = 120; // 2 minutes per question
    const [secondsLeft, setSecondsLeft] = useState(null);
    const timerRef = useRef(null);

    // 📦 Завантаження кешу
    useEffect(() => {
        const saved = localStorage.getItem(`explanations_${id}`);
        if (saved) setExplanations(JSON.parse(saved));
    }, [id]);

    // 💾 Збереження кешу
    useEffect(() => {
        if (Object.keys(explanations).length > 0)
            localStorage.setItem(`explanations_${id}`, JSON.stringify(explanations));
    }, [explanations, id]);

    // 📥 Завантаження тесту
    useEffect(() => {
        fetch(`http://localhost:5000/api/tests/${id}`)
            .then((r) => r.json())
            .then((data) => data.success && setTest(data.test))
            .catch((err) => console.error("❌ Помилка завантаження тесту:", err));
    }, [id]);

    // helper to get localized text
    const getText = (item, field) =>
        item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

    // ✅ Обробка вибору відповіді
    const handleSelect = (qId, aId, checked) => {
        setAnswers((prev) => {
            const updated = checked
                ? [...(prev[qId] || []), aId]
                : (prev[qId] || []).filter((x) => x !== aId);
            return { ...prev, [qId]: updated };
        });
    };

    // 🔊 Відтворення звуку
    const playUnlockSound = () => {
        const audio = new Audio("/unlock.mp3");
        audio.volume = 0.8;
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn("⚠️ Sound blocked:", err.message));
    };

    // 🏆 Розблокування досягнення (оновлено)
    const unlockAchievement = async (code) => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            // 🔍 Отримуємо ID користувача з токена
            const user = jwtDecode(token);
            const userId = user?.id || user?.user_id || user?.email || "guest";

            const res = await fetch("http://localhost:5000/api/achievements/unlock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ code }),
            });

            const data = await res.json();

            if (data.success && data.achievement) {
                // 🔑 Унікальний ключ для конкретного користувача і досягнення
                const key = `shown-achievement-${userId}-${data.achievement.id}`;

                // ✅ показуємо тільки 1 раз для цього користувача
                if (!localStorage.getItem(key)) {
                    localStorage.setItem(key, "true");

                    toast.success(
                        lang === "ua"
                            ? `🏆 Досягнення розблоковано: ${data.achievement.title_ua}`
                            : `🏆 Achievement unlocked: ${data.achievement.title_en}`,
                        {
                            style: {
                                background: "#111",
                                color: "#22c55e",
                                border: "1px solid #22c55e",
                            },
                        }
                    );

                    playUnlockSound();
                    window.dispatchEvent(new Event("achievementUpdated"));
                } else {
                    console.log(
                        `🟢 Досягнення "${data.achievement.title_ua}" вже показано для користувача ${userId}`
                    );
                }
            }
        } catch (err) {
            console.error("❌ Achievement unlock failed:", err);
        }
    };

    // ✅ Обробка результату
    const handleSubmit = async () => {
        let correct = 0;
        test.questions.forEach((q) => {
            const correctAnswers = q.answers.filter((a) => a.is_correct).map((a) => a.id);
            const selected = answers[q.id] || [];
            const isRight =
                correctAnswers.length === selected.length &&
                correctAnswers.every((id) => selected.includes(id));
            if (isRight) correct++;
        });
        setScore(correct);
        setSubmitted(true);

        try {
            await unlockAchievement("first_certificate");
            if (correct === test.questions.length)
                await unlockAchievement("no_mistakes");
        } catch (err) {
            console.error("❌ Помилка при оновленні досягнення:", err);
        }
    };

    // 🧠 Отримати пояснення (GPT)
    const handleExplain = async (q, i) => {
        if (explanations[i]) {
            setExplanations((prev) => ({
                ...prev,
                [i]: { ...prev[i], visible: !prev[i].visible },
            }));
            return;
        }

        const userAnswer = q.answers.find((a) =>
            (answers[q.id] || []).includes(a.id)
        )?.answer_ua;

        try {
            const res = await fetch("http://localhost:5000/api/tests/explain-one", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    question: q.question_ua,
                    options: q.answers.map((a) => a.answer_ua),
                    correct: q.answers.find((a) => a.is_correct)?.answer_ua,
                    userAnswer,
                }),
            });

            const data = await res.json();

            if (data.success) {
                const cleanUa = data.explanation_ua.replace(/\*\*/g, "").trim();
                const cleanEn = data.explanation_en.replace(/\*\*/g, "").trim();
                setExplanations((prev) => ({
                    ...prev,
                    [i]: { ua: cleanUa, en: cleanEn, visible: true },
                }));
            } else toast.error("❌ Не вдалося отримати пояснення");
        } catch {
            toast.error("❌ Сервер недоступний");
        }
    };

    // 🎓 Генерація PDF сертифіката
    const handleCertificate = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return toast.error("Спочатку увійди у свій акаунт!");

            const res = await fetch("http://localhost:5000/api/tests/certificate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    test_title: getText(test, "title"),
                    score,
                    total: test.questions.length,
                }),
            });

            if (!res.ok) throw new Error("Download failed");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Certificate_${getText(test, "title")}.pdf`;
            a.click();

            toast.success(
                lang === "ua" ? "🎓 Сертифікат згенеровано!" : "🎓 Certificate generated!"
            );
        } catch {
            toast.error("❌ Не вдалося згенерувати сертифікат");
        }
    };

    // Start countdown when test is loaded; auto-submit when timer hits zero
    useEffect(() => {
        if (!test) {
            setSecondsLeft(null);
            return;
        }

        // initialize secondsLeft based on number of questions
        const total = (test.questions?.length || 0) * secondsPerQuestion;
        setSecondsLeft(total);

        // clear any previous timer
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        timerRef.current = setInterval(() => {
            setSecondsLeft((s) => {
                if (s === null) return null;
                if (s <= 1) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                    // auto-submit if not already submitted
                    if (!submitted) {
                        toast.error(lang === "ua" ? "Час вичерпано — тест автоматично завершено" : "Time is up — test auto-submitted");
                        handleSubmit();
                    }
                    return 0;
                }
                return s - 1;
            });
        }, 1000);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [test, submitted]);

    // stop timer when user submits manually (defensive)
    useEffect(() => {
        if (submitted && timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, [submitted]);

    const formatTime = (totalSeconds) => {
        if (totalSeconds === null) return "--:--";
        const m = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, "0");
        const s = Math.floor(totalSeconds % 60)
            .toString()
            .padStart(2, "0");
        return `${m}:${s}`;
    };

    // --- now render (all hooks have been called above)
    if (!test)
        return (
            <div className="text-center text-white mt-10">
                {lang === "ua" ? "Завантаження..." : "Loading..."}
            </div>
        );

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-800"
            >
                <h1 className="text-3xl font-bold text-green-500 mb-4 text-center">
                    {getText(test, "title")}
                </h1>

                {/* Timer badge */}
                <div className="flex items-center justify-center mb-4 gap-3">
                    <div className="px-3 py-1 bg-gray-800 text-sm rounded-md border border-gray-700">
                        {lang === "ua" ? "Час на питання:" : "Per-question"}
                        {" "}2 {lang === "ua" ? "хв" : "min"}
                    </div>
                    <div className="px-3 py-1 bg-red-700 text-sm rounded-md font-mono">
                        {formatTime(secondsLeft)}
                    </div>
                </div>

                <p className="mb-6 text-gray-300 text-center">{getText(test, "description")}</p>

                {!submitted ? (
                    <>
                        {test.questions.map((q, idx) => (
                            <motion.div
                                key={q.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-gray-800 p-5 rounded-xl mb-5 border border-gray-700 hover:border-green-600 transition"
                            >
                                <h3 className="font-semibold mb-3 text-lg">
                                    {getText(q, "question")}
                                </h3>
                                {q.answers.map((a) => {
                                    const selected = (answers[q.id] || []).includes(a.id);
                                    return (
                                        <label
                                            key={a.id}
                                            className={`block mb-2 p-2 rounded transition ${
                                                selected
                                                    ? "bg-green-700/20"
                                                    : "hover:bg-gray-700/40"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={(e) =>
                                                    handleSelect(q.id, a.id, e.target.checked)
                                                }
                                                className="mr-2 accent-green-500"
                                            />
                                            {getText(a, "answer")?.trim() || "(empty option)"}
                                        </label>
                                    );
                                })}
                            </motion.div>
                        ))}

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full font-semibold transition"
                        >
                            {lang === "ua" ? "Завершити тест" : "Finish test"}
                        </motion.button>
                    </>
                ) : (
                    <div className="mt-6 space-y-6">
                        <h2 className="text-2xl text-green-400 font-semibold text-center">
                            {lang === "ua" ? "Результати тесту" : "Test results"}
                        </h2>

                        {test.questions.map((q, i) => {
                            // get all correct answers and all user-selected answers
                            const correctAnswers = q.answers.filter((a) => a.is_correct);
                            const userAnswers = q.answers.filter((a) =>
                                (answers[q.id] || []).includes(a.id)
                            );

                            return (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="bg-gray-800 p-5 rounded-xl border border-gray-700"
                                >
                                    <h3 className="font-semibold mb-2 text-white text-lg">
                                        {getText(q, "question")}
                                    </h3>

                                    <p>
                                        <span className="text-gray-400">
                                            {lang === "ua" ? "Твої відповіді: " : "Your answers: "}
                                        </span>
                                        <span>
                                            {userAnswers.length ? (
                                                userAnswers.map((ua, idx) => (
                                                    <span
                                                        key={ua.id}
                                                        className={
                                                            ua.is_correct ? "text-green-400" : "text-red-400"
                                                        }
                                                    >
                                                        {getText(ua, "answer") || "—"}
                                                        {idx < userAnswers.length - 1 ? ", " : ""}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-gray-300">—</span>
                                            )}
                                        </span>
                                    </p>

                                    <p className="text-gray-300 mb-3">
                                        <span className="text-gray-400">
                                            {lang === "ua" ? "Правильні відповіді: " : "Correct answers: "}
                                        </span>
                                        <span className="text-green-400">
                                            {correctAnswers.map((ca, idx) => (
                                                <span key={ca.id}>
                                                    {getText(ca, "answer")}
                                                    {idx < correctAnswers.length - 1 ? ", " : ""}
                                                </span>
                                            ))}
                                        </span>
                                    </p>

                                    {/* 🧠 Кнопка пояснення */}
                                    <button
                                        onClick={() => handleExplain(q, i)}
                                        className={`${
                                            explanations[i]?.visible
                                                ? "bg-green-700 hover:bg-green-800"
                                                : "bg-blue-600 hover:bg-blue-700"
                                        } px-3 py-2 rounded-lg transition flex items-center gap-2`}
                                    >
                                        {explanations[i]?.visible
                                            ? lang === "ua"
                                                ? "🔽 Сховати"
                                                : "🔽 Hide"
                                            : lang === "ua"
                                                ? "🧠 Пояснити це питання"
                                                : "🧠 Explain this question"}
                                    </button>

                                    <AnimatePresence>
                                        {explanations[i]?.visible && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.4 }}
                                                className="mt-3 bg-gray-900 border border-green-600 p-4 rounded-xl shadow-inner"
                                            >
                                                <h4 className="text-green-400 font-semibold mb-3">
                                                    💡{" "}
                                                    {lang === "ua"
                                                        ? "Пояснення"
                                                        : "Explanation"}
                                                </h4>

                                                {(lang === "ua"
                                                        ? explanations[i].ua
                                                        : explanations[i].en || explanations[i].ua
                                                )
                                                    .split(/\n|(?=✅|❌|👉)/)
                                                    .filter((p) => p.trim())
                                                    .map((p, j) => (
                                                        <p key={j} className="mb-2 text-gray-200">
                                                            {p.trim()}
                                                        </p>
                                                    ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            );
                        })}

                        {/* 🎓 Отримати сертифікат */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleCertificate}
                            className="mt-4 bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-3 rounded-lg w-full font-semibold transition"
                        >
                            {lang === "ua"
                                ? "🎓 Отримати сертифікат"
                                : "🎓 Get Certificate"}
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg w-full font-semibold transition"
                        >
                            {lang === "ua" ? "Пройти ще раз" : "Try again"}
                        </motion.button>
                    </div>
                )}
            </motion.div>

            <Toaster position="top-center" />
        </section>
    );
}
