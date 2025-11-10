import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import tToast from "../lib/tToast";
import { API_URL } from "../lib/apiClient";

export default function CheckoutPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState("");

  
  useEffect(() => {
    const loadTest = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tests/${id}`);
        const data = await res.json();
        if (data.success && data.test) setTest(data.test);
        else setError(i18n.language === "ua" ? "Тест не знайдено" : "Test not found");
      } catch (err) {
        console.error(" loadTest error:", err);
        setError(
          i18n.language === "ua"
            ? "Помилка під час завантаження тесту"
            : "Error loading test"
        );
      } finally {
        setLoading(false);
      }
    };
    loadTest();
  }, [id, i18n.language]);



  
  const handlePayment = async () => {
    try {
      setPaying(true);
      const token = localStorage.getItem("token");

      if (!token) {
        tToast.error(
          "Будь ласка, увійдіть у профіль перед оплатою",
          "Please sign in before paying"
        );
        navigate("/login");
        return;
      }

      
      if (!test.price_cents && !test.price_uah) {
        const res = await fetch(`${API_URL}/api/user/tests/grant`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ testId: id }),
        });

        const data = await res.json();
        if (data.success) {
          tToast.success(
            "Безкоштовний тест відкрито!",
            "Free test unlocked!"
          );
          navigate(`/tests/${id}`);
          return;
        } else {
          tToast.error("Не вдалося видати доступ", "Failed to grant access");
          return;
        }
      }

      
      const res = await fetch(`${API_URL}/api/payments/checkout`, {
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
        tToast.error(
          data?.message || "Помилка створення сесії оплати",
          data?.message || "Failed to create checkout session"
        );
      }
    } catch (err) {
      console.error(err);
      tToast.error("Помилка мережі", "Network error");
    } finally {
      setPaying(false);
    }
  };

  
  const getPrice = () => {
    if (test?.price_uah)
      return new Intl.NumberFormat("uk-UA", {
        style: "currency",
        currency: "UAH",
      }).format(test.price_uah);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format((test?.price_cents || 0) / 100);
  };

  
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-300">
        {i18n.language === "ua" ? "Завантаження тесту..." : "Loading test..."}
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
          {i18n.language === "ua" ? "Назад до тестів" : "Back to tests"}
        </button>
      </div>
    );

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full bg-gray-900/80 rounded-2xl border border-gray-800 p-8 shadow-[0_0_25px_rgba(34,197,94,0.15)]"
      >
        <h1 className="text-2xl font-bold mb-3 text-center text-emerald-400">
          {i18n.language === "ua"
            ? "Підтвердження оплати"
            : "Payment Confirmation"}
        </h1>

        <p className="text-center text-gray-300 mb-6">
          {i18n.language === "ua" ? "Ви обрали тест:" : "You selected test:"}{" "}
          <span className="font-semibold text-white block mt-1 text-lg">
            {test?.title_ua || test?.title_en || "Test"}
          </span>
        </p>

        <div className="flex items-center justify-between text-gray-400 mb-8">
          <span>{i18n.language === "ua" ? "Вартість:" : "Price:"}</span>
          <span className="text-lg text-white font-semibold">{getPrice()}</span>
        </div>

        <button
          onClick={handlePayment}
          disabled={paying}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
        >
          {paying
            ? i18n.language === "ua"
              ? "Обробка..."
              : "Processing..."
            : i18n.language === "ua"
              ? "Оплатити через Stripe"
              : "Pay via Stripe"}
        </button>
      </motion.div>
    </section>
  );
}
