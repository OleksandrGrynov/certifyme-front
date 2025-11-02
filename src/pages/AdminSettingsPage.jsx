import { useState, useEffect } from "react";
import { Server, Bell, HardDriveDownload, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminSettingsPage() {
  const { t, i18n } = useTranslation();
  const [system, setSystem] = useState(null);
  const [insights, setInsights] = useState([]);
  const [notifications, setNotifications] = useState({
    newUser: true,
    newCert: true,
    newReview: false,
    errors: true,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return console.warn("⚠️ Token missing in localStorage");

    const lang = i18n.language;
    fetch(`http://localhost:5000/api/settings/system?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setSystem(data.info))
      .catch((err) => {
        console.error("❌ Error loading system info:", err);
        setSystem(null);
      });
  }, [i18n.language]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return console.warn("⚠️ Token missing in localStorage");

    const lang = i18n.language;
    fetch(`http://localhost:5000/api/settings/insights?lang=${lang}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setInsights(data.insights || []))
      .catch((err) => {
        console.error("❌ Error loading insights:", err);
        setInsights([]);
      });
  }, [i18n.language]);

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
        ⚙️ {t("systemManagement")}
      </h2>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Server size={20} /> {t("systemStatus")}
        </h3>

        {system ? (
          <div className="grid sm:grid-cols-2 gap-3 text-gray-300">
            <p>
              🌐 {t("apiVersion")}: <span className="text-white">{system.apiVersion || "—"}</span>
            </p>
            <p>
              🗄️ {t("database")}: <span className="text-white">{system.dbStatus || "—"}</span>
            </p>
            <p>
              🚀 {t("uptime")}: <span className="text-white">{system.uptime || "—"}</span>
            </p>
            <p>
              📊 {t("activeQueries")}:{" "}
              <span className="text-white">{system.activeQueries || 0}</span>
            </p>
          </div>
        ) : (
          <p className="text-gray-500">⏳ {t("systemLoading")}</p>
        )}
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <HardDriveDownload size={20} /> {t("backups")}
        </h3>
        <button className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg">
          📦 {t("createBackup")}
        </button>
        <ul className="mt-4 text-gray-400 space-y-2">
          <li>
            27.10.2025 — <span className="text-green-400">{t("success")}</span>
          </li>
          <li>
            25.10.2025 — <span className="text-green-400">{t("success")}</span>
          </li>
          <li>
            21.10.2025 — <span className="text-yellow-400">{t("partial")}</span>
          </li>
        </ul>
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Bell size={20} /> {t("notifications")}
        </h3>
        <div className="flex flex-col gap-2 text-gray-300">
          {Object.entries(notifications).map(([key, value]) => (
            <label key={key} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={value}
                onChange={() => setNotifications((p) => ({ ...p, [key]: !p[key] }))}
                className="accent-green-500"
              />

              {t(`notif_${key}`)}
            </label>
          ))}
        </div>
      </section>

      {}
      <section className="bg-gray-900/70 p-6 rounded-xl border border-gray-800">
        <h3 className="text-green-400 font-medium flex items-center gap-2 mb-3">
          <Brain size={20} /> {t("insights")}
        </h3>
        {insights.length ? (
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {insights.map((i, idx) => (
              <li key={idx}>{i}</li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">🤖 {t("analyticsGenerating")}</p>
        )}
      </section>
    </div>
  );
}
