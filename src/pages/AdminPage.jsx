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
import { AnimatePresence } from "framer-motion";
import AdminAchievementsPage from "./AdminAchievementsPage";
import AdminCertificatesPage from "./AdminCertificatesPage";
import AdminAnalyticsPage from "./AdminAnalyticsPage.jsx";
import AdminSettingsPage from "./AdminSettingsPage.jsx";
import AdminContactsPage from "./AdminContactsPage.jsx";


export default function AdminPage() {
    useTranslation();
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
            .catch((err) => console.error("Помилка отримання користу��ачів:", err));

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
        if (!token) return alert("❌ Потрібно увійти як адміністратор");

        const base = `http://localhost:5000/api/admin/users/${id}`;

        // Try server-side cascade delete first (preferred)
        try {
            const res = await fetch(`${base}?cascade=true`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            // If server supports cascade and succeeded
            if (res.ok) {
                const data = await res.json().catch(() => ({}));
                if (data.success || res.status === 204) {
                    setUsers((prev) => prev.filter((u) => u.id !== id));
                    return alert("✅ Користувача та всі пов'язані ресурси видалено");
                }
            }

            // If server returned 401/403 -> show auth message
            if (res.status === 401 || res.status === 403) {
                return alert("❌ Ви не а��торизовані або не маєте прав адміністратора");
            }

            // If server indicates cascade not supported or returned an error, fallback to client-driven deletion
            // (attempt to remove related resources explicitly, then delete user)
            // Note: backend should provide the following endpoints for this fallback to work:
            // DELETE /api/admin/users/:id/certificates
            // DELETE /api/admin/users/:id/achievements
            // DELETE /api/admin/users/:id/attempts
            // These endpoints must be protected (admin-only) and idempotent.
            const fallbackSteps = [
                { url: `${base}/certificates`, label: "сертифікати" },
                { url: `${base}/achievements`, label: "досягнення" },
                { url: `${base}/attempts`, label: "спроби тестів" },
            ];

            for (const step of fallbackSteps) {
                try {
                    const r = await fetch(step.url, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    // ignore non-2xx but log
                    if (!r.ok) console.warn(`Failed to delete ${step.label}:`, r.status);
                } catch (e) {
                    console.warn("Network error during fallback delete:", e);
                }
            }

            // Finally attempt to delete the user itself
            try {
                const r2 = await fetch(base, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                });
                const d2 = await r2.json().catch(() => ({}));
                if (r2.ok && (d2.success || r2.status === 204)) {
                    setUsers((prev) => prev.filter((u) => u.id !== id));
                    return alert("✅ Користувача та (повторно) пов'язані ресурси видалено (фолбека)");
                } else {
                    console.error("Final delete failed:", r2.status, d2);
                    return alert("❌ Не вдалося видалити користувача. Подивіться логи сервера.");
                }
            } catch (e) {
                console.error("Final delete network error:", e);
                return alert("❌ Помилка мережі при видаленні користувача");
            }
        } catch (err) {
            console.error("Delete user error:", err);
            alert("❌ Помилка при видаленні користувача");
        }
    };

    // 🛠️ Змінити роль користувача (user <-> admin)
    const handleChangeRole = async (id, newRole) => {
        const name = users.find((u) => u.id === id)?.email || id;
        if (!window.confirm(`Змінити роль користувача ${name} на "${newRole}"?`)) return;
        const token = localStorage.getItem("token");
        if (!token) return alert("❌ Потрібно увійти як адміністратор");

        try {
            // Використовуємо PUT на той же endpoint; бекенд має приймати оновлення ролі
            const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ role: newRole }),
            });

            const data = await res.json().catch(() => ({}));
            if (res.ok && (data.success || data.user)) {
                // Оновлюємо локальний стан
                setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
                alert("✅ Роль оновлено");
            } else {
                console.error("Role update failed:", res.status, data);
                alert("❌ Не вдалося оновити роль: " + (data.message || res.status));
            }
        } catch (err) {
            console.error("Network error updating role:", err);
            alert("❌ Помилка мережі при оновленні ролі");
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
                        <div
                            key={activeTab}
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
                                                <td className="p-3">
                                                    <select
                                                        value={u.role}
                                                        onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                        className="bg-gray-800 text-green-400 p-1 rounded"
                                                    >
                                                        <option value="user">user</option>
                                                        <option value="admin">admin</option>
                                                    </select>
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
                                                        <Edit3 size={16} /> Ре��агувати
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
                        </div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
