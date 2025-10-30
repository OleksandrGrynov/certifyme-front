import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fetchWithAuth } from "../lib/apiClient";
import { motion } from "framer-motion";

export default function AnalyticsPage() {
  const { i18n, t } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isPublicView, setIsPublicView] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    setIsPublicView(false);
    try {
      const [ovR, dailyR, topR, recentR] = await Promise.all([
        fetchWithAuth("http://localhost:5000/api/analytics/user/overview"),
        fetchWithAuth("http://localhost:5000/api/analytics/user/daily?days=30"),
        fetchWithAuth("http://localhost:5000/api/analytics/user/top-courses?limit=10"),
        fetchWithAuth("http://localhost:5000/api/analytics/user/recent?limit=20"),
      ]);

      if (!ovR.ok || !dailyR.ok || !topR.ok || !recentR.ok) {
        throw new Error("Auth error");
      }

      const ov = await ovR.json();
      const di = await dailyR.json();
      const tp = await topR.json();
      const re = await recentR.json();

      setOverview(ov?.data || ov);
      setDaily(di?.data || di);
      setTopCourses(tp?.data || tp || []);
      setRecent(re?.data || re || []);
    } catch (e) {
      console.error("Analytics fetch error", e);
      setErr(tLabel("Помилка при завантаженні аналітики або доступу.", "Error loading analytics or access denied."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const StatCard = ({ title, value, hint }) => (
      <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 flex flex-col backdrop-blur-sm shadow-lg hover:shadow-green-500/10 transition"
      >
        <div className="text-xs text-gray-400">{title}</div>
        <div className="text-2xl font-bold mt-2 text-green-400">{value}</div>
        {hint && <div className="text-xs text-gray-500 mt-2">{hint}</div>}
      </motion.div>
  );

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(i18n.language === "ua" ? "uk-UA" : "en-US");
    } catch {
      return iso;
    }
  };

  const LineChart = ({ points = [], svgHeight = 120, color = "#34d399" }) => {
    if (!points || points.length === 0)
      return <div className="text-gray-500">{tLabel("Немає даних", "No data")}</div>;
    const max = Math.max(...points.map((p) => p.count), 1);
    const w = Math.max(points.length * 8, 200);
    const stepX = w / (points.length - 1 || 1);
    const coords = points
        .map((p, i) => `${i * stepX},${svgHeight - (p.count / max) * svgHeight}`)
        .join(" ");
    return (
        <svg width="100%" viewBox={`0 0 ${w} ${svgHeight}`} preserveAspectRatio="none" className="rounded">
          <polyline fill="none" stroke={color} strokeWidth="2" points={coords} />
          <polyline fill={`${color}22`} stroke="none" points={`${coords} ${w},${svgHeight} 0,${svgHeight}`} />
        </svg>
    );
  };

  const BarChart = ({ items = [] }) => {
    if (!items || items.length === 0)
      return <div className="text-gray-400">{tLabel("Немає даних", "No data")}</div>;
    const max = Math.max(...items.map((i) => i.tests_taken), 1);
    return (
        <div className="flex items-end gap-3 h-36">
          {items.map((it) => {
            const h = Math.round((it.tests_taken / max) * 100);
            return (
                <div key={it.name} className="flex-1 text-center">
                  <div className="h-full flex items-end justify-center">
                    <div
                        title={`${it.name}: ${it.tests_taken}`}
                        style={{ height: `${h}%` }}
                        className="w-6 bg-green-500 rounded-t"
                    />
                  </div>
                  <div className="text-xs text-gray-300 mt-2 truncate">{it.name}</div>
                </div>
            );
          })}
        </div>
    );
  };

  const stats = useMemo(
      () => ({
        enrolledCourses: overview?.courses_enrolled ?? "—",
        testsTaken: overview?.my_tests_taken ?? "—",
        avgScore: overview?.my_avg_score ? `${overview.my_avg_score.toFixed(1)}%` : "—",
        certificates: overview?.my_certificates ?? "—",
        passRate: overview?.my_pass_rate ? `${(overview.my_pass_rate * 100).toFixed(1)}%` : "—",
        streak: overview?.current_streak_days ?? "—",
      }),
      [overview]
  );

  return (
      <section className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 overflow-hidden">
        {/* background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-1/3 -left-1/3 w-[600px] h-[600px] bg-green-500/20 blur-[200px] rounded-full animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-emerald-400/20 blur-[200px] rounded-full animate-[pulse_6s_ease-in-out_infinite]"></div>
        </div>

        <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 max-w-7xl mx-auto p-6"
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-green-400 drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]">
            {tLabel("Персональна аналітика", "Personal Analytics")}
          </h1>

          {err && (
              <div className="bg-red-900/30 text-red-300 p-3 rounded mb-4 border border-red-700/30">{err}</div>
          )}

          {isPublicView && (
              <div className="bg-yellow-900/20 text-yellow-200 p-3 rounded mb-4">
                {tLabel("Показана публічна версія аналітики.", "Public analytics view.")}
              </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-10">
            <StatCard title={tLabel("Курси (підписані)", "Courses (enrolled)")} value={stats.enrolledCourses} />
            <StatCard title={tLabel("Тести пройдено", "Tests completed")} value={stats.testsTaken} />
            <StatCard title={tLabel("Середній бал", "Average score")} value={stats.avgScore} />
            <StatCard title={tLabel("Сертифікатів", "Certificates")} value={stats.certificates} />
            <StatCard title={tLabel("Прохідність", "Pass rate")} value={stats.passRate} />
            <StatCard title={tLabel("Поточний стрик", "Current streak")} value={stats.streak} />
            <StatCard title="—" value="—" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
              <div className="flex justify-between mb-3">
                <div className="text-lg font-semibold">{tLabel("Активність", "Activity")}</div>
                <div className="text-sm text-gray-400">{tLabel("ост. 30 днів", "last 30 days")}</div>
              </div>
              <LineChart points={daily?.activity ?? []} color="#34d399" />
            </div>

            <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
              <div className="flex justify-between mb-3">
                <div className="text-lg font-semibold">{tLabel("Ваші тести", "Your tests")}</div>
                <div className="text-sm text-gray-400">{tLabel("ост. 30 днів", "last 30 days")}</div>
              </div>
              <LineChart points={daily?.tests ?? []} color="#60a5fa" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
            <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
              <div className="flex justify-between mb-2">
                <div className="text-lg font-semibold">{tLabel("Топ курсів", "Top courses")}</div>
                <div className="text-sm text-gray-400">Top 10</div>
              </div>
              <BarChart items={topCourses} />
            </div>

            <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
              <div className="flex justify-between mb-2">
                <div className="text-lg font-semibold">{tLabel("Останні події", "Recent events")}</div>
                <div className="text-sm text-gray-400">Login / Test / Cert</div>
              </div>
              <div className="max-h-72 overflow-auto text-sm">
                <table className="w-full">
                  <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="pb-2">{tLabel("Час", "Time")}</th>
                    <th className="pb-2">{tLabel("Тип", "Type")}</th>
                    <th className="pb-2">{tLabel("Опис", "Description")}</th>
                  </tr>
                  </thead>
                  <tbody>
                  {recent.map((r, i) => (
                      <tr key={i} className="border-t border-gray-800/60">
                        <td className="py-2 text-xs text-gray-400">{formatDate(r.created_at || r.time)}</td>
                        <td className="py-2 text-green-400">{r.type}</td>
                        <td className="py-2 text-gray-300">{r.description}</td>
                      </tr>
                  ))}
                  {recent.length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-4 text-gray-500">
                          {tLabel("Немає подій", "No events")}
                        </td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </motion.div>
      </section>
  );
}
