import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Save, Trash, Plus, Settings2, X, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

export default function AdminEditTestPage() {
    const { id } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    const [editingTest, setEditingTest] = useState(null);
    const [activeTab, setActiveTab] = useState("edit");
    const [toast, setToast] = useState(false);
    const [editLang, setEditLang] = useState("ua"); // "ua" або "en"
    const [usdToUah, setUsdToUah] = useState(42);

    // 📦 Завантажити тест
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/tests/${id}`);
                const data = await res.json();
                if (data.success) {
                    // конвертуємо центи в нормальну суму
                    setEditingTest({
                        ...data.test,
                        price_amount: (data.test.price_cents || 0) / 100,
                        currency: data.test.currency || "usd",
                        questions: data.test.questions || [],
                    });
                }
            } catch (err) {
                console.error("❌ error loading test:", err);
            }
        };
        load();
    }, [id]);

    // 💵 Отримати курс USD → UAH
    useEffect(() => {
        const loadRate = async () => {
            try {
                const res = await fetch("https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json");
                const data = await res.json();
                const rate = data?.[0]?.rate || 42;
                setUsdToUah(rate);
            } catch {
                setUsdToUah(42);
            }
        };
        loadRate();
    }, []);

    // 🔧 Хелпери
    const addQuestion = () => {
        setEditingTest({
            ...editingTest,
            questions: [
                ...(editingTest.questions || []),
                { question_ua: "", question_en: "", answers: [] },
            ],
        });
    };

    const addAnswer = (qi) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers.push({
            answer_ua: "",
            answer_en: "",
            is_correct: false,
        });
        setEditingTest(updated);
    };

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

    const toggleCorrect = (qi, ai) => {
        const updated = { ...editingTest };
        updated.questions[qi].answers[ai].is_correct =
            !updated.questions[qi].answers[ai].is_correct;
        setEditingTest(updated);
    };

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

    // 💾 Зберегти
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:5000/api/tests/${editingTest.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...editingTest,
                    price_amount: editingTest.price_amount,
                    currency: editingTest.currency,
                }),
            });
            const data = await res.json();
            if (data.success) {
                setToast(true);
                setTimeout(() => {
                    setToast(false);
                    navigate("/admin");
                }, 2000);
            }
        } catch (err) {
            console.error("❌ Error saving test:", err);
        }
    };

    if (!editingTest)
        return <div className="text-center text-gray-400 p-10">Loading...</div>;

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            {toast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
                    <CheckCircle className="inline mr-2" size={18} />
                    {t("admin.testUpdated") || "✅ Зміни успішно збережено!"}
                </div>
            )}

            <div className="max-w-5xl mx-auto bg-gray-900/70 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                        <Settings2 /> {t("admin.editTest")}
                    </h2>
                    <button
                        onClick={() => navigate("/admin")}
                        className="text-gray-400 hover:text-red-400 flex items-center gap-1"
                    >
                        <X size={18} /> {t("common.close") || "Закрити"}
                    </button>
                </div>

                {/* Вкладки */}
                <div className="flex border-b border-gray-700">
                    <button
                        onClick={() => setActiveTab("edit")}
                        className={`px-4 py-2 ${activeTab === "edit"
                            ? "text-green-400 border-b-2 border-green-400"
                            : "text-gray-400"
                        }`}
                    >
                        ✏️ {t("common.edit")}
                    </button>
                    <button
                        onClick={() => setActiveTab("preview")}
                        className={`px-4 py-2 ${activeTab === "preview"
                            ? "text-green-400 border-b-2 border-green-400"
                            : "text-gray-400"
                        }`}
                    >
                        👁️ {t("common.preview")}
                    </button>
                </div>

                {/* Контент */}
                <div className="space-y-4">
                    {activeTab === "edit" ? (
                        <>
                            {/* 🌐 Перемикач мови */}
                            <div className="relative w-40 mx-auto my-2">
                                <div className="flex bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                                    <div
                                        className={`absolute top-0 bottom-0 w-1/2 bg-green-600 rounded-full transition-all duration-200 ${editLang === "ua" ? "left-0" : "left-1/2"
                                        }`}
                                    ></div>
                                    <button
                                        onClick={() => setEditLang("ua")}
                                        className={`relative z-10 flex-1 py-2 text-center font-medium transition-colors duration-200 ${editLang === "ua" ? "text-white" : "text-gray-400"
                                        }`}
                                    >
                                        🇺🇦 UA
                                    </button>
                                    <button
                                        onClick={() => setEditLang("en")}
                                        className={`relative z-10 flex-1 py-2 text-center font-medium transition-colors duration-200 ${editLang === "en" ? "text-white" : "text-gray-400"
                                        }`}
                                    >
                                        🇬🇧 EN
                                    </button>
                                </div>
                            </div>

                            {/* Назва, опис */}
                            <motion.div
                                key={editLang}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25 }}
                                className="space-y-2"
                            >
                                <input
                                    value={
                                        editLang === "ua"
                                            ? editingTest.title_ua || ""
                                            : editingTest.title_en || editingTest.title_ua || ""
                                    }
                                    onChange={(e) =>
                                        setEditingTest({
                                            ...editingTest,
                                            [editLang === "ua" ? "title_ua" : "title_en"]: e.target.value,
                                        })
                                    }
                                    className="w-full bg-gray-800 p-2 rounded text-lg font-semibold focus:ring-2 focus:ring-green-500 outline-none"
                                    placeholder={editLang === "ua" ? "Назва тесту (укр)" : "Test title (eng)"}
                                />

                                <textarea
                                    value={
                                        editLang === "ua"
                                            ? editingTest.description_ua || ""
                                            : editingTest.description_en || editingTest.description_ua || ""
                                    }
                                    onChange={(e) =>
                                        setEditingTest({
                                            ...editingTest,
                                            [editLang === "ua" ? "description_ua" : "description_en"]: e.target.value,
                                        })
                                    }
                                    className="w-full bg-gray-800 p-2 rounded resize-none focus:ring-2 focus:ring-green-500 outline-none"
                                    rows={3}
                                    placeholder={editLang === "ua" ? "Опис тесту (укр)" : "Test description (eng)"}
                                />
                            </motion.div>

                            <input
                                value={editingTest.image_url || ""}
                                onChange={(e) =>
                                    setEditingTest({ ...editingTest, image_url: e.target.value })
                                }
                                className="w-full bg-gray-800 p-2 rounded"
                                placeholder="URL зображення"
                            />

                            {/* 💵 Ціна */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editingTest.price_amount || ""}
                                    onChange={(e) =>
                                        setEditingTest({
                                            ...editingTest,
                                            price_amount: parseFloat(e.target.value) || 0,
                                        })
                                    }
                                    className="flex-1 bg-gray-800 p-2 rounded"
                                />
                                <select
                                    value={editingTest.currency}
                                    onChange={(e) => {
                                        const newCurrency = e.target.value;
                                        let newPrice = editingTest.price_amount;

                                        if (editingTest.currency !== newCurrency) {
                                            if (newCurrency === "uah" && editingTest.currency === "usd") {
                                                newPrice = (editingTest.price_amount * usdToUah).toFixed(2);
                                            } else if (newCurrency === "usd" && editingTest.currency === "uah") {
                                                newPrice = (editingTest.price_amount / usdToUah).toFixed(2);
                                            }
                                        }

                                        setEditingTest({
                                            ...editingTest,
                                            currency: newCurrency,
                                            price_amount: parseFloat(newPrice),
                                        });
                                    }}
                                    className="bg-gray-800 text-white p-2 rounded"
                                >
                                    <option value="usd">USD</option>
                                    <option value="uah">UAH</option>
                                </select>
                            </div>

                            {/* 🧠 Питання */}
                            {editingTest.questions?.map((q, qi) => (
                                <div key={qi} className="bg-gray-800 p-4 rounded border border-gray-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-green-400 font-semibold">Питання {qi + 1}</h4>
                                        <button
                                            onClick={() => removeQuestion(qi)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash size={16} />
                                        </button>
                                    </div>

                                    <input
                                        value={editLang === "ua" ? q.question_ua || "" : q.question_en || ""}
                                        onChange={(e) =>
                                            handleChangeQuestion(
                                                qi,
                                                editLang === "ua" ? "question_ua" : "question_en",
                                                e.target.value
                                            )
                                        }
                                        className="w-full bg-gray-700 p-2 rounded mb-2"
                                        placeholder={editLang === "ua" ? "Питання (укр)" : "Question (eng)"}
                                    />

                                    {q.answers?.map((a, ai) => (
                                        <div
                                            key={ai}
                                            className={`flex items-center gap-2 mb-2 ${a.is_correct
                                                ? "bg-green-900/30"
                                                : "bg-gray-700"
                                            } p-2 rounded`}
                                        >
                                            <input
                                                value={editLang === "ua" ? a.answer_ua || "" : a.answer_en || ""}
                                                onChange={(e) =>
                                                    handleChangeAnswer(
                                                        qi,
                                                        ai,
                                                        editLang === "ua" ? "answer_ua" : "answer_en",
                                                        e.target.value
                                                    )
                                                }
                                                className="flex-1 bg-transparent outline-none"
                                                placeholder={editLang === "ua" ? "Варіант відповіді" : "Answer option"}
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
                                        {editLang === "ua" ? "Додати варіант" : "Add option"}
                                    </button>
                                </div>
                            ))}

                            <button
                                onClick={addQuestion}
                                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
                            >
                                <Plus size={16} />{" "}
                                {editLang === "ua" ? "Додати питання" : "Add question"}
                            </button>
                        </>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold text-green-400 mb-2">
                                {editLang === "ua" ? editingTest.title_ua : editingTest.title_en}
                            </h2>
                            <p className="text-gray-400 mb-4">
                                {editLang === "ua"
                                    ? editingTest.description_ua
                                    : editingTest.description_en}
                            </p>
                            {editingTest.image_url && (
                                <img src={editingTest.image_url} className="rounded-lg mb-4" alt="" />
                            )}
                            {editingTest.questions?.map((q, i) => (
                                <div key={i} className="mb-4">
                                    <h3 className="text-green-300 font-semibold">
                                        {i + 1}. {editLang === "ua" ? q.question_ua : q.question_en}
                                    </h3>
                                    <ul className="mt-2 space-y-1">
                                        {q.answers?.map((a, j) => (
                                            <li
                                                key={j}
                                                className={`p-2 rounded ${a.is_correct
                                                    ? "bg-green-800/40"
                                                    : "bg-gray-700/50"
                                                }`}
                                            >
                                                {editLang === "ua" ? a.answer_ua : a.answer_en}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex justify-end border-t border-gray-700 pt-4">
                    <button
                        onClick={handleSave}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Save size={18} />{" "}
                        {editLang === "ua" ? "Зберегти зміни" : "Save changes"}
                    </button>
                </div>
            </div>
        </section>
    );
}
