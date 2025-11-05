import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Trash, Settings2, X, CheckCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/apiClient";
export default function AdminCreateTestPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [usdToUah, setUsdToUah] = useState(42);
  const [toast, setToast] = useState(false);
  const [editLang, setEditLang] = useState(i18n.language === "en" ? "en" : "ua");

  const [newTest, setNewTest] = useState({
    title_ua: "",
    title_en: "",
    description_ua: "",
    description_en: "",
    image_url: "",
    price_amount: 0,
    currency: "usd",
    questions: [],
  });

  // 📈 Завантажити курс USD→UAH один раз при завантаженні
  useEffect(() => {
    const loadRate = async () => {
      try {
        const res = await fetch(
          "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=USD&json"
        );
        const data = await res.json();
        const rate = data?.[0]?.rate || 42;
        setUsdToUah(rate);
      } catch {
        setUsdToUah(42);
      }
    };
    loadRate();
  }, []);

  // 🧩 Додати питання
  const addQuestion = () => {
    setNewTest({
      ...newTest,
      questions: [
        ...(newTest.questions || []),
        { question_ua: "", question_en: "", answers: [] },
      ],
    });
  };

  // 🧠 Додати відповідь
  const addAnswer = (qi) => {
    const updated = { ...newTest };
    updated.questions[qi].answers.push({
      answer_ua: "",
      answer_en: "",
      is_correct: false,
    });
    setNewTest(updated);
  };

  const handleChangeQuestion = (qi, field, value) => {
    const updated = { ...newTest };
    updated.questions[qi][field] = value;
    setNewTest(updated);
  };

  const handleChangeAnswer = (qi, ai, field, value) => {
    const updated = { ...newTest };
    updated.questions[qi].answers[ai][field] = value;
    setNewTest(updated);
  };

  const toggleCorrect = (qi, ai) => {
    const updated = { ...newTest };
    updated.questions[qi].answers[ai].is_correct =
      !updated.questions[qi].answers[ai].is_correct;
    setNewTest(updated);
  };

  const removeQuestion = (qi) => {
    const updated = { ...newTest };
    updated.questions = updated.questions.filter((_, i) => i !== qi);
    setNewTest(updated);
  };

  const removeAnswer = (qi, ai) => {
    const updated = { ...newTest };
    updated.questions[qi].answers = updated.questions[qi].answers.filter(
      (_, i) => i !== ai
    );
    setNewTest(updated);
  };

  // 💵 Зміна валюти (миттєво, як у EditTest)
  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    let newPrice = newTest.price_amount;

    if (newCurrency !== newTest.currency) {
      if (newCurrency === "uah" && newTest.currency === "usd") {
        newPrice = (newTest.price_amount * usdToUah).toFixed(2);
      } else if (newCurrency === "usd" && newTest.currency === "uah") {
        newPrice = (newTest.price_amount / usdToUah).toFixed(2);
      }
    }

    setNewTest({
      ...newTest,
      currency: newCurrency,
      price_amount: parseFloat(newPrice) || 0,
    });
  };

  // 💾 Зберегти тест
  const handleSave = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API_URL}/api/tests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newTest,
          price_cents: Math.round(newTest.price_amount * 100),
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
      console.error("❌ Error creating test:", err);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn">
          <CheckCircle className="inline mr-2" size={18} />
          {i18n.language === "en"
            ? "✅ Test successfully created!"
            : "✅ Тест успішно створено!"}
        </div>
      )}

      <div className="max-w-5xl mx-auto bg-gray-900/70 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-6">
        {/* 🔝 Заголовок */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
            <Settings2 />{" "}
            {i18n.language === "en" ? "Create Test" : "Створити тест"}
          </h2>
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 hover:text-red-400 flex items-center gap-1"
          >
            <X size={18} /> {i18n.language === "en" ? "Close" : "Закрити"}
          </button>
        </div>

        {/* 🌐 Перемикач мови */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-gray-800 rounded-full border border-gray-700 overflow-hidden">
            <button
              onClick={() => setEditLang("ua")}
              className={`px-4 py-2 ${
                editLang === "ua"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              🇺🇦 UA
            </button>
            <button
              onClick={() => setEditLang("en")}
              className={`px-4 py-2 ${
                editLang === "en"
                  ? "bg-green-600 text-white"
                  : "text-gray-400 hover:bg-gray-700"
              }`}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        {/* Назва / опис */}
        <input
          value={editLang === "ua" ? newTest.title_ua : newTest.title_en}
          onChange={(e) =>
            setNewTest({
              ...newTest,
              [editLang === "ua" ? "title_ua" : "title_en"]: e.target.value,
            })
          }
          className="w-full bg-gray-800 p-2 rounded"
          placeholder={
            editLang === "ua" ? "Назва тесту (укр)" : "Test title (eng)"
          }
        />

        <textarea
          value={
            editLang === "ua" ? newTest.description_ua : newTest.description_en
          }
          onChange={(e) =>
            setNewTest({
              ...newTest,
              [editLang === "ua"
                ? "description_ua"
                : "description_en"]: e.target.value,
            })
          }
          className="w-full bg-gray-800 p-2 rounded resize-none"
          rows={3}
          placeholder={
            editLang === "ua" ? "Опис тесту (укр)" : "Test description (eng)"
          }
        />

        <input
          value={newTest.image_url}
          onChange={(e) =>
            setNewTest({ ...newTest, image_url: e.target.value })
          }
          className="w-full bg-gray-800 p-2 rounded"
          placeholder={
            editLang === "ua" ? "URL зображення" : "Image URL"
          }
        />

        {/* 💵 Ціна з локальною конвертацією */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            value={newTest.price_amount}
            onChange={(e) =>
              setNewTest({
                ...newTest,
                price_amount: parseFloat(e.target.value) || 0,
              })
            }
            className="flex-1 bg-gray-800 p-2 rounded"
            placeholder={i18n.language === "en" ? "Price" : "Ціна"}
          />
          <select
            value={newTest.currency}
            onChange={handleCurrencyChange}
            className="bg-gray-800 text-white p-2 rounded"
          >
            <option value="usd">USD</option>
            <option value="uah">{i18n.language === "en" ? "UAH" : "грн"}</option>
          </select>
        </div>

        {/* 🧠 Питання */}
        {newTest.questions.map((q, qi) => (
          <div
            key={qi}
            className="bg-gray-800 p-4 rounded border border-gray-700"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-green-400 font-semibold">
                {i18n.language === "en"
                  ? `Question ${qi + 1}`
                  : `Питання ${qi + 1}`}
              </h4>
              <button
                onClick={() => removeQuestion(qi)}
                className="text-red-400 hover:text-red-600"
              >
                <Trash size={16} />
              </button>
            </div>

            <input
              value={editLang === "ua" ? q.question_ua : q.question_en}
              onChange={(e) =>
                handleChangeQuestion(
                  qi,
                  editLang === "ua" ? "question_ua" : "question_en",
                  e.target.value
                )
              }
              className="w-full bg-gray-700 p-2 rounded mb-2"
              placeholder={
                editLang === "ua" ? "Питання (укр)" : "Question (eng)"
              }
            />

            {q.answers.map((a, ai) => (
              <div
                key={ai}
                className={`flex items-center gap-2 mb-2 ${
                  a.is_correct ? "bg-green-900/30" : "bg-gray-700"
                } p-2 rounded`}
              >
                <input
                  value={editLang === "ua" ? a.answer_ua : a.answer_en}
                  onChange={(e) =>
                    handleChangeAnswer(
                      qi,
                      ai,
                      editLang === "ua" ? "answer_ua" : "answer_en",
                      e.target.value
                    )
                  }
                  className="flex-1 bg-transparent outline-none"
                  placeholder={
                    editLang === "ua"
                      ? "Варіант відповіді"
                      : "Answer option"
                  }
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
              {i18n.language === "en"
                ? "Add option"
                : "Додати варіант"}
            </button>
          </div>
        ))}

        <button
          onClick={addQuestion}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          <Plus size={16} />{" "}
          {i18n.language === "en"
            ? "Add question"
            : "Додати питання"}
        </button>

        {/* Зберегти */}
        <div className="flex justify-end border-t border-gray-700 pt-4">
          <button
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
          >
            <Save size={18} />{" "}
            {i18n.language === "en"
              ? "Save test"
              : "Зберегти тест"}
          </button>
        </div>
      </div>
    </section>
  );
}
