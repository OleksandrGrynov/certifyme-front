import { useState, useEffect } from "react";
import { Plus, Trash, Eye, Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom"; // 👈 додали для переходу

export default function AdminPage() {
    const { i18n } = useTranslation();
    const navigate = useNavigate(); // 👈 хук для переходу між сторінками
    const [users, setUsers] = useState([]);
    const [tests, setTests] = useState([]);
    const [editingTest, setEditingTest] = useState(null);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => setUsers(data.users || []));

        fetch("http://localhost:5000/api/tests")
            .then((r) => r.json())
            .then((data) => setTests(data.tests || []));
    }, []);

    // 🗑️ Видалити тест
    const handleDelete = async (id) => {
        if (!window.confirm("Видалити цей тест?")) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/tests/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setTests(tests.filter((t) => t.id !== id));
            alert("✅ Тест видалено");
        } else alert("❌ " + data.message);
    };

    // ✏️ Почати редагування
    const handleEdit = (test) => {
        setEditingTest(test);
        setShowForm(true);
    };

    // 💾 Зберегти зміни
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
            setTests(
                tests.map((t) => (t.id === editingTest.id ? data.test : t))
            );
            alert("✅ Тест оновлено!");
            setShowForm(false);
            setEditingTest(null);
        } else alert("❌ " + data.message);
    };

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <div className="max-w-6xl mx-auto bg-gray-900 p-6 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl font-bold text-green-500">Панель адміністратора</h1>

                    {/* 👇 Додана кнопка */}
                    <button
                        onClick={() => navigate("/admin/tests")}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus size={18} /> Створити тест
                    </button>
                </div>

                {/* 👥 Користувачі */}
                <h2 className="text-xl mb-2 text-green-400">Користувачі</h2>
                <table className="w-full border-collapse text-left mb-8">
                    <thead>
                    <tr className="bg-green-900/30 text-green-400">
                        <th className="p-3">ID</th>
                        <th className="p-3">Ім’я</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Роль</th>
                        <th className="p-3">Дата створення</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map((u) => (
                        <tr key={u.id} className="border-b border-gray-700 hover:bg-gray-800/50">
                            <td className="p-3">{u.id}</td>
                            <td className="p-3">{u.name}</td>
                            <td className="p-3">{u.email}</td>
                            <td className="p-3 text-green-400">{u.role}</td>
                            <td className="p-3">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* 📚 Тести */}
                <h2 className="text-xl mb-2 text-green-400">Тести</h2>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {tests.map((t) => (
                        <div key={t.id} className="bg-gray-800 p-4 rounded-lg">
                            {t.image_url && (
                                <img
                                    src={t.image_url}
                                    className="rounded mb-2 h-32 w-full object-cover"
                                    alt=""
                                />
                            )}
                            <h3 className="font-bold mb-1">{t.title_ua || t.title_en}</h3>
                            <p className="text-sm text-gray-400 mb-3">
                                {t.description_ua || t.description_en}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(t)}
                                    className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1 rounded flex items-center justify-center gap-1"
                                >
                                    <Edit3 size={16} /> Редагувати
                                </button>
                                <button
                                    onClick={() => handleDelete(t.id)}
                                    className="bg-red-600 hover:bg-red-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                                >
                                    <Trash size={16} /> Видалити
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ✏️ Модалка редагування */}
                {showForm && editingTest && (
                    <div className="mt-8 bg-gray-800 p-6 rounded-lg">
                        <h3 className="text-xl font-bold text-green-400 mb-4">Редагування тесту</h3>
                        <input
                            value={editingTest.title_ua || editingTest.title_en}
                            onChange={(e) => setEditingTest({ ...editingTest, title_ua: e.target.value })}
                            className="p-2 w-full bg-gray-700 rounded mb-2"
                            placeholder="Назва тесту"
                        />
                        <textarea
                            value={editingTest.description_ua || editingTest.description_en}
                            onChange={(e) =>
                                setEditingTest({ ...editingTest, description_ua: e.target.value })
                            }
                            className="p-2 w-full bg-gray-700 rounded mb-2"
                            placeholder="Опис тесту"
                        />
                        <input
                            value={editingTest.image_url || ""}
                            onChange={(e) =>
                                setEditingTest({ ...editingTest, image_url: e.target.value })
                            }
                            className="p-2 w-full bg-gray-700 rounded mb-4"
                            placeholder="URL зображення"
                        />
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setShowForm(false)}
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
            </div>
        </section>
    );
}
