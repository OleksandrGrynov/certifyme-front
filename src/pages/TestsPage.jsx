import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";

export default function TestsPage() {
    const { i18n } = useTranslation();
    const [tests, setTests] = useState([]);
    const [ownedIds, setOwnedIds] = useState(new Set());
    const [activeTab, setActiveTab] = useState("all");
    const [loading, setLoading] = useState(true);
    const [buyingId, setBuyingId] = useState(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const location = useLocation();
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

    // ✅ показуємо повідомлення, якщо прийшли зі Stripe (paid=true)
    useEffect(() => {
        if (location.search.includes("paid=true")) {
            setShowSuccess(true);
            const timer = setTimeout(() => setShowSuccess(false), 4000);
            return () => clearTimeout(timer);
        }
    }, [location]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                const testsRes = await fetch("http://localhost:5000/api/tests");
                const testsJson = await testsRes.json();
                if (!cancelled) setTests(testsJson?.tests || []);

                const ownedRes = await fetch("http://localhost:5000/api/user/tests", {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const ownedJson = ownedRes.ok ? await ownedRes.json() : { testIds: [] };
                const ids = (ownedJson.testIds || ownedJson.ids || []).map(Number);
                if (!cancelled) setOwnedIds(new Set(ids));
            } catch (err) {
                console.error("❌ Fetch tests error:", err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => { cancelled = true; };
    }, [token]);

    const filtered = useMemo(() => {
        if (activeTab === "owned") return tests.filter(t => ownedIds.has(t.id));
        if (activeTab === "notOwned") return tests.filter(t => !ownedIds.has(t.id));
        return tests;
    }, [tests, ownedIds, activeTab]);

    const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

    const formatCurrency = (cents, currency = "usd") => {
        const amount = (cents || 0) / 100;
        try {
            return new Intl.NumberFormat(i18n.language === "ua" ? "uk-UA" : "en-US", {
                style: "currency",
                currency: (currency || "usd").toUpperCase(),
                maximumFractionDigits: 2,
            }).format(amount);
        } catch {
            return `${amount.toFixed(2)} ${(currency || "USD").toUpperCase()}`;
        }
    };

    const handleBuy = async (testId) => {
        if (!token) {
            alert(tLabel("Спочатку увійдіть у профіль", "Please sign in first"));
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
                window.location.href = data.url; // Stripe redirect
            } else {
                alert(data?.message || tLabel("Помилка ініціалізації оплати", "Payment init error"));
            }
        } catch (e) {
            console.error(e);
            alert(tLabel("Помилка мережі", "Network error"));
        } finally {
            setBuyingId(null);
        }
    };

    return (
        <section className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            {/* ✅ Анімаційне повідомлення про оплату */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50 font-semibold"
                    >
                        {tLabel("✅ Оплата успішна! Доступ до тесту відкрито.", "✅ Payment successful! Access granted.")}
                    </motion.div>
                )}
            </AnimatePresence>

            <h1 className="text-3xl font-bold text-center mb-8">Тести / Tests</h1>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto mb-6 flex flex-wrap gap-2">
                {[
                    { key: "all", ua: "Усі", en: "All" },
                    { key: "owned", ua: "Придбані", en: "Owned" },
                    { key: "notOwned", ua: "Ще не придбані", en: "Not purchased" },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-lg border transition ${activeTab === tab.key
                            ? "bg-green-600 border-green-500"
                            : "bg-gray-800 border-gray-700 hover:bg-gray-700"
                        }`}
                    >
                        {tLabel(tab.ua, tab.en)}
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="max-w-7xl mx-auto grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="animate-pulse bg-gray-900 border border-gray-800 rounded-xl h-64" />
                    ))}
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                    {filtered.map((test) => {
                        const owned = ownedIds.has(test.id);
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
                                        {i18n.language === "ua" ? test.title_ua : test.title_en}
                                    </h2>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-md border ${owned
                                            ? "bg-green-900/40 text-green-300 border-green-700"
                                            : "bg-gray-800 text-gray-300 border-gray-600"
                                        }`}
                                    >
                                        {owned ? tLabel("Доступ є", "Owned") : tLabel("Потрібна оплата", "Locked")}
                                    </span>
                                </div>

                                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                                    {i18n.language === "ua" ? test.description_ua : test.description_en}
                                </p>

                                {!owned && (
                                    <div className="text-sm text-gray-300 mb-3">
                                        {formatCurrency(test.price_cents, test.currency)}
                                    </div>
                                )}

                                <div className="flex gap-3 mt-auto">
                                    {owned ? (
                                        <>
                                            <Link to={`/tests/${test.id}`} className="flex-1">
                                                <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-md text-sm font-semibold transition">
                                                    {tLabel("Пройти тест", "Take test")}
                                                </button>
                                            </Link>
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
