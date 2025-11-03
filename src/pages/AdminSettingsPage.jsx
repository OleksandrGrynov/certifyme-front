import { useState, useEffect } from "react";
import {
  Server,
  Bell,
  HardDriveDownload,
  Brain,
  Send,
  Phone,
  Loader2,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";

export default function AdminSettingsPage() {
  const { i18n } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const [system, setSystem] = useState(null);
  const [insights, setInsights] = useState([]);
  const [smsCount, setSmsCount] = useState(0);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState({
    newUser: true,
    newCert: true,
    newReview: false,
    errors: true,
  });

  // 🧠 1. Завантаження системної інформації
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/settings/system", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSystem(data.info))
      .catch((err) => console.error("❌ System info error:", err));
  }, []);

  // 📊 2. Завантаження аналітики
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/settings/insights", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setInsights(data.insights || []))
      .catch(() => setInsights([]));
  }, []);

  // 📱 3. Кількість підписників на SMS
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/sms/count", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setSmsCount(data.count || 0))
      .catch(() => setSmsCount(0));
  }, []);

  // 🚀 4. Створення резервної копії
  const handleBackup = async () => {
    const token = localStorage.getItem("token");
    if (!token) return toast.error("🔒 Авторизуйтесь як адмін");
    try {
      toast.loading("⏳ Створення резервної копії...");
      const res = await fetch("http://localhost:5000/api/settings/backup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      toast.dismiss();
      data.success
        ? toast.success("✅ Резервну копію створено!")
        : toast.error("⚠️ Помилка створення копії");
    } catch {
      toast.dismiss();
      toast.error("⚠️ Сервер недоступний");
    }
  };

  // 💬 5. Надіслати SMS-розсилку
  const handleSendSMS = async () => {
    if (!message.trim()) return toast.error("✍️ Введіть текст повідомлення");
    const token = localStorage.getItem("token");
    if (!token) return toast.error("🔒 Авторизуйтесь");
    setSending(true);
    try {
      const res = await fetch("http://localhost:5000/api/sms/send-promo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      data.success
        ? toast.success("✅ Розсилку успішно надіслано!")
        : toast.error(data.message || "⚠️ Помилка надсилання");
    } catch (err) {
      console.error(err);
      toast.error("⚠️ Сервер недоступний");
    } finally {
      setSending(false);
      setMessage("");
    }
  };

  return (
    <div className="space-y-8">
      <Toaster position="top-center" />

      {/* ⚙️ Стан системи */}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Server size={20} /> {tLabel("Стан системи", "System Status")}
        </h3>
        {system ? (
          <div className="grid sm:grid-cols-2 gap-3 text-gray-300">
            <p>🌐 API: <span className="text-white">{system.apiVersion || "—"}</span></p>
            <p>🗄️ DB: <span className="text-white">{system.dbStatus || "—"}</span></p>
            <p>🚀 Uptime: <span className="text-white">{system.uptime || "—"}</span></p>
            <p>📊 Queries: <span className="text-white">{system.activeQueries || 0}</span></p>
          </div>
        ) : (
          <p className="text-gray-500">⏳ {tLabel("Завантаження...", "Loading...")}</p>
        )}
      </section>

      {/* 💾 Резервні копії */}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <HardDriveDownload size={20} /> {tLabel("Резервні копії", "Backups")}
        </h3>
        <button
          onClick={handleBackup}
          className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition"
        >
          📦 {tLabel("Створити копію", "Create Backup")}
        </button>
      </section>

      {/* 🔔 Сповіщення */}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Bell size={20} /> {tLabel("Сповіщення", "Notifications")}
        </h3>
        {Object.entries(notifications).map(([k, v]) => (
          <label key={k} className="flex items-center gap-3 text-gray-300">
            <input
              type="checkbox"
              checked={v}
              onChange={() =>
                setNotifications((p) => ({ ...p, [k]: !p[k] }))
              }
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

      {/* 📱 SMS Розсилка */}
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

      {/* 🧠 Аналітичні підказки */}
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
          <p className="text-gray-500">🤖 {tLabel("Генерується аналітика...", "Generating analytics...")}</p>
        )}
      </section>
    </div>
  );
}
