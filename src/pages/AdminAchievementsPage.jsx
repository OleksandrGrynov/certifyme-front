import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import tToast from "../lib/tToast";

export default function AdminAchievementsPage() {
    const [achievements, setAchievements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    // 🔹 Початкові поля форми
    const emptyForm = {
        title_ua: "",
        description_ua: "",
        image_url: "",
        category: "",
        icon: "",
        target_value: "",
        condition_type: "",
        condition_value: "",
        trigger_text: "", // 🧠 нове поле для GPT-умови
    };

    const [form, setForm] = useState(emptyForm);

    // 🔹 Confirm modal
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: lang === "ua" ? "Підтвердження" : "Confirm",
        message: "",
        confirmText: lang === "ua" ? "Видалити" : "Delete",
        cancelText: lang === "ua" ? "Скасувати" : "Cancel",
        resolve: null,
    });

    const confirmAsync = ({ title, message, confirmText, cancelText }) =>
      new Promise((resolve) =>
        setConfirmState({
            open: true,
            title: title || confirmState.title,
            message: message || "",
            confirmText: confirmText || confirmState.confirmText,
            cancelText: cancelText || confirmState.cancelText,
            resolve,
        })
      );

    const closeConfirm = (result) => {
        if (confirmState.resolve) confirmState.resolve(result);
        setConfirmState((s) => ({ ...s, open: false }));
    };

    // 🔹 Завантаження досягнень
    const loadAchievements = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `http://localhost:5000/api/achievements?lang=${lang}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) setAchievements(data.achievements || []);
            else console.error("⚠️ Failed to load achievements:", data.message);
        } catch (err) {
            console.error("❌ Error loading achievements:", err);
        }
    }, [lang]);

    useEffect(() => {
        loadAchievements();
    }, [loadAchievements]);

    // 🟢 Зберегти (створити або оновити)
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        const method = editing ? "PUT" : "POST";
        const url = editing
          ? `http://localhost:5000/api/admin/achievements/${editing.id}`
          : "http://localhost:5000/api/admin/achievements";


        try {
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
                      prev.map((a) =>
                        a.id === editing.id ? data.achievement : a
                      )
                    );
                } else {
                    setAchievements((prev) => [...prev, data.achievement]);
                }

                setShowForm(false);
                setEditing(null);
                setForm(emptyForm);
                tToast.success("✅ Збережено!", "✅ Saved!");
            } else {
                tToast.error(
                  "❌ " + (data.message || "Помилка збереження"),
                  "❌ " + (data.message || "Save error")
                );
            }
        } catch (err) {
            console.error("❌ Save error:", err);
            tToast.error("❌ Помилка з'єднання", "❌ Connection error");
        }
    };

    // 🟡 Почати редагування
    const handleEdit = (a) => {
        setEditing(a);
        setForm({
            title_ua: a.title_ua,
            description_ua: a.description_ua,
            image_url: a.image_url,
            category: a.category,
            icon: a.icon,
            target_value: a.target_value || "",
            condition_type: a.condition_type || "",
            condition_value: a.condition_value || "",
            trigger_text: a.trigger_text || "",
        });
        setShowForm(true);
    };

    // 🔴 Видалення
    const handleDelete = async (id) => {
        const ok = await confirmAsync({
            title:
              lang === "ua"
                ? "Видалення досягнення"
                : "Delete achievement",
            message:
              lang === "ua"
                ? "Видалити це досягнення?"
                : "Delete this achievement?",
            confirmText: lang === "ua" ? "Видалити" : "Delete",
            cancelText: lang === "ua" ? "Скасувати" : "Cancel",
        });
        if (!ok) return;

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `http://localhost:5000/api/admin/achievements/${id}`,
              {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (data.success) {
                setAchievements((prev) => prev.filter((a) => a.id !== id));
                tToast.success("✅ Видалено", "✅ Deleted");
            } else {
                tToast.error(
                  "❌ " + (data.message || "Помилка видалення"),
                  "❌ " + (data.message || "Delete error")
                );
            }
        } catch (err) {
            console.error("❌ Delete error:", err);
            tToast.error("❌ Помилка з'єднання", "❌ Connection error");
        }
    };

    return (
      <div>
          {/* 🔹 Заголовок і кнопка додавання */}
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl text-green-400 font-semibold">
                  🏅 {lang === "ua" ? "Досягнення" : "Achievements"}
              </h2>
              <button
                onClick={() => {
                    setShowForm(true);
                    setEditing(null);
                    setForm(emptyForm);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              >
                  <Plus size={18} /> {lang === "ua" ? "Додати" : "Add"}
              </button>
          </div>

          {/* 🔹 Список досягнень */}
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className="bg-gray-800 p-4 rounded-lg border border-gray-700"
                >
                    {a.image_url && (
                      <img
                        src={a.image_url}
                        alt="achievement"
                        className="w-full h-32 object-cover rounded mb-2"
                      />
                    )}
                    <h3 className="font-bold text-green-300">{a.title}</h3>
                    <p className="text-gray-400 text-sm mb-3">
                        {a.description}
                    </p>
                    <p className="text-xs text-gray-500 mb-1">
                        {lang === "ua" ? "Категорія" : "Category"}:{" "}
                        <span className="text-green-400">
                                {a.category}
                            </span>
                    </p>
                    {a.trigger_text && (
                      <p className="text-xs text-gray-500 mb-1">
                          {lang === "ua"
                            ? "Умова (GPT):"
                            : "Trigger (GPT):"}{" "}
                          <span className="text-green-400">
                                    {a.trigger_text}
                                </span>
                      </p>
                    )}
                    <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleEdit(a)}
                          className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1 rounded flex items-center justify-center gap-1"
                        >
                            <Edit3 size={16} />{" "}
                            {lang === "ua"
                              ? "Редагувати"
                              : "Edit"}
                        </button>
                        <button
                          onClick={() => handleDelete(a.id)}
                          className="bg-red-600 hover:bg-red-700 flex-1 py-1 rounded flex items-center justify-center gap-1"
                        >
                            <Trash size={16} />{" "}
                            {lang === "ua"
                              ? "Видалити"
                              : "Delete"}
                        </button>
                    </div>
                </div>
              ))}
          </div>

          {/* ✏️ Форма створення / редагування */}
          {showForm && (
            <div className="mt-8 bg-gray-800 p-6 rounded-lg border border-gray-700">
                <h3 className="text-xl font-bold text-green-400 mb-4">
                    {editing
                      ? lang === "ua"
                        ? "Редагування досягнення"
                        : "Edit achievement"
                      : lang === "ua"
                        ? "Нове досягнення"
                        : "New achievement"}
                </h3>

                {/* Назва + опис */}
                <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      value={form.title_ua}
                      onChange={(e) =>
                        setForm({ ...form, title_ua: e.target.value })
                      }
                      placeholder="Назва (укр)"
                      className="p-2 w-full bg-gray-700 rounded"
                    />
                    <textarea
                      value={form.description_ua}
                      onChange={(e) =>
                        setForm({
                            ...form,
                            description_ua: e.target.value,
                        })
                      }
                      placeholder="Опис (укр)"
                      className="p-2 w-full bg-gray-700 rounded h-24"
                    />
                </div>

                {/* Зображення + категорія + іконка */}
                <div className="grid sm:grid-cols-3 gap-2 mt-2">
                    <input
                      value={form.image_url}
                      onChange={(e) =>
                        setForm({
                            ...form,
                            image_url: e.target.value,
                        })
                      }
                      placeholder={
                          lang === "ua"
                            ? "URL зображення"
                            : "Image URL"
                      }
                      className="p-2 w-full bg-gray-700 rounded"
                    />
                    <input
                      value={form.category}
                      onChange={(e) =>
                        setForm({
                            ...form,
                            category: e.target.value,
                        })
                      }
                      placeholder={
                          lang === "ua"
                            ? "Категорія"
                            : "Category (personal/global/creative)"
                      }
                      className="p-2 w-full bg-gray-700 rounded"
                    />
                    <input
                      value={form.icon}
                      onChange={(e) =>
                        setForm({ ...form, icon: e.target.value })
                      }
                      placeholder={
                          lang === "ua"
                            ? "Іконка (emoji або svg)"
                            : "Icon (emoji or svg)"
                      }
                      className="p-2 w-full bg-gray-700 rounded"
                    />
                </div>

                {/* 🧠 Умова виконання (GPT створить код автоматично) */}
                <div className="mt-3">
                    <label className="block text-sm text-gray-400 mb-1">
                        {lang === "ua"
                          ? "Умова видачі (GPT створить код автоматично)"
                          : "Condition (GPT will generate code automatically)"}
                    </label>
                    <textarea
                      value={form.trigger_text}
                      onChange={(e) =>
                        setForm({ ...form, trigger_text: e.target.value })
                      }
                      placeholder={
                          lang === "ua"
                            ? "Наприклад: 'Якщо користувач пройшов 3 тести без помилок'"
                            : "Example: 'If user completes 3 tests without mistakes'"
                      }
                      className="p-2 w-full bg-gray-700 rounded h-24"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        {lang === "ua"
                          ? "GPT автоматично створить код перевірки цієї умови."
                          : "GPT will automatically generate a code snippet for this condition."}
                    </p>
                </div>

                {/* Кнопки */}
                <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => {
                          setShowForm(false);
                          setEditing(null);
                      }}
                      className="bg-gray-600 px-4 py-2 rounded"
                    >
                        {lang === "ua" ? "Скасувати" : "Cancel"}
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
                    >
                        💾 {lang === "ua" ? "Зберегти" : "Save"}
                    </button>
                </div>
            </div>
          )}

          <ConfirmModal
            open={confirmState.open}
            title={confirmState.title}
            message={confirmState.message}
            confirmText={confirmState.confirmText}
            cancelText={confirmState.cancelText}
            onCancel={() => closeConfirm(false)}
            onConfirm={() => closeConfirm(true)}
          />
      </div>
    );
}
