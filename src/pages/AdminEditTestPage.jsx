import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Save, Trash, ArrowLeft } from "lucide-react";

export default function AdminEditTestPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    // 🔹 Завантаження тесту
    useEffect(() => {
        const loadTest = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/tests/${id}`);
                const data = await res.json();
                if (data.success) {
                    setTest(data.test);
                    setQuestions(data.test.questions || []);
                }
            } catch (err) {
                console.error("❌ Помилка завантаження тесту:", err);
            } finally {
                setLoading(false);
            }
        };
        loadTest();
    }, [id]);

    // 🟩 Додати питання
    const addQuestion = () =>
        setQuestions([...questions, { question_ua: "", question_en: "", answers: [] }]);

    // 🟥 Видалити питання
    const removeQuestion = (qi) => {
        if (!window.confirm("Видалити це питання?")) return;
        setQuestions(questions.filter((_, i) => i !== qi));
    };

    // 🟨 Змінити питання
    const handleChangeQuestion = (qi, field, value) => {
        const updated = [...questions];
        updated[qi][field] = value;
        setQuestions(updated);
    };

    // 🟢 Додати варіант відповіді
    const addAnswer = (qi) => {
        const updated = [...questions];
        updated[qi].answers.push({ answer_ua: "", answer_en: "", is_correct: false });
        setQuestions(updated);
    };

    // 🟠 Змінити текст відповіді
    const handleChangeAnswer = (qi, ai, field, value) => {
        const updated = [...questions];
        updated[qi].answers[ai][field] = value;
        setQuestions(updated);
    };

    // 🟣 Позначити правильну
    const toggleCorrect = (qi, ai) => {
        const updated = [...questions];
        updated[qi].answers[ai].is_correct = !updated[qi].answers[ai].is_correct;
        setQuestions(updated);
    };

    // 🔴 Видалити варіант
    const removeAnswer = (qi, ai) => {
        const updated = [...questions];
        updated[qi].answers = updated[qi].answers.filter((_, i) => i !== ai);
        setQuestions(updated);
    };

    // 💾 Зберегти зміни
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:5000/api/tests/${id}/questions`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ questions }),
            });
            const data = await res.json();
            if (data.success) {
                alert("✅ Питання успішно оновлено!");
                navigate("/admin");
            } else {
                alert("❌ " + (data.message || "Помилка при оновленні"));
            }
        } catch (err) {
            console.error(err);
            alert("❌ Серверна помилка при збереженні");
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen text-gray-300">
                Завантаження тесту...
            </div>
        );

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6 animate-fadeIn">
            <div className="max-w-5xl mx-auto bg-gray-900/80 backdrop-blur-md rounded-2xl shadow-xl p-6 space-y-6 border border-gray-800">
                {/* Заголовок */}
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-green-500">
                        ✏️ Редагування тесту
                    </h1>
                    <button
                        onClick={() => navigate("/admin")}
                        className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2 rounded-lg transition"
                    >
                        <ArrowLeft size={16} /> Назад
                    </button>
                </div>

                {/* Інфо тесту */}
                <div className="p-4 bg-gray-800 rounded-xl mb-4 border border-gray-700">
                    <h2 className="text-xl font-semibold text-green-400 mb-2">
                        {test.title_ua}
                    </h2>
                    <p className="text-gray-400 text-sm">{test.description_ua}</p>
                </div>

                {/* Питання */}
                {questions.map((q, qi) => (
                    <div
                        key={qi}
                        className="bg-gray-800/80 p-5 rounded-xl border border-gray-700 hover:border-green-500 transition"
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-lg text-green-400">
                                Питання {qi + 1}
                            </h3>
                            <button
                                onClick={() => removeQuestion(qi)}
                                className="text-red-500 hover:text-red-700 transition"
                                title="Видалити питання"
                            >
                                <Trash size={18} />
                            </button>
                        </div>

                        {/* Питання поля */}
                        <div className="space-y-2 mb-3">
                            <input
                                value={q.question_ua}
                                onChange={(e) =>
                                    handleChangeQuestion(qi, "question_ua", e.target.value)
                                }
                                className="p-2 w-full bg-gray-700 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Питання (укр)"
                            />
                            <input
                                value={q.question_en}
                                onChange={(e) =>
                                    handleChangeQuestion(qi, "question_en", e.target.value)
                                }
                                className="p-2 w-full bg-gray-700 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="Question (eng)"
                            />
                        </div>

                        {/* Відповіді */}
                        {q.answers.map((a, ai) => (
                            <div
                                key={ai}
                                className={`flex flex-col sm:flex-row gap-2 mb-2 p-2 rounded-lg ${
                                    a.is_correct
                                        ? "bg-green-900/30 border border-green-600"
                                        : "bg-gray-700/60"
                                }`}
                            >
                                <div className="flex-1 flex flex-col sm:flex-row gap-2">
                                    <input
                                        value={a.answer_ua}
                                        onChange={(e) =>
                                            handleChangeAnswer(
                                                qi,
                                                ai,
                                                "answer_ua",
                                                e.target.value
                                            )
                                        }
                                        className="flex-1 bg-gray-800 p-2 rounded"
                                        placeholder="Відповідь (укр)"
                                    />
                                    <input
                                        value={a.answer_en}
                                        onChange={(e) =>
                                            handleChangeAnswer(
                                                qi,
                                                ai,
                                                "answer_en",
                                                e.target.value
                                            )
                                        }
                                        className="flex-1 bg-gray-800 p-2 rounded"
                                        placeholder="Answer (eng)"
                                    />
                                </div>

                                <div className="flex items-center gap-2 justify-end sm:w-auto">
                                    <button
                                        onClick={() => toggleCorrect(qi, ai)}
                                        className={`px-2 py-1 text-xs rounded ${
                                            a.is_correct
                                                ? "bg-green-600 hover:bg-green-700"
                                                : "bg-gray-600 hover:bg-gray-500"
                                        } transition`}
                                    >
                                        {a.is_correct ? "Правильна" : "Зробити правильною"}
                                    </button>
                                    <button
                                        onClick={() => removeAnswer(qi, ai)}
                                        className="text-red-400 hover:text-red-600"
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Додати варіант */}
                        <button
                            onClick={() => addAnswer(qi)}
                            className="mt-3 bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg flex items-center gap-1 text-sm transition"
                        >
                            <Plus size={16} /> Додати варіант
                        </button>
                    </div>
                ))}

                {/* Кнопки управління */}
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-6">
                    <button
                        onClick={addQuestion}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        <Plus size={18} /> Додати питання
                    </button>
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                    >
                        <Save size={18} /> Зберегти зміни
                    </button>
                </div>
            </div>
        </div>
    );
}
