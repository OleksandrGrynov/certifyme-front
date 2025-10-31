import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Trash,
    Edit3,
    Save,
    Eye,
    Settings2,
    X,
    CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminTestsPage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [tests, setTests] = useState([]);
    const [editingTest, setEditingTest] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState("edit");
    const [toast, setToast] = useState(false);

    // 📚 Завантажити всі тести
    const loadTests = async () => {
        try {
            const lang = i18n.language || "ua";
            const res = await fetch(`http://localhost:5000/api/tests?lang=${lang}`);
            const data = await res.json();
            if (data.success) setTests(data.tests || []);
        } catch (err) {
            console.error("❌ Помилка отримання тестів:", err);
        }
    };

    useEffect(() => {
        loadTests();
    }, [i18n.language]);

    // 🗑️ Видалити тест
    const handleDeleteTest = async (id) => {
        if (!window.confirm(t("admin.confirmDeleteTest"))) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setTests((prev) => prev.filter((t) => t.id !== id));
        }
    };

    // ✏️ Відкрити модалку для редагування
    const handleEdit = async (test) => {
        const lang = i18n.language || "ua";
        const res = await fetch(`http://localhost:5000/api/tests/${test.id}?lang=${lang}`);
        const data = await res.json();

        if (data.success) {
            setEditingTest({
                ...data.test,
                price_cents: data.test.price_cents || 0,
                currency: data.test.currency || "usd",
                questions: data.test.questions || [],
            });
            navigate("/admin/tests/" + test.id + "/edit");
            setActiveTab("edit");
        }
    };

    // 🟩 Додати питання
    const addQuestion = () => {
        setEditingTest({
            ...editingTest,
            questions: [
                ...(editingTest.questions || []),
                { question_ua: "", question_en: "", answers: [] },
            ],
        });
    };

    // 🟦 Додати відповідь
    const addAnswer = (qi) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers.push({
            answer_ua: "",
            answer_en: "",
            is_correct: false,
        });
        setEditingTest(updated);
    };

    // 🟨 Змінити текст питання або відповіді
    const handleChangeQuestion = (qi, field, value) => {
        const updated = { ...editingTest };
        updated.questions[qi][field] = value;
        setEditingTest(updated);
    };

    const handleChangeAnswer = (qi, ai, field, value) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers[ai][field] = value;
        setEditingTest(updated);
    };

    // 🔄 Змінити правильність
    const toggleCorrect = (qi, ai) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers[ai].is_correct =
            !updated.questions[qi].answers[ai].is_correct;
        setEditingTest(updated);
    };

    // 🗑️ Видалити питання / варіант
    const removeQuestion = (qi) => {
        const updated = { ...editingTest };
        updated.questions = updated.questions.filter((_, i) => i !== qi);
        setEditingTest(updated);
    };

    const removeAnswer = (qi, ai) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers = updated.questions[qi].answers.filter(
            (_, i) => i !== ai
        );
        setEditingTest(updated);
    };

    // 💾 Зберегти зміни
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
                `http://localhost:5000/api/tests/${editingTest.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(editingTest),
                }
            );
            const data = await res.json();
            if (data.success) {
                setToast(true);
                setTimeout(() => {
                    setToast(false);
                    navigate("/admin");
                }, 3000);
            }
        } catch (err) {
            console.error("❌ Error saving test:", err);
        }
    };

    return (
        <div className="relative">
            {/* ✅ Toast */}
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
                    <CheckCircle className="inline mr-2" size={18} />
                    {t("admin.testUpdated") || "✅ Зміни успішно збережено!"}
                </div>
            )}

            {/* Заголовок */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-green-400">{t("admin.tests")}</h2>
                <button
                    onClick={() => navigate("/admin/tests/create")}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} /> {t("admin.createTest")}
                </button>
            </div>

            {/* Список тестів */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {tests.map((tst) => (
                    <div
                        key={tst.id}
                        className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                    >
                        {tst.image_url && (
                            <img
                                src={tst.image_url}
                                alt="preview"
                                className="rounded mb-2 h-32 w-full object-cover"
                            />
                        )}
                        <h3 className="font-bold text-lg text-white">
                            {tst.title_ua || tst.title}
                        </h3>
                        <p className="text-sm text-gray-400 mb-3">
                            {tst.description_ua || tst.description}
                        </p>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(tst)}
                                className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1 rounded flex items-center justify-center gap-1"
                            >
                                <Edit3 size={16} /> {t("common.edit")}
                            </button>
                            <button
                                onClick={() => handleDeleteTest(tst.id)}
                                className="bg-red-600 hover:bg-red-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                            >
                                <Trash size={16} /> {t("common.delete")}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* 🪟 Модальне редагування */}
            {showModal && editingTest && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-40 p-4">
                    <div className="bg-gray-900 rounded-xl w-full max-w-4xl shadow-2xl border border-gray-700 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center p-4 border-b border-gray-700">
                            <h3 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                                <Settings2 /> {t("admin.editTest")}
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-red-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Вкладки */}
                        <div className="flex justify-center border-b border-gray-700">
                            <button
                                onClick={() => setActiveTab("edit")}
                                className={`px-4 py-2 ${
                                    activeTab === "edit"
                                        ? "text-green-400 border-b-2 border-green-400"
                                        : "text-gray-400"
                                }`}
                            >
                                ✏️ {t("common.edit")}
                            </button>
                            <button
                                onClick={() => setActiveTab("preview")}
                                className={`px-4 py-2 ${
                                    activeTab === "preview"
                                        ? "text-green-400 border-b-2 border-green-400"
                                        : "text-gray-400"
                                }`}
                            >
                                👁️ {t("common.preview") || "Попередній перегляд"}
                            </button>
                        </div>

                        {/* Контент вкладок */}
                        <div className="p-6 space-y-4">
                            {activeTab === "edit" && (
                                <>
                                    <input
                                        value={editingTest.title_ua || ""}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                title_ua: e.target.value,
                                            })
                                        }
                                        className="w-full bg-gray-800 p-2 rounded"
                                        placeholder="Назва тесту"
                                    />

                                    <textarea
                                        value={editingTest.description_ua || ""}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                description_ua: e.target.value,
                                            })
                                        }
                                        className="w-full bg-gray-800 p-2 rounded"
                                        placeholder="Опис тесту"
                                    />

                                    <input
                                        value={editingTest.image_url || ""}
                                        onChange={(e) =>
                                            setEditingTest({
                                                ...editingTest,
                                                image_url: e.target.value,
                                            })
                                        }
                                        className="w-full bg-gray-800 p-2 rounded"
                                        placeholder="URL зображення"
                                    />

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={(editingTest.price_cents || 0) / 100}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
                                                    price_cents: Math.round(
                                                        Number(e.target.value) * 100
                                                    ),
                                                })
                                            }
                                            className="flex-1 bg-gray-800 p-2 rounded"
                                        />
                                        <select
                                            value={editingTest.currency}
                                            onChange={(e) =>
                                                setEditingTest({
                                                    ...editingTest,
                                                    currency: e.target.value,
                                                })
                                            }
                                            className="bg-gray-800 text-white p-2 rounded"
                                        >
                                            <option value="usd">USD</option>
                                            <option value="eur">EUR</option>
                                            <option value="uah">UAH</option>
                                        </select>
                                    </div>

                                    {/* Питання */}
                                    {editingTest.questions?.map((q, qi) => (
                                        <div
                                            key={qi}
                                            className="bg-gray-800 p-4 rounded border border-gray-700"
                                        >
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-green-400 font-semibold">
                                                    Питання {qi + 1}
                                                </h4>
                                                <button
                                                    onClick={() => removeQuestion(qi)}
                                                    className="text-red-400 hover:text-red-600"
                                                >
                                                    <Trash size={16} />
                                                </button>
                                            </div>

                                            <input
                                                value={q.question_ua || ""}
                                                onChange={(e) =>
                                                    handleChangeQuestion(qi, "question_ua", e.target.value)
                                                }
                                                className="w-full bg-gray-700 p-2 rounded mb-2"
                                                placeholder="Питання (укр)"
                                            />

                                            {q.answers?.map((a, ai) => (
                                                <div
                                                    key={ai}
                                                    className={`flex items-center gap-2 mb-2 ${
                                                        a.is_correct
                                                            ? "bg-green-900/30"
                                                            : "bg-gray-700"
                                                    } p-2 rounded`}
                                                >
                                                    <input
                                                        value={a.answer_ua || ""}
                                                        onChange={(e) =>
                                                            handleChangeAnswer(
                                                                qi,
                                                                ai,
                                                                "answer_ua",
                                                                e.target.value
                                                            )
                                                        }
                                                        className="flex-1 bg-transparent outline-none"
                                                        placeholder="Варіант відповіді"
                                                    />
                                                    <input
                                                        type="checkbox"
                                                        checked={a.is_correct}
                                                        onChange={() => toggleCorrect(qi, ai)}
                                                    />
                                                    <button
                                                        onClick={() => removeAnswer(qi, ai)}
                                                        className="text-red-400 hover:text-red-600"
                                                    >
                                                        <Trash size={16} />
                                                    </button>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addAnswer(qi)}
                                                className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                                            >
                                                Додати варіант
                                            </button>
                                        </div>
                                    ))}

                                    <button
                                        onClick={addQuestion}
                                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                                    >
                                        <Plus size={16} /> Додати питання
                                    </button>
                                </>
                            )}

                            {activeTab === "preview" && (
                                <div>
                                    <h2 className="text-2xl font-bold text-green-400 mb-2">
                                        {editingTest.title_ua}
                                    </h2>
                                    <p className="text-gray-400 mb-4">
                                        {editingTest.description_ua}
                                    </p>
                                    {editingTest.image_url && (
                                        <img
                                            src={editingTest.image_url}
                                            className="rounded-lg mb-4"
                                            alt=""
                                        />
                                    )}
                                    {editingTest.questions?.map((q, i) => (
                                        <div key={i} className="mb-4">
                                            <h3 className="text-green-300 font-semibold">
                                                {i + 1}. {q.question_ua}
                                            </h3>
                                            <ul className="mt-2 space-y-1">
                                                {q.answers?.map((a, j) => (
                                                    <li
                                                        key={j}
                                                        className={`p-2 rounded ${
                                                            a.is_correct
                                                                ? "bg-green-800/40"
                                                                : "bg-gray-700/50"
                                                        }`}
                                                    >
                                                        {a.answer_ua}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Кнопка збереження */}
                        <div className="p-4 border-t border-gray-700 flex justify-end">
                            <button
                                onClick={handleSave}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                            >
                                <Save size={18} /> Зберегти зміни
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
