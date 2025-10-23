import { useState } from "react";
import { Plus, Save, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminTestsPage() {
    const { i18n } = useTranslation();
    const isUa = i18n.language === "ua";

    // Основна інформація
    const [title, setTitle] = useState({ ua: "", en: "" });
    const [desc, setDesc] = useState({ ua: "", en: "" });
    const [imageUrl, setImageUrl] = useState("");
    const [questions, setQuestions] = useState([
        { question: { ua: "", en: "" }, answers: [] },
    ]);

    // 🔹 Додати питання
    const addQuestion = () => {
        setQuestions([...questions, { question: { ua: "", en: "" }, answers: [] }]);
    };

    // 🔹 Видалити питання
    const removeQuestion = (qIndex) => {
        setQuestions(questions.filter((_, i) => i !== qIndex));
    };

    // 🔹 Змінити текст питання
    const handleQuestionChange = (index, value) => {
        const updated = [...questions];
        updated[index].question[isUa ? "ua" : "en"] = value;
        setQuestions(updated);
    };

    // 🔹 Додати відповідь
    const addAnswer = (qIndex) => {
        const updated = [...questions];
        updated[qIndex].answers.push({ text: { ua: "", en: "" }, is_correct: false });
        setQuestions(updated);
    };

    // 🔹 Змінити відповідь
    const handleAnswerChange = (qIndex, aIndex, value) => {
        const updated = [...questions];
        updated[qIndex].answers[aIndex].text[isUa ? "ua" : "en"] = value;
        setQuestions(updated);
    };

    // 🔹 Перемкнути правильність
    const toggleCorrect = (qIndex, aIndex) => {
        const updated = [...questions];
        updated[qIndex].answers[aIndex].is_correct = !updated[qIndex].answers[aIndex].is_correct;
        setQuestions(updated);
    };

    // 🔹 Видалити варіант
    const removeAnswer = (qIndex, aIndex) => {
        const updated = [...questions];
        updated[qIndex].answers = updated[qIndex].answers.filter((_, i) => i !== aIndex);
        setQuestions(updated);
    };

    // 🔹 Зберегти тест
    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/tests", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title_ua: title.ua,
                title_en: title.en,
                description_ua: desc.ua,
                description_en: desc.en,
                image_url: imageUrl,
                questions: questions.map((q) => ({
                    question_ua: q.question.ua,
                    question_en: q.question.en,
                    answers: q.answers.map((a) => ({
                        answer_ua: a.text.ua,
                        answer_en: a.text.en,
                        is_correct: a.is_correct,
                    })),
                })),
            }),
        });

        const data = await res.json();
        if (data.success) {
            alert("✅ Тест успішно створено!");
            setTitle({ ua: "", en: "" });
            setDesc({ ua: "", en: "" });
            setImageUrl("");
            setQuestions([{ question: { ua: "", en: "" }, answers: [] }]);
        } else {
            alert("❌ " + data.message);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-4xl mx-auto bg-gray-900 rounded-xl shadow-lg p-6 space-y-6">
                <h1 className="text-3xl font-bold text-center mb-4 text-green-500">
                    {isUa ? "Створення тесту" : "Create Test"}
                </h1>

                {/* Загальна інформація */}
                <div className="space-y-3">
                    <input
                        value={isUa ? title.ua : title.en}
                        onChange={(e) =>
                            setTitle({ ...title, [isUa ? "ua" : "en"]: e.target.value })
                        }
                        placeholder={isUa ? "Назва тесту" : "Test title"}
                        className="p-2 rounded bg-gray-800 w-full"
                    />

                    <textarea
                        value={isUa ? desc.ua : desc.en}
                        onChange={(e) =>
                            setDesc({ ...desc, [isUa ? "ua" : "en"]: e.target.value })
                        }
                        placeholder={isUa ? "Опис тесту" : "Test description"}
                        className="p-2 rounded bg-gray-800 w-full"
                    />

                    <input
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder={isUa ? "URL зображення (необов’язково)" : "Image URL (optional)"}
                        className="p-2 rounded bg-gray-800 w-full"
                    />
                </div>

                {/* Питання */}
                <div className="space-y-6 mt-4">
                    {questions.map((q, qi) => (
                        <div key={qi} className="bg-gray-800 p-4 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-semibold text-lg">
                                    {isUa ? `Питання ${qi + 1}` : `Question ${qi + 1}`}
                                </h3>
                                <button
                                    onClick={() => removeQuestion(qi)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <Trash size={18} />
                                </button>
                            </div>

                            <input
                                value={isUa ? q.question.ua : q.question.en}
                                onChange={(e) => handleQuestionChange(qi, e.target.value)}
                                placeholder={isUa ? "Текст питання" : "Question text"}
                                className="p-2 w-full bg-gray-700 rounded mb-2"
                            />

                            {/* Варіанти */}
                            {q.answers.map((a, ai) => (
                                <div key={ai} className="flex gap-2 mb-2 items-center">
                                    <input
                                        value={isUa ? a.text.ua : a.text.en}
                                        onChange={(e) => handleAnswerChange(qi, ai, e.target.value)}
                                        placeholder={isUa ? "Варіант відповіді" : "Answer option"}
                                        className="flex-1 bg-gray-700 p-2 rounded"
                                    />
                                    <label className="flex items-center gap-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={a.is_correct}
                                            onChange={() => toggleCorrect(qi, ai)}
                                        />
                                        <span>✔</span>
                                    </label>
                                    <button
                                        onClick={() => removeAnswer(qi, ai)}
                                        className="text-red-400 hover:text-red-600"
                                        title={isUa ? "Видалити" : "Delete"}
                                    >
                                        <Trash size={16} />
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={() => addAnswer(qi)}
                                className="bg-green-600 px-3 py-1 rounded-lg mt-2 flex items-center gap-1 hover:bg-green-700"
                            >
                                <Plus size={16} /> {isUa ? "Додати варіант" : "Add option"}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Кнопки дій */}
                <div className="flex justify-between mt-4">
                    <button
                        onClick={addQuestion}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Plus size={18} /> {isUa ? "Додати питання" : "Add question"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Save size={18} /> {isUa ? "Зберегти тест" : "Save test"}
                    </button>
                </div>
            </div>
        </div>
    );
}
