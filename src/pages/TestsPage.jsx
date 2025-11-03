import { useEffect, useMemo, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import tToast, { tLabel } from "../lib/tToast";

export default function TestsPage() {
  const { i18n } = useTranslation();
  const [tests, setTests] = useState([]);
  const [ownedIds, setOwnedIds] = useState(new Set());
  const [passedTests, setPassedTests] = useState([]); // ✅ новий стейт
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  // 🧩 Завантаження тестів і доступів користувача
  const loadTests = useCallback(async () => {
    try {
      setLoading(true);
      const testsRes = await fetch(`http://localhost:5000/api/tests?lang=${i18n.language}`);
      const testsJson = await testsRes.json();
      setTests(testsJson?.tests || []);

      const ownedRes = await fetch("http://localhost:5000/api/user/tests", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const ownedJson = ownedRes.ok ? await ownedRes.json() : { testIds: [] };
      const ids = (ownedJson.testIds || []).map(Number);
      setOwnedIds(new Set(ids));
    } catch (err) {
      console.error("❌ Fetch tests error:", err);
    } finally {
      setLoading(false);
    }
  }, [i18n.language, token]);

  // 🧾 Завантаження пройдених тестів користувача
  const loadPassedTests = useCallback(async () => {
    try {
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/tests/user/passed", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPassedTests(data.tests);
    } catch (err) {
      console.error("❌ loadPassedTests:", err);
    }
  }, [token]);

  /** ─────────────────────────────
   * 💰 Обробка після повернення зі Stripe (?paid=true)
   * ───────────────────────────── */
  useEffect(() => {
    const grantAccessAfterPayment = async () => {
      const params = new URLSearchParams(location.search);
      const isPaid = params.get("paid") === "true";
      const testId = params.get("testId");
      if (!isPaid || !testId) return;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        console.log("🎯 Grant access request:", { testId });

        const res = await fetch("http://localhost:5000/api/user/tests/grant", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ testId }),
        });

        const data = await res.json();
        if (data.success) {
          console.log("✅ Access granted");

          toast.dismiss();
          tToast.success(
            "✅ Оплата успішна! Доступ до тесту відкрито.",
            "✅ Payment successful! Access granted."
          );

          await loadTests();
          navigate("/tests", { replace: true });
        } else {
          console.warn("⚠️ Grant response:", data);
          tToast.error("⚠️ Не вдалося видати доступ", "⚠️ Failed to grant access");
        }
      } catch (err) {
        console.error("❌ grant error:", err);
        tToast.error("⚠️ Помилка grant запиту", "⚠️ Grant request error");
      }
    };

    grantAccessAfterPayment();
  }, [location.search, loadTests, navigate]);

  /** ─────────────────────────────
   * 📥 Початкове завантаження
   * ───────────────────────────── */
  useEffect(() => {
    loadTests();
    loadPassedTests();
  }, [loadTests, loadPassedTests]);

  /** ─────────────────────────────
   * 🔍 Фільтр тестів
   * ───────────────────────────── */
  const filtered = useMemo(() => {
    if (activeTab === "owned") return tests.filter((t) => ownedIds.has(t.id));
    if (activeTab === "notOwned") return tests.filter((t) => !ownedIds.has(t.id));
    if (activeTab === "passed") return passedTests;
    return tests;
  }, [tests, ownedIds, activeTab, passedTests]);

  /** ─────────────────────────────
   * 💲 Форматування валюти
   * ───────────────────────────── */
  const formatCurrency = (cents, currency = "usd") => {
    const amount = (cents || 0) / 100;
    const locale = i18n.language === "ua" ? "uk-UA" : "en-US";
    const curr = currency.toUpperCase();
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: curr,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /** ─────────────────────────────
   * 🛒 Покупка тесту
   * ───────────────────────────── */
  const handleBuy = async (testId) => {
    if (!token) {
      tToast.error("Спочатку увійдіть у профіль", "Please sign in first");
      return;
    }
    try {
      setBuyingId(testId);

      const res = await fetch("http://localhost:5000/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ testId }),
      });

      const data = await res.json();
      if (data?.url) {
        localStorage.setItem("lastPaidTestId", testId);
        window.location.href = data.url;
      } else {
        tToast.error(
          data?.message || "Помилка ініціалізації оплати",
          data?.message || "Payment initialization error"
        );
      }
    } catch (e) {
      console.error(e);
      tToast.error("Помилка мережі", "Network error");
    } finally {
      setBuyingId(null);
    }
  };

  /** ─────────────────────────────
   * 🖼️ Рендер сторінки
   * ───────────────────────────── */
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <h1 className="text-3xl font-bold text-center mb-8">Тести / Tests</h1>

      {/* 🔘 Перемикач вкладок */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
        {[
          { key: "all", ua: "Усі", en: "All" },
          { key: "owned", ua: "Придбані", en: "Owned" },
          { key: "notOwned", ua: "Ще не придбані", en: "Not purchased" },
          ...(passedTests.length > 0
            ? [{ key: "passed", ua: "Пройдені", en: "Passed" }]
            : []),
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-lg border transition ${
              activeTab === tab.key
                ? "bg-green-600 border-green-500"
                : "bg-gray-800 border-gray-700 hover:bg-gray-700"
            }`}
          >
            {tLabel(tab.ua, tab.en)}
          </button>
        ))}
      </div>

      {/* 📦 Список тестів */}
      {loading ? (
        <div className="max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl h-64"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
          {filtered.map((test) => {
            const owned = ownedIds.has(test.id);
            const isPassed = activeTab === "passed";
            const scorePercent = test.total
              ? Math.round((test.score / test.total) * 100)
              : 0;

            return (
              <motion.div
                key={test.id}
                className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-green-500/10 transition flex flex-col h-full"
                whileHover={{ scale: 1.03 }}
              >
                {test.image_url ? (
                  <img
                    src={test.image_url}
                    alt={test.title_ua || "test image"}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-800 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    📘
                  </div>
                )}

                <div className="flex items-start justify-between gap-3 mb-2">
                  <h2 className="text-xl font-semibold">
                    {test.title || test.title_ua || "Test"}
                  </h2>
                  <span
                    className={`text-xs px-2 py-1 rounded-md border ${
                      owned
                        ? "bg-green-900/40 text-green-300 border-green-700"
                        : isPassed
                          ? "bg-blue-900/40 text-blue-300 border-blue-700"
                          : "bg-gray-800 text-gray-300 border-gray-600"
                    }`}
                  >
                    {isPassed
                      ? tLabel("Пройдено", "Passed")
                      : owned
                        ? tLabel("Доступ є", "Owned")
                        : tLabel("Потрібна оплата", "Locked")}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {test.description || test.title_en}
                </p>

                {isPassed && (
                  <div className="text-sm text-gray-300 mb-3">
                    ✅ {tLabel("Результат:", "Score:")} {test.score}/{test.total} (
                    {scorePercent}%)
                    <br />
                    🕓{" "}
                    {new Date(test.created_at).toLocaleString(
                      i18n.language === "ua" ? "uk-UA" : "en-US"
                    )}
                  </div>
                )}

                {!owned && !isPassed && (
                  <div className="text-sm text-gray-300 mb-3">
                    {i18n.language === "ua"
                      ? formatCurrency(test.price_uah * 100, "UAH")
                      : formatCurrency(test.price_cents, "USD")}
                  </div>
                )}

                <div className="flex gap-3 mt-auto">
                  {isPassed ? (
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem("token");
                          if (!token) {
                            tToast.error("Спочатку увійдіть у профіль", "Please sign in first");
                            return;
                          }

                          // 🔹 Показуємо початковий лоадер
                          const loadingId = toast.loading("⏳ Перевіряємо сертифікат...");

                          // 1️⃣ Спочатку пробуємо знайти існуючий PDF
                          const checkRes = await fetch(
                            `http://localhost:5000/api/tests/certificate/check/${test.test_id || test.id}`,
                            { headers: { Authorization: `Bearer ${token}` } }
                          );

                          toast.dismiss(loadingId);

                          if (checkRes.ok) {
                            // ✅ Якщо існує — завантажуємо його
                            const blob = await checkRes.blob();
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = `Certificate_${test.title_ua || test.title_en}.pdf`;
                            link.click();
                            window.URL.revokeObjectURL(url);

                            tToast.success(
                              "🎓 Завантажено існуючий сертифікат!",
                              "🎓 Existing certificate downloaded!"
                            );
                            return;
                          }

                          // 2️⃣ Якщо не знайдено — генеруємо новий
                          const genId = toast.loading("🧾 Генеруємо новий сертифікат...");

                          const res = await fetch("http://localhost:5000/api/tests/certificate", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                              Authorization: `Bearer ${token}`,
                            },
                            body: JSON.stringify({
                              test_id: test.test_id || test.id,
                              test_title: test.title_ua || test.title_en,
                              score: test.score,
                              total: test.total,
                            }),
                          });

                          toast.dismiss(genId);

                          if (!res.ok) throw new Error("Certificate generation failed");

                          // ⬇️ Завантажуємо PDF
                          const blob = await res.blob();
                          const url = window.URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `Certificate_${test.title_ua || test.title_en}.pdf`;
                          link.click();
                          window.URL.revokeObjectURL(url);

                          tToast.success(
                            "🎓 Сертифікат успішно згенеровано!",
                            "🎓 Certificate generated!"
                          );
                        } catch (err) {
                          console.error("❌ Certificate error:", err);
                          toast.dismiss();
                          tToast.error(
                            "Не вдалося створити або завантажити сертифікат",
                            "Failed to generate or fetch certificate"
                          );
                        }
                      }}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black py-2 rounded-md text-sm font-semibold transition"
                    >
                      🎓 {tLabel("Сертифікат", "Certificate")}
                    </button>
                  ) : owned ? (

                    <>
                      <button
                        onClick={async () => {
                          try {
                            const res = await fetch(
                              `http://localhost:5000/api/user/tests/check/${test.id}`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              }
                            );
                            const data = await res.json();
                            if (data.hasAccess) {
                              window.location.href = `/tests/${test.id}`;
                            } else {
                              tToast.error(
                                "💳 Спочатку оплатіть тест!",
                                "💳 Please purchase the test first!"
                              );
                            }
                          } catch {
                            tToast.error("Помилка перевірки доступу", "Access check error");
                          }
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm font-semibold transition"
                      >
                        {tLabel("Пройти тест", "Take test")}
                      </button>

                      <Link to={`/tests/${test.id}/details`} className="flex-1">
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm transition">
                          {tLabel("Деталі", "Details")}
                        </button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleBuy(test.id)}
                        disabled={buyingId === test.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-2 rounded-md text-sm font-semibold transition"
                      >
                        {buyingId === test.id ? "..." : tLabel("Купити", "Buy")}
                      </button>
                      <Link to={`/tests/${test.id}/details`} className="flex-1">
                        <button className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-md text-sm transition">
                          {tLabel("Деталі", "Details")}
                        </button>
                      </Link>
                    </>
                  )}
                </div>

              </motion.div>
            );
          })}
        </div>
      )}
    </section>
  );
}
