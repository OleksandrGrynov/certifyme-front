import { useState, useEffect } from "react";
import {
    User,
    Award,
    Trophy,
    FileCheck,
    BarChart3,
    Settings,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// 👉 Вкладки (тимчасово порожні, але підготовлені)
function UsersTab() {
    return <div className="text-gray-300">📋 Тут буде список користувачів</div>;
}
function TestsTab() {
    return <div className="text-gray-300">🧩 Тут буде управління тестами</div>;
}
function AchievementsTab() {
    return <div className="text-gray-300">🏅 Тут буде редактор досягнень</div>;
}
function CertificatesTab() {
    return <div className="text-gray-300">📜 Тут буде список сертифікатів</div>;
}
function AnalyticsTab() {
    return <div className="text-gray-300">📊 Тут буде аналітика платформи</div>;
}
function SettingsTab() {
    return <div className="text-gray-300">⚙️ Тут будуть налаштування системи</div>;
}

// 👉 Основний компонент
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("users");

    // запам’ятовуємо останню вкладку
    useEffect(() => {
        const saved = localStorage.getItem("adminTab");
        if (saved) setActiveTab(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem("adminTab", activeTab);
    }, [activeTab]);

    const tabs = [
        { id: "users", label: "Користувачі", icon: <User size={18} /> },
        { id: "tests", label: "Тести", icon: <Award size={18} /> },
        { id: "achievements", label: "Досягнення", icon: <Trophy size={18} /> },
        { id: "certificates", label: "Сертифікати", icon: <FileCheck size={18} /> },
        { id: "analytics", label: "Аналітика", icon: <BarChart3 size={18} /> },
        { id: "settings", label: "Налаштування", icon: <Settings size={18} /> },
    ];

    const renderTab = () => {
        switch (activeTab) {
            case "users":
                return <UsersTab />;
            case "tests":
                return <TestsTab />;
            case "achievements":
                return <AchievementsTab />;
            case "certificates":
                return <CertificatesTab />;
            case "analytics":
                return <AnalyticsTab />;
            case "settings":
                return <SettingsTab />;
            default:
                return null;
        }
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-7xl mx-auto bg-gray-900/80 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-8">
                {/* Заголовок */}
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-3xl font-bold text-green-500">
                        ⚙️ Панель адміністратора
                    </h1>
                    <p className="text-gray-400 text-sm mt-2 sm:mt-0">
                        CertifyMe Admin Control Center
                    </p>
                </div>

                {/* Навігаційні вкладки */}
                <div className="flex flex-wrap gap-3 border-b border-gray-700 pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                                ${
                                activeTab === tab.id
                                    ? "bg-green-700/40 text-green-300 border border-green-500 shadow-lg"
                                    : "bg-gray-800 hover:bg-gray-700 text-gray-300 border border-transparent"
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Контент вибраної вкладки */}
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {renderTab()}
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Футер */}
                <footer className="text-center text-gray-500 text-sm pt-6 border-t border-gray-800">
                    CertifyMe © 2025 | Адмін панель
                </footer>
            </div>
        </section>
    );
}
