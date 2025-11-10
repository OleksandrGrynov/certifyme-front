import { useState, useEffect } from "react";
import {
  Server,
  Bell,
  Brain,
  Phone,
  Users,
  Wrench,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { API_URL } from "../lib/apiClient";

export default function AdminSettingsPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language.startsWith("ua") || i18n.language.startsWith("uk") ? "ua" : "en";
  const tLabel = (ua, en) => (lang === "ua" ? ua : en);

  const [system, setSystem] = useState(null);
  const [insights, setInsights] = useState([]);
  const [smsCount, setSmsCount] = useState(0);
  const [notifications, setNotifications] = useState({
    newUser: true,
    newCert: true,
    newReview: false,
    errors: true,
  });

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/settings/system`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        
        if (lang === "en" && data.info) {
          const translated = {
            ...data.info,
            dbStatus:
              data.info.dbStatus === "Підключено"
                ? "Connected"
                : data.info.dbStatus === "Відключено"
                  ? "Disconnected"
                  : data.info.dbStatus,
            uptime: data.info.uptime?.replace("години", "hours").replace("хвилин", "minutes"),
          };
          setSystem(translated);
        } else {
          setSystem(data.info);
        }
      })
      .catch((err) => console.error(" System info error:", err));
  }, [lang]);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/settings/insights`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data.insights)) return setInsights([]);
        if (lang === "en") {
          
          const translated = data.insights.map((t) =>
            t
              .replace("Наразі", "Currently")
              .replace("зареєстрованих користувачів", "registered users")
              .replace("Середній рівень проходження тестів", "Average test completion rate")
              .replace("Останній доданий тест", "Last added test")
              .replace("та", "and")
              .replace("тестів", "tests")
              .replace("користувачів", "users")
              .replace("відгуки", "reviews")
              .replace("рівень", "level")
              .replace("проходження", "completion")
              .replace("—", "—")
          );
          setInsights(translated);
        } else {
          setInsights(data.insights);
        }
      })
      .catch(() => setInsights([]));
  }, [lang]);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(`${API_URL}/api/sms/count`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSmsCount(data.count || 0))
      .catch(() => setSmsCount(0));
  }, []);

  
  const runAdminAction = async (labelUa, labelEn) => {
    toast.loading(tLabel(`⏳ Виконую: ${labelUa}`, `⏳ Running: ${labelEn}`));
    await new Promise((r) => setTimeout(r, 1200));
    toast.dismiss();
    toast.success(tLabel(`Завершено: ${labelUa}`, `Completed: ${labelEn}`));
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Server size={20} /> {tLabel("Стан системи", "System Status")}
        </h3>
        {system ? (
          <div className="grid sm:grid-cols-2 gap-3 text-gray-300">
            <p>
              🌐 API: <span className="text-white">{system.apiVersion || "—"}</span>
            </p>
            <p>
              🗄️ DB: <span className="text-white">{system.dbStatus || "—"}</span>
            </p>
            <p>
              🚀 {tLabel("Час роботи", "Uptime")}:{" "}
              <span className="text-white">{system.uptime || "—"}</span>
            </p>
            <p>
              📊 {tLabel("Запити", "Queries")}:{" "}
              <span className="text-white">{system.activeQueries || 0}</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">⏳ {tLabel("Завантаження...", "Loading...")}</p>
        )}
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-4">
          <Wrench size={20} /> {tLabel("Адмін-інструменти", "Admin Tools")}
        </h3>

        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => runAdminAction("Очистити кеш", "Clear Cache")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            🧹 {tLabel("Очистити кеш", "Clear Cache")}
          </button>

          <button
            onClick={() => runAdminAction("Оновити аналітику", "Refresh Analytics")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            🧠 {tLabel("Оновити аналітику", "Refresh Analytics")}
          </button>

          <button
            onClick={() => runAdminAction("Експортувати дані", "Export Data")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            📤 {tLabel("Експортувати дані", "Export Data")}
          </button>

          <button
            onClick={() => runAdminAction("Синхронізувати систему", "Sync System")}
            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            🔁 {tLabel("Синхронізувати систему", "Sync System")}
          </button>
        </div>
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Bell size={20} /> {tLabel("Сповіщення", "Notifications")}
        </h3>
        {Object.entries(notifications).map(([k, v]) => (
          <label key={k} className="flex items-center gap-3 text-gray-300">
            <input
              type="checkbox"
              checked={v}
              onChange={() => setNotifications((p) => ({ ...p, [k]: !p[k] }))}
              className="accent-green-500"
            />
            {{
              newUser: tLabel("Нові користувачі", "New Users"),
              newCert: tLabel("Нові сертифікати", "New Certificates"),
              newReview: tLabel("Нові відгуки", "New Reviews"),
              errors: tLabel("Помилки системи", "System Errors"),
            }[k]}
          </label>
        ))}
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Phone size={20} /> {tLabel("SMS Розсилка", "SMS Broadcast")}
        </h3>
        <p className="text-gray-400 mb-3 flex items-center gap-2">
          <Users size={18} className="text-green-400" />{" "}
          {tLabel("Підписників", "Subscribers")}:{" "}
          <span className="text-white">{smsCount}</span>
        </p>
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Brain size={20} /> {tLabel("Аналітичні підказки", "AI Insights")}
        </h3>
        {insights.length ? (
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {insights.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">
            🤖 {tLabel("Генерується аналітика...", "Generating analytics...")}
          </p>
        )}
      </section>
    </div>
  );
}
