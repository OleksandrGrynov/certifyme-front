import { useState, useEffect } from "react";
import { Plus, Edit3, Trash } from "lucide-react";

export default function AdminAchievementsPage() {
    const [achievements, setAchievements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({
        title_ua: "",
        title_en: "",
        description_ua: "",
        description_en: "",
        image_url: "",
    });

    // 🔹 Завантаження всіх досягнень
    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/achievements", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => setAchievements(data.achievements || []))
            .catch((err) => console.error("❌ Error loading achievements:", err));
    }, []);

    // 🟢 Зберегти (створити або оновити)
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        const method = editing ? "PUT" : "POST";
        const url = editing
            ? `http://localhost:5000/api/achievements/${editing.id}`
            : "http://localhost:5000/api/achievements";

        const res = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(form),
        });

        const data = await res.json();
        if (data.success) {
            if (editing) {
                setAchievements((prev) =>
                    prev.map((a) => (a.id === editing.id ? data.achievement : a))
                );
            } else {
                setAchievements((prev) => [...prev, data.achievement]);
            }
            setShowForm(false);
            setEditing(null);
            setForm({
                title_ua: "",
                title_en: "",
                description_ua: "",
                description_en: "",
                image_url: "",
            });
            alert("✅ Збережено!");
        } else alert("❌ " + data.message);
    };

    // 🟡 Почати редагування
    const handleEdit = (a) => {
        setEditing(a);
        setForm(a);
        setShowForm(true);
    };

    // 🔴 Видалення
    const handleDelete = async (id) => {
        if (!window.confirm("Видалити це досягнення?")) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/achievements/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setAchievements((prev) => prev.filter((a) => a.id !== id));
        } else alert("❌ " + data.message);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl text-green-400 font-semibold">🏅 Досягнення</h2>
                <button
                    onClick={() => {
                        setShowForm(true);
                        setEditing(null);
                        setForm({
                            title_ua: "",
                            title_en: "",
                            description_ua: "",
                            description_en: "",
                            image_url: "",
                        });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus size={18} /> Додати
                </button>
            </div>

            {/* 🧩 Список */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {achievements.map((a) => (
                    <div key={a.id} className="bg-gray-800 p-4 rounded-lg">
                        {a.image_url && (
                            <img
                                src={a.image_url}
                                alt="achievement"
                                className="w-full h-32 object-cover rounded mb-2"
                            />
                        )}
                        <h3 className="font-bold text-green-300">
                            {a.title_ua || a.title_en}
                        </h3>
                        <p className="text-gray-400 text-sm mb-3">
                            {a.description_ua || a.description_en}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(a)}
                                className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1 rounded flex items-center justify-center gap-1"
                            >
                                <Edit3 size={16} /> Редагувати
                            </button>
                            <button
                                onClick={() => handleDelete(a.id)}
                                className="bg-red-600 hover:bg-red-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                            >
                                <Trash size={16} /> Видалити
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* ✏️ Модалка */}
            {showForm && (
                <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
                    <h3 className="text-xl font-bold text-green-400 mb-4">
                        {editing ? "Редагування досягнення" : "Нове досягнення"}
                    </h3>
                    <input
                        value={form.title_ua}
                        onChange={(e) => setForm({ ...form, title_ua: e.target.value })}
                        placeholder="Назва (укр)"
                        className="p-2 w-full bg-gray-700 rounded mb-2"
                    />
                    <input
                        value={form.title_en}
                        onChange={(e) => setForm({ ...form, title_en: e.target.value })}
                        placeholder="Title (eng)"
                        className="p-2 w-full bg-gray-700 rounded mb-2"
                    />
                    <textarea
                        value={form.description_ua}
                        onChange={(e) =>
                            setForm({ ...form, description_ua: e.target.value })
                        }
                        placeholder="Опис (укр)"
                        className="p-2 w-full bg-gray-700 rounded mb-2"
                    />
                    <textarea
                        value={form.description_en}
                        onChange={(e) =>
                            setForm({ ...form, description_en: e.target.value })
                        }
                        placeholder="Description (eng)"
                        className="p-2 w-full bg-gray-700 rounded mb-2"
                    />
                    <input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="URL зображення"
                        className="p-2 w-full bg-gray-700 rounded mb-4"
                    />
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setEditing(null);
                            }}
                            className="bg-gray-600 px-4 py-2 rounded"
                        >
                            Скасувати
                        </button>
                        <button
                            onClick={handleSave}
                            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                        >
                            💾 Зберегти
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
