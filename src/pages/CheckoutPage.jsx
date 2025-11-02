import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/tests/${id}`);
        const data = await res.json();
        if (data.success && data.test) {
          setTest(data.test);
        } else {
          setError("Тест не знайдено");
        }
      } catch (err) {
        console.error("❌ Помилка завантаження тесту:", err);
        setError("Помилка під час завантаження");
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id]);

  const handlePayment = async () => {
    try {
      setPaying(true);
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Будь ласка, увійдіть у профіль перед оплатою");
        navigate("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId: id }),
      });
      const data = await res.json();

      if (data?.url) {
        localStorage.setItem("lastPaidTestId", id);
        window.location.href = data.url;
      } else {
        toast.error(data?.message || "Помилка створення сесії оплати");
      }
    } catch (err) {
      console.error(err);
      toast.error("Помилка мережі");
    } finally {
      setPaying(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-300">
        Завантаження тесту...
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-black text-gray-300">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => navigate("/tests")}
          className="mt-4 px-6 py-2 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 transition"
        >
          Назад до тестів
        </button>
      </div>
    );

  const getTitle = () => {
    if (!test) return "—";
    return (
      test.title ||
      test.title_ua ||
      test.title_en ||
      (i18n.language === "en" ? "Untitled test" : "Без назви")
    );
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-gray-900/80 rounded-2xl border border-gray-800 p-8 shadow-[0_0_25px_rgba(34,197,94,0.15)]"
      >
        <h1 className="text-2xl font-bold mb-3 text-center text-emerald-400">
          Підтвердження оплати
        </h1>

        <p className="text-center text-gray-300 mb-6">
          Ви обрали тест:{" "}
          <span className="font-semibold text-white block mt-1 text-lg">{getTitle()}</span>
        </p>

        <div className="flex items-center justify-between text-gray-400 mb-8">
          <span>Вартість:</span>
          <span className="text-lg text-white font-semibold">
            {new Intl.NumberFormat("uk-UA", {
              style: "currency",
              currency: (test.currency || "usd").toUpperCase() === "UAH" ? "UAH" : "USD",
            }).format(
              (test.currency || "usd").toUpperCase() === "UAH"
                ? test.price_uah || 0
                : (test.price_cents || 0) / 100,
            )}
          </span>
        </div>

        <button
          onClick={handlePayment}
          disabled={paying}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            paying
              ? "bg-gray-600 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-400 text-gray-900 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]"
          }`}
        >
          {paying ? "Створення сесії..." : "Перейти до оплати"}
        </button>

        <button
          onClick={() => navigate("/tests")}
          className="mt-4 w-full py-2 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 transition"
        >
          Назад
        </button>
      </motion.div>
    </section>
  );
}
