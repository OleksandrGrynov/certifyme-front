import { useState, useEffect } from "react";
import {
    Trophy, FileCheck, BarChart3, Settings,
    User, Award, MessageCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatePresence } from "framer-motion";

// окремі сторінки
import AdminUsersPage from "./AdminUsersPage.jsx";
import AdminTestsPage from "./AdminTestsPage";
import AdminAchievementsPage from "./AdminAchievementsPage";
import AdminCertificatesPage from "./AdminCertificatesPage";
import AdminAnalyticsPage from "./AdminAnalyticsPage";
import AdminSettingsPage from "./AdminSettingsPage";
import AdminContactsPage from "./AdminContactsPage";

export default function AdminPage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("users");

    // збереження вибраної вкладки між перезавантаженнями
    useEffect(() => {
        const saved = localStorage.getItem("adminTab");
        if (saved) setActiveTab(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem("adminTab", activeTab);
    }, [activeTab]);

    const tabs = [
        { id: "contacts", label: t("admin.contacts"), icon: <MessageCircle size={18} /> },
        { id: "users", label: t("admin.users"), icon: <User size={18} /> },
        { id: "tests", label: t("admin.tests"), icon: <Award size={18} /> },
        { id: "achievements", label: t("admin.achievements"), icon: <Trophy size={18} /> },
        { id: "certificates", label: t("admin.certificates"), icon: <FileCheck size={18} /> },
        { id: "analytics", label: t("admin.analytics"), icon: <BarChart3 size={18} /> },
        { id: "settings", label: t("admin.settings"), icon: <Settings size={18} /> },
    ];

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-7xl mx-auto bg-gray-900/80 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-8">
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-3xl font-bold text-green-500">⚙️ {t("admin.title")}</h1>
                </div>

                {/* Вкладки */}
                <div className="flex flex-wrap gap-3 border-b border-gray-700 pb-3">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
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

                {/* Контент */}
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <div key={activeTab}>
                            {activeTab === "contacts" && <AdminContactsPage />}
                            {activeTab === "users" && <AdminUsersPage />}
                            {activeTab === "tests" && <AdminTestsPage />}
                            {activeTab === "achievements" && <AdminAchievementsPage />}
                            {activeTab === "certificates" && <AdminCertificatesPage />}
                            {activeTab === "analytics" && <AdminAnalyticsPage />}
                            {activeTab === "settings" && <AdminSettingsPage />}
                        </div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
