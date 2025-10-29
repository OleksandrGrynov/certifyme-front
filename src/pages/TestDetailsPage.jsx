import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function TestDetailsPage() {
    const { id } = useParams();
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // inferred metadata (used when backend does not provide difficulty/tags)
    const [inferred, setInferred] = useState({ difficulty: null, tags: [] });

    // helpers to infer tags / difficulty from text
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

    const inferDifficultyLocal = (t) => {
        if (!t || !t.questions || t.questions.length === 0) return { key: "unknown", labelUa: "—", labelEn: "—" };
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

    const secondsPerQuestion = 120; // 2 minutes per question

    useEffect(() => {
        let mounted = true;
        fetch(`http://localhost:5000/api/tests/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (!mounted) return;
                if (data.success && data.test) {
                    setTest(data.test);
                    // compute inferred metadata as fallback (only used if backend didn't provide)
                    try {
                        const tags = inferTagsLocal(data.test);
                        const difficulty = inferDifficultyLocal(data.test);
                        setInferred({ difficulty, tags });
                    } catch (e) {
                        // ignore inference errors
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

    const getText = (item, field) =>
        item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

    // prepare values used in UI: prefer backend, otherwise use inferred
    const difficultyLabel = (test?.difficulty && test.difficulty !== "")
        ? test.difficulty
        : (inferred.difficulty ? (lang === "ua" ? inferred.difficulty.labelUa : inferred.difficulty.labelEn) : "—");
    const tagsToShow = (test?.tags && test.tags.length > 0) ? test.tags : inferred.tags || [];

    if (loading)
        return (
            <div className="text-center text-white mt-10">
                {lang === "ua" ? "Завантаження..." : "Loading..."}
            </div>
        );

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
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-3xl mx-auto bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-lg"
            >
                <h1 className="text-3xl font-bold text-green-400 mb-2">
                    {getText(test, "title")}
                </h1>

                <p className="text-gray-300 mb-6">{getText(test, "description")}</p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div className="text-sm text-gray-400">{lang === "ua" ? "Питань" : "Questions"}</div>
                        <div className="text-lg font-semibold">{test.questions?.length || 0}</div>
                    </div>

                    {/* Replaced duration box: show per-question and total minutes based on questions */}
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
                                            { (getText(a, "answer") || "").length > 60 ? "…" : "" }
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

                <div className="flex gap-3">
                    <Link to={`/tests/${id}`} className="flex-1">
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md font-semibold transition">
                            {lang === "ua" ? "Пройти тест" : "Start test"}
                        </button>
                    </Link>

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
