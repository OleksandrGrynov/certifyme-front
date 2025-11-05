import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { API_URL } from "../lib/apiClient";

export default function TestResultDetails() {
  const { id } = useParams();
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ua";

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          toast.error(
            lang === "ua" ? "Спочатку увійди в акаунт" : "Please log in first"
          );
          return;
        }

        const res = await fetch(
          `${API_URL}/api/tests/result/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = await res.json();
        if (data.success) {
          setResult(data.result);
        } else {
          toast.error(
            lang === "ua" ? "Результат не знайдено" : "Result not found"
          );
        }
      } catch (err) {
        console.error("❌ Fetch result error:", err);
        toast.error(lang === "ua" ? "Помилка сервера" : "Server error");
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [id, lang]);

  if (loading)
    return (
      <div className="text-center text-gray-400 mt-10">
        {lang === "ua" ? "Завантаження..." : "Loading..."}
      </div>
    );

  if (!result)
    return (
      <div className="text-center text-gray-400 mt-10">
        ❌ {lang === "ua" ? "Результат не знайдено" : "Result not found"}
        <div className="mt-4">
          <Link to="/tests" className="text-green-400 underline">
            {lang === "ua" ? "Назад до тестів" : "Back to tests"}
          </Link>
        </div>
      </div>
    );

  const percent = Math.round((result.score / result.total) * 100);

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-3xl mx-auto bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-800"
      >
        <h1 className="text-3xl font-bold text-center text-green-400 mb-4">
          {result.title_ua || result.title_en}
        </h1>

        <p className="text-center text-gray-400 mb-2">
          {lang === "ua" ? "Дата проходження:" : "Attempt date:"}{" "}
          <span className="text-white font-medium">
            {new Date(result.created_at).toLocaleString(
              lang === "ua" ? "uk-UA" : "en-US"
            )}
          </span>
        </p>

        <div className="bg-gray-800 rounded-xl p-5 text-center mb-6">
          <p
            className={`text-2xl font-bold mb-2 ${
              percent >= 60 ? "text-green-400" : "text-red-400"
            }`}
          >
            {percent}% ({result.score}/{result.total})
          </p>
          <p className="text-gray-400">
            {lang === "ua" ? "Твій результат" : "Your result"}
          </p>
          <p className="mt-2 text-sm text-gray-500">
            {result.passed
              ? lang === "ua"
                ? "✅ Тест успішно пройдено!"
                : "✅ Test passed!"
              : lang === "ua"
                ? "❌ Тест не пройдено"
                : "❌ Test failed"}
          </p>
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <Link
            to={`/tests/${id}`}
            className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-semibold text-white"
          >
            {lang === "ua" ? "Повторити" : "Retry"}
          </Link>



          <Link
            to="/tests"
            className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-semibold text-white"
          >
            {lang === "ua" ? "Назад" : "Back"}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
