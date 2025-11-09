import { useState, useEffect, useCallback } from "react";
import { Plus, Edit3, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";
import tToast from "../lib/tToast";
import { API_URL } from "../lib/apiClient";

export default function AdminAchievementsPage() {
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    const [achievements, setAchievements] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);

    const emptyForm = {
        title_ua: "",
        description_ua: "",
        image_url: "",
        category: "",
        icon: "",
        condition_type: "",
        condition_value: "",
    };

    const [form, setForm] = useState(emptyForm);

    const [confirmState, setConfirmState] = useState({
        open: false,
        title: lang === "ua" ? "Підтвердження" : "Confirm",
        message: "",
        confirmText: lang === "ua" ? "Видалити" : "Delete",
        cancelText: lang === "ua" ? "Скасувати" : "Cancel",
        resolve: null,
    });

    const confirmAsync = (opts) =>
      new Promise((resolve) =>
        setConfirmState({ ...confirmState, ...opts, open: true, resolve })
      );

    const closeConfirm = (result) => {
        if (confirmState.resolve) confirmState.resolve(result);
        setConfirmState((s) => ({ ...s, open: false }));
    };

    
    const loadAchievements = useCallback(async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `${API_URL}/api/admin/achievements`,
              { headers: { Authorization: `Bearer ${token}` } }
            );

            const data = await res.json();
            if (data.success) setAchievements(data.achievements || []);
        } catch (err) {
            console.error("❌ Error loading achievements:", err);
        }
    }, [lang]);

    useEffect(() => {
        loadAchievements();
    }, [loadAchievements]);

    
    const handleSave = async () => {
        const token = localStorage.getItem("token");
        const method = editing ? "PUT" : "POST";
        const url = editing
          ? `${API_URL}/api/admin/achievements/${editing.id}`
          : `${API_URL}/api/admin/achievements`;

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
                await loadAchievements(); 
                setShowForm(false);
                setEditing(null);
                setForm(emptyForm);
                tToast.success("✅ Збережено!", "✅ Saved!");
            } else {
                tToast.error(
                  "❌ " + (data.message || "Помилка збереження"),
                  "❌ Save error"
                );
            }
        } catch (err) {
            console.error("❌ Save error:", err);
            tToast.error("❌ Помилка з'єднання", "❌ Connection error");
        }
    };

    const handleEdit = (a) => {
        setEditing(a);
        setForm({
            title_ua: a.titleUa || "",
            description_ua: a.descriptionUa || "",
            image_url: a.imageUrl || "",
            category: a.category || "",
            icon: a.icon || "",
            condition_type: a.conditionType || "",
            condition_value: a.conditionValue || "",
        });
        setShowForm(true);
    };

    
    const handleDelete = async (id) => {
        const ok = await confirmAsync({
            title: lang === "ua" ? "Видалення досягнення" : "Delete achievement",
            message:
              lang === "ua"
                ? "Видалити це досягнення?"
                : "Delete this achievement?",
        });
        if (!ok) return;

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `${API_URL}/api/admin/achievements/${id}`,
              {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (data.success) {
                await loadAchievements();
                tToast.success("✅ Видалено", "✅ Deleted");
            }
        } catch (err) {
            console.error("❌ Delete error:", err);
            tToast.error("❌ Помилка з'єднання", "❌ Connection error");
        }
    };

    
    return (
      <div className="p-6 text-gray-100">
          {}
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-green-400 flex items-center gap-2">
                  🏆 {lang === "ua" ? "Досягнення" : "Achievements"}
              </h2>
              <button
                onClick={() => {
                    setShowForm(true);
                    setEditing(null);
                    setForm(emptyForm);
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
              >
                  <Plus size={18} /> {lang === "ua" ? "Додати" : "Add"}
              </button>
          </div>

          {}
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => {
                  const title = lang === "ua" ? a.titleUa : a.titleEn;
                  const description =
                    lang === "ua" ? a.descriptionUa : a.descriptionEn;

                  return (
                    <div
                      key={a.id}
                      className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg hover:shadow-green-600/10 transition flex flex-col"
                    >
                        {a.imageUrl && (
                          <img
                            src={a.imageUrl}
                            alt={title}
                            className="w-full h-36 object-cover rounded-lg mb-3"
                          />
                        )}

                        <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-green-300 text-lg">
                                {title || "—"}
                            </h3>
                            {a.icon && <span className="text-2xl opacity-80">{a.icon}</span>}
                        </div>

                        <p className="text-sm text-gray-400 mt-1 mb-3">{description || "—"}</p>

                        <div className="text-xs space-y-1 mb-4">
                            {a.category && (
                              <p>
        <span className="text-gray-400">
          {lang === "ua" ? "Категорія:" : "Category:"}{" "}
        </span>
                                  <span className="text-green-400">{a.category}</span>
                              </p>
                            )}
                            {a.conditionType && (
                              <p>
        <span className="text-gray-400">
          {lang === "ua" ? "Тип умови:" : "Condition type:"}{" "}
        </span>
                                  <span className="text-green-400">{a.conditionType}</span>
                              </p>
                            )}
                            {a.conditionValue && (
                              <p>
        <span className="text-gray-400">
          {lang === "ua" ? "Значення:" : "Value:"}{" "}
        </span>
                                  <span className="text-green-400">{a.conditionValue}</span>
                              </p>
                            )}
                        </div>

                        {}
                        <div className="flex gap-2 mt-auto pt-4 border-t border-gray-700">
                            <button
                              onClick={() => handleEdit(a)}
                              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-1.5 rounded flex items-center justify-center gap-1 transition"
                            >
                                <Edit3 size={16} />
                                {lang === "ua" ? "Редагувати" : "Edit"}
                            </button>
                            <button
                              onClick={() => handleDelete(a.id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded flex items-center justify-center gap-1 transition"
                            >
                                <Trash2 size={16} />
                                {lang === "ua" ? "Видалити" : "Delete"}
                            </button>
                        </div>
                    </div>

                  );
              })}
          </div>

          {}
          {showForm && (
            <div className="mt-10 bg-gray-900 p-6 rounded-xl border border-gray-700 shadow-lg max-w-3xl mx-auto">
                <h3 className="text-2xl font-bold text-green-400 mb-5">
                    {editing
                      ? lang === "ua"
                        ? "Редагування досягнення"
                        : "Edit Achievement"
                      : lang === "ua"
                        ? "Нове досягнення"
                        : "New Achievement"}
                </h3>

                <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      value={form.title_ua}
                      onChange={(e) => setForm({ ...form, title_ua: e.target.value })}
                      placeholder="Назва (укр)"
                      className="p-3 bg-gray-800 rounded-lg w-full"
                    />
                    <textarea
                      value={form.description_ua}
                      onChange={(e) =>
                        setForm({ ...form, description_ua: e.target.value })
                      }
                      placeholder="Опис (укр)"
                      className="p-3 bg-gray-800 rounded-lg w-full h-24 resize-none"
                    />
                </div>

                <div className="grid sm:grid-cols-3 gap-4 mt-4">
                    <input
                      value={form.image_url}
                      onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                      placeholder="URL зображення"
                      className="p-3 bg-gray-800 rounded-lg"
                    />
                    <input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      placeholder="Категорія (personal/global/creative)"
                      className="p-3 bg-gray-800 rounded-lg"
                    />
                    <input
                      value={form.icon}
                      onChange={(e) => setForm({ ...form, icon: e.target.value })}
                      placeholder="Іконка (emoji або svg)"
                      className="p-3 bg-gray-800 rounded-lg"
                    />
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-4">
                    <select
                      value={form.condition_type}
                      onChange={(e) =>
                        setForm({ ...form, condition_type: e.target.value })
                      }
                      className="p-3 bg-gray-800 rounded-lg"
                    >
                        <option value="">
                            {lang === "ua" ? "Тип умови..." : "Condition type..."}
                        </option>
                        <option value="tests_passed">
                            ✅ {lang === "ua" ? "Пройдено тестів" : "Tests passed"}
                        </option>
                        <option value="certificates">
                            📜 {lang === "ua" ? "Отримано сертифікатів" : "Certificates"}
                        </option>
                        <option value="payments">
                            💰 {lang === "ua" ? "Оплат проведено" : "Payments made"}
                        </option>
                        <option value="score_avg">
                            ⭐ {lang === "ua" ? "Середній бал" : "Average score"}
                        </option>
                        <option value="streak_days">
                            🔥 {lang === "ua" ? "Днів поспіль" : "Streak days"}
                        </option>
                    </select>

                    <input
                      type="number"
                      value={form.condition_value}
                      onChange={(e) =>
                        setForm({ ...form, condition_value: e.target.value })
                      }
                      placeholder={
                          lang === "ua" ? "Значення умови" : "Condition value"
                      }
                      className="p-3 bg-gray-800 rounded-lg"
                    />
                </div>



                <div className="flex justify-end gap-3 mt-6">
                    <button
                      onClick={() => setShowForm(false)}
                      className="bg-gray-600 hover:bg-gray-700 px-5 py-2 rounded-lg"
                    >
                        {lang === "ua" ? "Скасувати" : "Cancel"}
                    </button>
                    <button
                      onClick={handleSave}
                      className="bg-green-600 hover:bg-green-700 px-5 py-2 rounded-lg"
                    >
                        💾 {lang === "ua" ? "Зберегти" : "Save"}
                    </button>
                </div>
            </div>
          )}

          <ConfirmModal
            {...confirmState}
            onCancel={() => closeConfirm(false)}
            onConfirm={() => closeConfirm(true)}
          />
      </div>
    );
}
