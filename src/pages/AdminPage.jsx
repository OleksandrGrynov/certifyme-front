import { useState, useEffect } from "react";
import {
    Plus,
    Trash,
    Edit3,
    Trophy,
    FileCheck,
    BarChart3,
    Settings,
    User,
    Award,
    MessageCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import AdminAchievementsPage from "./AdminAchievementsPage";
import AdminCertificatesPage from "./AdminCertificatesPage";
import AdminAnalyticsPage from "./AdminAnalyticsPage.jsx";
import AdminSettingsPage from "./AdminSettingsPage.jsx";
import AdminContactsPage from "./AdminContactsPage.jsx";


export default function AdminPage() {
    const { i18n } = useTranslation();
    const navigate = useNavigate();

    // Дані
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);
    const [editingTest, setEditingTest] = useState(null);
    const [showForm, setShowForm] = useState(false);

    // Активна вкладка
    const [activeTab, setActiveTab] = useState("users");

    useEffect(() => {
        const saved = localStorage.getItem("adminTab");
        if (saved) setActiveTab(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem("adminTab", activeTab);
    }, [activeTab]);

    useEffect(() => {
        const token = localStorage.getItem("token");

        // 👥 Отримати користувачів
        fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setUsers(data.users);
            })
            .catch((err) => console.error("Помилка отримання користувачів:", err));

        // 📚 Отримати тести
        fetch("http://localhost:5000/api/tests")
            .then((r) => r.json())
            .then((data) => setTests(data.tests || []))
            .catch((err) => console.error("Помилка отримання тестів:", err));
    }, []);

    // 🗑️ Видалити користувача
    const handleDeleteUser = async (id, email) => {
        if (!window.confirm(`Видалити користувача ${email}?`)) return;
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setUsers((prev) => prev.filter((u) => u.id !== id));
                alert("✅ Користувача видалено");
            } else {
                alert("❌ " + (data.message || "Помилка видалення"));
            }
        } catch (err) {
            console.error(err);
            alert("❌ Серверна помилка при видаленні");
        }
    };

    // 🗑️ Видалити тест
    const handleDeleteTest = async (id) => {
        if (!window.confirm("Видалити цей тест?")) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setTests((prev) => prev.filter((t) => t.id !== id));
            alert("✅ Тест видалено");
        } else alert("❌ " + data.message);
    };

    // ✏️ Почати редагування тесту
    const handleEdit = (test) => {
        setEditingTest(test);
        setShowForm(true);
    };

    // 💾 Зберегти зміни тесту
    const handleUpdate = async () => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/tests/${editingTest.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(editingTest),
        });
        const data = await res.json();
        if (data.success) {
            setTests((prev) =>
                prev.map((t) => (t.id === editingTest.id ? data.test : t))
            );
            alert("✅ Тест оновлено!");
            setShowForm(false);
            setEditingTest(null);
        } else alert("❌ " + data.message);
    };

    // 🧱 Вкладки
    const tabs = [
        { id: "contacts", label: "Заявки", icon: <MessageCircle size={18} /> },
        { id: "users", label: "Користувачі", icon: <User size={18} /> },
        { id: "tests", label: "Тести", icon: <Award size={18} /> },
        { id: "achievements", label: "Досягнення", icon: <Trophy size={18} /> },
        { id: "certificates", label: "Сертифікати", icon: <FileCheck size={18} /> },
        { id: "analytics", label: "Аналітика", icon: <BarChart3 size={18} /> },
        { id: "settings", label: "Налаштування", icon: <Settings size={18} /> },
    ];


    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-7xl mx-auto bg-gray-900/80 backdrop-blur-lg border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-8">
                {/* Заголовок */}
                <div className="flex flex-col sm:flex-row justify-between items-center">
                    <h1 className="text-3xl font-bold text-green-500">
                        ⚙️ Панель адміністратора
                    </h1>

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

                {/* Контент вкладки */}
                <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-6 min-h-[400px]">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === "contacts" &&
                                (<AdminContactsPage />)

                            }

                            {activeTab === "users" && (
                                <>
                                    <h2 className="text-xl mb-2 text-green-400">
                                        Користувачі
                                    </h2>
                                    <table className="w-full border-collapse text-left mb-8">
                                        <thead>
                                        <tr className="bg-green-900/30 text-green-400">
                                            <th className="p-3">ID</th>
                                            <th className="p-3">Ім’я</th>
                                            <th className="p-3">Email</th>
                                            <th className="p-3">Роль</th>
                                            <th className="p-3">Дата створення</th>
                                            <th className="p-3 text-center">Дія</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {users.map((u) => (
                                            <tr
                                                key={u.id}
                                                className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                                            >
                                                <td className="p-3">{u.id}</td>
                                                <td className="p-3">
                                                    {u.full_name ||
                                                        `${u.first_name || ""} ${
                                                            u.last_name || ""
                                                        }`}
                                                </td>
                                                <td className="p-3">{u.email}</td>
                                                <td className="p-3 text-green-400">
                                                    {u.role}
                                                </td>
                                                <td className="p-3">
                                                    {new Date(
                                                        u.created_at
                                                    ).toLocaleDateString("uk-UA")}
                                                </td>
                                                <td className="p-3 text-center">
                                                    {u.role !== "admin" ? (
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteUser(
                                                                    u.id,
                                                                    u.email
                                                                )
                                                            }
                                                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center justify-center gap-1 mx-auto"
                                                        >
                                                            <Trash size={16} /> Видалити
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-500 italic">
                                                                Адмін
                                                            </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </>
                            )}

                            {activeTab === "tests" && (
                                <>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-xl text-green-400">Тести</h2>
                                        <button
                                            onClick={() => navigate("/admin/tests")}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                                        >
                                            <Plus size={18} /> Створити тест
                                        </button>
                                    </div>

                                    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                                        {tests.map((t) => (
                                            <div
                                                key={t.id}
                                                className="bg-gray-800 p-4 rounded-lg"
                                            >
                                                {t.image_url && (
                                                    <img
                                                        src={t.image_url}
                                                        className="rounded mb-2 h-32 w-full object-cover"
                                                        alt="test preview"
                                                    />
                                                )}
                                                <h3 className="font-bold mb-1">
                                                    {t.title_ua || t.title_en}
                                                </h3>
                                                <p className="text-sm text-gray-400 mb-3">
                                                    {t.description_ua ||
                                                        t.description_en}
                                                </p>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEdit(t)}
                                                        className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1 rounded flex items-center justify-center gap-1"
                                                    >
                                                        <Edit3 size={16} /> Редагувати
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            handleDeleteTest(t.id)
                                                        }
                                                        className="bg-red-600 hover:bg-red-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                                                    >
                                                        <Trash size={16} /> Видалити
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            navigate(`/admin/tests/${t.id}`)
                                                        }
                                                        className="bg-blue-600 hover:bg-blue-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                                                    >
                                                        <Edit3 size={16} /> Питання
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* ✏️ Модалка редагування */}
                                    {showForm && editingTest && (
                                        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
                                            <h3 className="text-xl font-bold text-green-400 mb-4">
                                                Редагування тесту
                                            </h3>
                                            <input
                                                value={
                                                    editingTest.title_ua ||
                                                    editingTest.title_en
                                                }
                                                onChange={(e) =>
                                                    setEditingTest({
                                                        ...editingTest,
                                                        title_ua: e.target.value,
                                                    })
                                                }
                                                className="p-2 w-full bg-gray-700 rounded mb-2"
                                                placeholder="Назва тесту"
                                            />
                                            <textarea
                                                value={
                                                    editingTest.description_ua ||
                                                    editingTest.description_en
                                                }
                                                onChange={(e) =>
                                                    setEditingTest({
                                                        ...editingTest,
                                                        description_ua:
                                                        e.target.value,
                                                    })
                                                }
                                                className="p-2 w-full bg-gray-700 rounded mb-2"
                                                placeholder="Опис тесту"
                                            />
                                            <input
                                                value={editingTest.image_url || ""}
                                                onChange={(e) =>
                                                    setEditingTest({
                                                        ...editingTest,
                                                        image_url: e.target.value,
                                                    })
                                                }
                                                className="p-2 w-full bg-gray-700 rounded mb-4"
                                                placeholder="URL зображення"
                                            />
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() =>
                                                        setShowForm(false)
                                                    }
                                                    className="bg-gray-600 px-4 py-2 rounded"
                                                >
                                                    Скасувати
                                                </button>
                                                <button
                                                    onClick={handleUpdate}
                                                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                                                >
                                                    💾 Зберегти зміни
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === "achievements" && (
                                <AdminAchievementsPage />
                            )}

                            {activeTab === "certificates" && (
                                <AdminCertificatesPage />
                            )}

                            {activeTab === "analytics" && (
                                <AdminAnalyticsPage/>
                            )}
                            {activeTab === "settings" && (
                                <AdminSettingsPage/>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
