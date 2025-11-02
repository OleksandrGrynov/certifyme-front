import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Trash,
  Edit3,
  Save,
  Settings2,
  X,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminTestsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [tests, setTests] = useState([]);
  const [editingTest, setEditingTest] = useState(null);
  const [toast, setToast] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  // 📚 Завантажити всі тести
  const loadTests = async () => {
    try {
      const lang = i18n.language || "ua";
      const res = await fetch(`http://localhost:5000/api/tests?lang=${lang}`);
      const data = await res.json();
      if (data.success) setTests(data.tests || []);
    } catch (err) {
      console.error("❌ Помилка отримання тестів:", err);
    }
  };

  useEffect(() => {
    loadTests();
  }, [i18n.language]);

  // 🗑️ Відкрити підтвердження видалення
  const confirmDelete = (test) => {
    setTestToDelete(test);
    setShowConfirm(true);
  };

  // 🗑️ Підтвердити видалення тесту
  const handleDeleteTest = async () => {
    if (!testToDelete) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/tests/${testToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setTests((prev) => prev.filter((t) => t.id !== testToDelete.id));
        showToast(
          i18n.language === "en"
            ? "✅ Test deleted successfully!"
            : "✅ Тест успішно видалено!"
        );
      } else {
        showToast(
          i18n.language === "en"
            ? "❌ Error deleting test!"
            : "❌ Помилка при видаленні тесту!",
          "error"
        );
      }
    } catch (err) {
      console.error("❌ Error deleting test:", err);
      showToast("❌ Server error!", "error");
    } finally {
      setShowConfirm(false);
      setTestToDelete(null);
    }
  };

  // ✏️ Перейти до редагування
  const handleEdit = (test) => {
    navigate(`/admin/tests/${test.id}/edit`);
  };

  // 💾 Toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div className="relative">
      {/* ✅ Toast повідомлення */}
      {toast && (
        <div
          className={`fixed top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 animate-fadeIn ${
            toast.type === "error" ? "bg-red-600" : "bg-green-600"
          } text-white`}
        >
          <CheckCircle className="inline mr-2" size={18} />
          {toast.message}
        </div>
      )}

      {/* Заголовок */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl text-green-400 font-bold">{t("admin.tests")}</h2>
        <button
          onClick={() => navigate("/admin/tests/create")}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={18} /> {t("admin.createTest")}
        </button>
      </div>

      {/* 📋 Список тестів */}
      {tests.length === 0 ? (
        <p className="text-gray-400 text-center">
          {i18n.language === "en"
            ? "No tests yet. Create one!"
            : "Поки що немає тестів. Створи перший!"}
        </p>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {tests.map((tst) => (
            <div
              key={tst.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col justify-between"
            >
              <div>
                {tst.image_url && (
                  <img
                    src={tst.image_url}
                    alt="preview"
                    className="rounded mb-3 h-32 w-full object-cover"
                  />
                )}
                <h3 className="font-bold text-lg text-white mb-1">
                  {tst.title_ua || tst.title}
                </h3>
                <p className="text-sm text-gray-400">
                  {tst.description_ua || tst.description}
                </p>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-gray-700">
                <button
                  onClick={() => handleEdit(tst)}
                  className="bg-yellow-500 hover:bg-yellow-600 flex-1 py-1.5 rounded flex items-center justify-center gap-1"
                >
                  <Edit3 size={16} /> {t("common.edit")}
                </button>
                <button
                  onClick={() => confirmDelete(tst)}
                  className="bg-red-600 hover:bg-red-700 flex-1 py-1.5 rounded flex items-center justify-center gap-1"
                >
                  <Trash size={16} /> {t("common.delete")}
                </button>
              </div>
            </div>

          ))}
        </div>
      )}

      {/* ⚠️ Модальне підтвердження видалення */}
      {showConfirm && testToDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-yellow-400" size={28} />
              <h3 className="text-lg font-bold text-white">
                {i18n.language === "en"
                  ? "Confirm deletion"
                  : "Підтвердити видалення"}
              </h3>
            </div>
            <p className="text-gray-300 mb-6">
              {i18n.language === "en"
                ? `Are you sure you want to delete "${testToDelete.title_en || testToDelete.title_ua}"?`
                : `Ви впевнені, що хочете видалити "${testToDelete.title_ua}"?`}
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-gray-200"
              >
                {i18n.language === "en" ? "Cancel" : "Скасувати"}
              </button>
              <button
                onClick={handleDeleteTest}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white"
              >
                {i18n.language === "en" ? "Delete" : "Видалити"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
