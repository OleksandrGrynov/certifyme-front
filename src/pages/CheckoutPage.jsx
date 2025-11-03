import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import tToast from "../lib/tToast";

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
        tToast.error("Будь ласка, увійдіть у профіль перед оплатою", "Please sign in before paying");
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
        tToast.error(data?.message || "Помилка створення сесії оплати", data?.message || "Failed to create checkout session");
      }
    } catch (err) {
      console.error(err);
      tToast.error("Помилка мережі", "Network error");
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
              currency: "UAH",
            }).format(test?.price_uah || 0)}
          </span>
        </div>

        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
        >
          {paying ? "Обробка..." : "Оплатити через Stripe"}
        </button>
      </motion.div>
    </section>
  );
}
