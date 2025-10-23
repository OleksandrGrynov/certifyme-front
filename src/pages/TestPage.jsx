import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function TestPage() {
    const { id } = useParams();
    const { i18n } = useTranslation(); // 👈 зчитуємо поточну мову
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

    if (!test) return <div className="text-center text-white mt-10">Завантаження...</div>;

    const handleSelect = (qId, aId) => {
        setAnswers({ ...answers, [qId]: aId });
    };

    const handleSubmit = () => {
        let correct = 0;
        test.questions.forEach((q) => {
            const selected = answers[q.id];
            const right = q.answers.find((a) => a.is_correct);
            if (selected === right?.id) correct++;
        });
        setScore(correct);
        setSubmitted(true);
    };

    // 🧠 Вибираємо потрібну мову для полів
    const getText = (item, field) => item?.[`${field}_${lang}`] || item?.[`${field}_ua`] || "";

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
                                {q.answers.map((a) => (
                                    <label key={a.id} className="block mb-2">
                                        <input
                                            type="radio"
                                            name={`q-${q.id}`}
                                            checked={answers[q.id] === a.id}
                                            onChange={() => handleSelect(q.id, a.id)}
                                            className="mr-2"
                                        />
                                        {getText(a, "answer")?.trim() || "(варіант без тексту)"}
                                    </label>
                                ))}
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
                    <div className="text-center mt-8">
                        <h2 className="text-2xl text-green-400 mb-2">
                            {lang === "ua" ? "Результат:" : "Result:"}
                        </h2>
                        <p className="text-xl">
                            {score} {lang === "ua" ? "з" : "out of"}{" "}
                            {test.questions.length}{" "}
                            {lang === "ua"
                                ? "правильних відповідей"
                                : "correct answers"}
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-4 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg"
                        >
                            {lang === "ua" ? "Пройти ще раз" : "Try again"}
                        </button>
                    </div>
                )}
            </div>
        </section>
    );
}
