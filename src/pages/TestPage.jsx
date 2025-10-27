import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
    LabelList,
} from "recharts";
import { updateAchievementsBatch } from "../services/achievementsService";
import toast, { Toaster } from "react-hot-toast";

export default function TestPage() {
    const { id } = useParams();
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    const [test, setTest] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        fetch(`http://localhost:5000/api/tests/${id}`)
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setTest(data.test);
            })
            .catch((err) => console.error("❌ Помилка завантаження тесту:", err));
    }, [id]);

    if (!test)
        return (
            <div className="text-center text-white mt-10">
                {lang === "ua" ? "Завантаження..." : "Loading..."}
            </div>
        );

    const getText = (item, field) =>
        item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

    const handleSelect = (qId, aId, checked) => {
        setAnswers((prev) => {
            const current = prev[qId] || [];
            const updated = checked
                ? [...current, aId]
                : current.filter((x) => x !== aId);
            return { ...prev, [qId]: updated };
        });
    };

    const handleSubmit = async () => {
        let correct = 0;

        test.questions.forEach((q) => {
            const correctAnswers = q.answers
                .filter((a) => String(a.is_correct) === "true")
                .map((a) => a.id);
            const selected = answers[q.id] || [];
            const isFullyCorrect =
                correctAnswers.length === selected.length &&
                correctAnswers.every((id) => selected.includes(id));
            if (isFullyCorrect) correct++;
        });

        setScore(correct);
        setSubmitted(true);

        try {
            const total = test.questions.length;
            const percent = Math.round((correct / total) * 100);
            const updates = [];

            // 🏅 Перший сертифікат
            updates.push({ code: "first_certificate", progress: 100 });

            // 🧠 Розумник (усі правильні)
            if (total > 0 && correct === total) {
                updates.push({ code: "no_mistakes", progress: 100 });
            }

            // ⚡ Серія ≥ 90%
            if (percent >= 90) {
                updates.push({ code: "streak_3_over_90", progress: 34 });
            }

            if (updates.length > 0) {
                // ✅ Відразу після кліку користувача (дозволений звук)
                const audio = new Audio("/unlock.mp3");
                audio.volume = 0.4;
                audio.play().catch(() => {});

                // 🟩 Надсилаємо оновлення на бек
                await updateAchievementsBatch(updates);

                // 🟢 Показуємо toast прямо тут
                updates.forEach((ach) => {
                    let title =
                        ach.code === "first_certificate"
                            ? lang === "ua"
                                ? "Перший сертифікат!"
                                : "First certificate!"
                            : ach.code === "no_mistakes"
                                ? lang === "ua"
                                    ? "Усі відповіді правильні!"
                                    : "All answers correct!"
                                : lang === "ua"
                                    ? "Високий результат!"
                                    : "High score!";

                    toast.success(`🏆 ${title}`, {
                        style: {
                            background: "#111",
                            color: "#22c55e",
                            border: "1px solid #22c55e",
                        },
                    });
                });
            }
        } catch (err) {
            console.error("❌ Failed to update achievements:", err);
        }
    };


    const COLORS = ["#22c55e", "#ef4444"];
    const data = [
        { name: lang === "ua" ? "Правильні" : "Correct", value: score },
        {
            name: lang === "ua" ? "Неправильні" : "Incorrect",
            value: test.questions.length - score,
        },
    ];

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-4xl mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
                <h1 className="text-3xl font-bold text-green-500 mb-4">
                    {getText(test, "title")}
                </h1>
                <p className="mb-6 text-gray-300">{getText(test, "description")}</p>

                {!submitted ? (
                    <div className="space-y-6">
                        {test.questions.map((q) => (
                            <div key={q.id} className="bg-gray-800 p-4 rounded-lg">
                                <h3 className="font-semibold mb-3">
                                    {getText(q, "question")}
                                </h3>
                                {q.answers.map((a) => {
                                    const selected = (answers[q.id] || []).includes(a.id);
                                    return (
                                        <label
                                            key={a.id}
                                            className={`block mb-2 p-2 rounded transition ${
                                                submitted
                                                    ? a.is_correct
                                                        ? "bg-green-700/30"
                                                        : selected
                                                            ? "bg-red-700/30"
                                                            : ""
                                                    : ""
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={(e) =>
                                                    handleSelect(q.id, a.id, e.target.checked)
                                                }
                                                disabled={submitted}
                                                className="mr-2 accent-green-500"
                                            />
                                            {getText(a, "answer")?.trim() || "(варіант без тексту)"}
                                        </label>
                                    );
                                })}
                            </div>
                        ))}

                        <button
                            onClick={handleSubmit}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg w-full"
                        >
                            {lang === "ua" ? "Завершити тест" : "Finish test"}
                        </button>
                    </div>
                ) : (
                    <div className="text-center mt-8 space-y-6">
                        <h2 className="text-2xl text-green-400 font-semibold">
                            {lang === "ua" ? "Результат тесту" : "Your Result"}
                        </h2>

                        <div className="w-full max-w-md mx-auto">
                            <ResponsiveContainer width="100%" height={320}>
                                <PieChart margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
                                    <Pie
                                        data={data}
                                        dataKey="value"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={110}
                                        paddingAngle={2}
                                        isAnimationActive
                                    >
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index]}
                                                stroke="none"
                                            />
                                        ))}

                                        <LabelList
                                            dataKey="value"
                                            position="inside"
                                            formatter={(value) => {
                                                const total = test.questions.length;
                                                const percent = Math.round((value / total) * 100);
                                                return `${percent}%`;
                                            }}
                                            style={{ fill: "#0b1220", fontWeight: 700 }}
                                        />
                                    </Pie>

                                    <Tooltip
                                        formatter={(v, n) => [
                                            v,
                                            n === (lang === "ua" ? "Правильні" : "Correct")
                                                ? lang === "ua"
                                                    ? "Правильні"
                                                    : "Correct"
                                                : lang === "ua"
                                                    ? "Неправильні"
                                                    : "Incorrect",
                                        ]}
                                        contentStyle={{
                                            background: "#101827",
                                            border: "1px solid #334155",
                                            color: "#e5e7eb",
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        wrapperStyle={{ color: "#e5e7eb" }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            <div className="mt-4 w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-4 bg-green-500 transition-all duration-700 ease-out"
                                    style={{
                                        width: `${Math.round(
                                            (score / test.questions.length) * 100
                                        )}%`,
                                    }}
                                />
                            </div>

                            <p className="mt-2 text-lg text-gray-200 font-medium text-center">
                                {lang === "ua"
                                    ? `Точність: ${Math.round(
                                        (score / test.questions.length) * 100
                                    )}%`
                                    : `Accuracy: ${Math.round(
                                        (score / test.questions.length) * 100
                                    )}%`}
                            </p>
                        </div>

                        <p className="text-xl">
                            {lang === "ua"
                                ? `Твій результат: ${score} з ${test.questions.length}`
                                : `Your score: ${score} out of ${test.questions.length}`}
                        </p>

                        <div className="relative bg-white text-gray-800 p-8 rounded-xl mt-6 w-[90%] md:w-[70%] mx-auto shadow-2xl overflow-hidden border border-gray-300">
                            <div className="relative z-0 text-center">
                                <h2 className="text-3xl font-bold text-green-600 mb-2">
                                    CertifyMe
                                </h2>
                                <p className="text-gray-600 text-sm mb-8">
                                    {lang === "ua"
                                        ? "Офіційне підтвердження проходження тесту"
                                        : "Official confirmation of test completion"}
                                </p>

                                <h3 className="text-xl font-semibold mb-2">
                                    {lang === "ua"
                                        ? "Цей сертифікат підтверджує, що"
                                        : "This certifies that"}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 mb-4">
                                    Student Name
                                </p>

                                <p className="text-gray-700 mb-6">
                                    {lang === "ua"
                                        ? `успішно завершив(ла) тест: "${getText(test, "title")}"`
                                        : `has successfully completed the test: "${getText(
                                            test,
                                            "title"
                                        )}"`}
                                </p>

                                <p className="text-gray-600 italic mb-8">
                                    {lang === "ua"
                                        ? `Результат: ${score} з ${
                                            test.questions.length
                                        } (${Math.round(
                                            (score / test.questions.length) * 100
                                        )}%)`
                                        : `Score: ${score} of ${
                                            test.questions.length
                                        } (${Math.round(
                                            (score / test.questions.length) * 100
                                        )}%)`}
                                </p>

                                <div className="flex justify-between items-center mt-10 px-8">
                                    <div>
                                        <div className="h-0.5 bg-gray-400 w-32 mx-auto mb-1"></div>
                                        <p className="text-sm text-gray-600">
                                            {lang === "ua"
                                                ? "Підпис викладача"
                                                : "Instructor Signature"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-500">
                                            {lang === "ua" ? "Дата видачі" : "Issued on"}
                                        </p>
                                        <p className="font-medium">
                                            {new Date().toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                        >
                            {lang === "ua" ? "Пройти ще раз" : "Try again"}
                        </button>
                    </div>
                )}
            </div>
            <Toaster position="top-center" />

        </section>
    );
}
