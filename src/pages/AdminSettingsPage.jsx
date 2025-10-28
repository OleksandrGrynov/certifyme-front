import { useState, useEffect } from "react";
import { Server, Bell, HardDriveDownload, Brain } from "lucide-react";

export default function AdminSettingsPage() {
    const [system, setSystem] = useState(null);
    const [insights, setInsights] = useState([]);
    const [notifications, setNotifications] = useState({
        newUser: true,
        newCert: true,
        newReview: false,
        errors: true,
    });

    // 🔹 Завантаження системних даних
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("⚠️ Токен відсутній у localStorage");
            return;
        }

        fetch("http://localhost:5000/api/settings/system", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error("Unauthorized");
                return r.json();
            })
            .then((data) => setSystem(data.info))
            .catch((err) => {
                console.error("❌ Error loading system info:", err);
                setSystem(null);
            });
    }, []);

    // 🔹 Завантаження AI-інсайтів
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.warn("⚠️ Токен відсутній у localStorage");
            return;
        }

        fetch("http://localhost:5000/api/settings/insights", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => {
                if (!r.ok) throw new Error("Unauthorized");
                return r.json();
            })
            .then((data) => setInsights(data.insights || []))
            .catch((err) => {
                console.error("❌ Error loading insights:", err);
                setInsights([]);
            });
    }, []);

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                ⚙️ Системне керування
            </h2>

            {/* 1️⃣ Системна інформація */}
            <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
                <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
                    <Server size={20} /> Стан системи
                </h3>

                {system ? (
                    <div className="grid sm:grid-cols-2 gap-3 text-gray-300">
                        <p>
                            🌐 API версія:{" "}
                            <span className="text-white">
                                {system.apiVersion || "—"}
                            </span>
                        </p>
                        <p>
                            🗄️ База даних:{" "}
                            <span className="text-white">
                                {system.dbStatus || "—"}
                            </span>
                        </p>
                        <p>
                            🚀 Uptime:{" "}
                            <span className="text-white">
                                {system.uptime || "—"}
                            </span>
                        </p>
                        <p>
                            📊 Активні запити:{" "}
                            <span className="text-white">
                                {system.activeQueries || 0}
                            </span>
                        </p>
                    </div>
                ) : (
                    <p className="text-gray-500">⏳ Дані системи завантажуються...</p>
                )}
            </section>

            {/* 2️⃣ Резервні копії */}
            <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
                <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
                    <HardDriveDownload size={20} /> Резервні копії
                </h3>
                <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg">
                    📦 Створити резервну копію
                </button>
                <ul className="mt-4 text-gray-400 space-y-2">
                    <li>
                        27.10.2025 — <span className="text-green-400">успішно</span>
                    </li>
                    <li>
                        25.10.2025 — <span className="text-green-400">успішно</span>
                    </li>
                    <li>
                        21.10.2025 — <span className="text-yellow-400">частково</span>
                    </li>
                </ul>
            </section>

            {/* 3️⃣ Повідомлення */}
            <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
                <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
                    <Bell size={20} /> Налаштування повідомлень
                </h3>
                <div className="flex flex-col gap-2 text-gray-300">
                    {Object.entries(notifications).map(([key, value]) => (
                        <label key={key} className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                checked={value}
                                onChange={() =>
                                    setNotifications((p) => ({ ...p, [key]: !p[key] }))
                                }
                                className="accent-green-500"
                            />
                            {translateKey(key)}
                        </label>
                    ))}
                </div>
            </section>

            {/* 4️⃣ AI інсайти */}
            <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
                <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
                    <Brain size={20} /> Інсайти системи
                </h3>
                {insights.length ? (
                    <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {insights.map((i, idx) => (
                            <li key={idx}>{i}</li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">🤖 Аналітика формується...</p>
                )}
            </section>
        </div>
    );
}

// 🔹 Переклад назв чекбоксів
function translateKey(key) {
    const map = {
        newUser: "Нові користувачі",
        newCert: "Отримані сертифікати",
        newReview: "Нові відгуки",
        errors: "Помилки системи",
    };
    return map[key] || key;
}
