import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { fetchWithAuth } from "../lib/apiClient";
import { motion } from "framer-motion";
import { API_URL } from "../lib/apiClient";

export default function AnalyticsPage() {
  const { i18n } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const [overview, setOverview] = useState(null);
  const [daily, setDaily] = useState(null);
  const [topCourses, setTopCourses] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [isPublicView, setIsPublicView] = useState(false);

  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) fetchAll();
  }, [i18n.language]);

  
  const fetchAll = async () => {
    setLoading(true);
    setErr("");
    setIsPublicView(false);
    try {
      const [ovR, dailyR, topR, recentR] = await Promise.all([
        fetchWithAuth(`/api/analytics/user/overview`),
        fetchWithAuth(`/api/analytics/user/daily?days=30`),
        fetchWithAuth(`/api/analytics/user/top-courses?limit=10`),
        fetchWithAuth(`/api/analytics/user/recent?limit=20`),
      ]);

      if (!ovR.ok || !dailyR.ok || !topR.ok || !recentR.ok) {
        throw new Error("Auth error");
      }

      const ov = await ovR.json();
      const di = await dailyR.json();
      console.log("📊 daily data:", di);

      const tp = await topR.json();
      const re = await recentR.json();

      setOverview(ov?.data || ov);
      setDaily({
        activity:
          di?.data?.activity?.map((d) => ({
            day: d.date,
            count: d.count,
          })) ?? [],
        tests:
          di?.data?.tests?.map((d) => ({
            day: d.date,
            count: d.count,
          })) ?? [],
      });

      setTopCourses(tp?.data || tp || []);
      setRecent(re?.data || re || []);
    } catch (e) {
      console.error("Analytics fetch error", e);
      setErr(
        tLabel(
          "Помилка при завантаженні аналітики або доступу.",
          "Error loading analytics or access denied."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  
  const StatCard = ({ title, value, hint }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-900/60 border border-gray-700 rounded-xl p-4 flex flex-col backdrop-blur-sm shadow-lg hover:border-green-500/30 hover:shadow-green-500/10 transition"
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

  
  const LineChart = ({ points = [], svgHeight = 180, color = "#34d399" }) => {
    const [hoverIndex, setHoverIndex] = useState(null);

    if (!points || points.length === 0)
      return (
        <div className="text-gray-500 text-center py-8">
          {tLabel("Немає даних", "No data")}
        </div>
      );

    
    const data = [...points].sort(
      (a, b) => new Date(a.day || a.date) - new Date(b.day || b.date)
    );

    const max = Math.max(...data.map((p) => p.count || 0), 1);
    const min = Math.min(...data.map((p) => p.count || 0), 0);

    
    const totalPoints = Math.max(data.length, 7);
    const w = totalPoints * 60;
    const stepX = w / (totalPoints - 1);

    const path = data
      .map((p, i) => {
        const x = i * stepX;
        const y =
          svgHeight -
          ((p.count - min) / (max - min || 1)) * (svgHeight * 0.85) -
          15;
        if (i === 0) return `M ${x},${y}`;
        const prevX = (i - 1) * stepX;
        const prevY =
          svgHeight -
          ((data[i - 1].count - min) / (max - min || 1)) *
          (svgHeight * 0.85) -
          15;
        const cx = (prevX + x) / 2;
        return `C ${cx},${prevY} ${cx},${y} ${x},${y}`;
      })
      .join(" ");

    return (
      <svg
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${w} ${svgHeight}`}
        preserveAspectRatio="none"
        className="rounded"
      >
        {}
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d={`${path} L ${w},${svgHeight} L 0,${svgHeight} Z`}
          fill={`url(#grad-${color})`}
        />

        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          style={{ filter: `drop-shadow(0px 0px 6px ${color}55)` }}
        />

        {data.map((p, i) => {
          const x = i * stepX;
          const y =
            svgHeight -
            ((p.count - min) / (max - min || 1)) * (svgHeight * 0.85) -
            15;
          const dateLabel = new Date(p.day || p.date).toLocaleDateString(
            i18n.language === "ua" ? "uk-UA" : "en-US",
            { day: "numeric", month: "short" }
          );

          return (
            <g key={i}>
              <motion.circle
                cx={x}
                cy={y}
                r={hoverIndex === i ? 6 : 4}
                fill={color}
                className="cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
                whileHover={{ scale: 1.2 }}
              />
              {hoverIndex === i && (
                <motion.g
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <rect
                    x={x - 40}
                    y={y - 50}
                    width="80"
                    height="32"
                    rx="6"
                    ry="6"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="0.5"
                  />
                  <text
                    x={x}
                    y={y - 34}
                    textAnchor="middle"
                    className="text-[10px] fill-green-300"
                  >
                    {dateLabel}
                  </text>
                  <text
                    x={x}
                    y={y - 22}
                    textAnchor="middle"
                    className="text-[11px] fill-white font-semibold"
                  >
                    {p.count}
                  </text>
                </motion.g>
              )}
            </g>
          );
        })}
      </svg>
    );
  };

  
  const BarChart = ({ items = [] }) => {
    if (!items || items.length === 0)
      return (
        <div className="text-gray-400 text-center py-6">
          {tLabel("Немає даних", "No data")}
        </div>
      );

    const max = Math.max(...items.map((i) => i.tests_taken || 0), 1);
    const [hovered, setHovered] = useState(null);

    return (
      <div className="relative flex items-end gap-4 h-48 p-4 overflow-visible">
        {items.map((it, i) => {
          const value = it.tests_taken || 0;
          const name = it.name || `#${i + 1}`;
          const h = Math.round((value / max) * 100);

          return (
            <motion.div
              key={i}
              className="flex-1 text-center relative cursor-pointer group"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              style={{ transformOrigin: "bottom" }}
            >
              <motion.div
                style={{ height: `${h}%` }}
                className="mx-auto w-8 rounded-t-lg bg-gradient-to-t from-green-500 to-emerald-300 shadow-[0_0_10px_rgba(34,197,94,0.3)] group-hover:from-green-400 group-hover:to-lime-300 transition-all duration-300"
                whileHover={{ scaleX: 1.1 }}
              ></motion.div>

              <div className="text-[11px] text-gray-300 mt-2 text-center leading-tight break-words max-w-[60px] mx-auto">
                {name}
              </div>

              {hovered === i && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900/90 text-green-400 text-xs px-2 py-1 rounded-lg border border-green-500/40 whitespace-nowrap shadow-lg"
                >
                  {`${name}: ${value}`}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    );
  };

  
  const stats = useMemo(
    () => ({
      enrolledCourses: overview?.courses_enrolled ?? "—",
      testsTaken: overview?.my_tests_taken ?? "—",
      avgScore: overview?.my_avg_score
        ? `${overview.my_avg_score.toFixed(1)}%`
        : "—",
      certificates: overview?.my_certificates ?? "—",
      passRate:
        overview?.my_pass_rate !== undefined
          ? `${overview.my_pass_rate.toFixed(1)}%`
          : "—",
      streak: overview?.current_streak_days ?? "—",
      level: overview?.level ?? 0,
      levelProgress: overview?.level_progress ?? 0,
    }),
    [overview]
  );

  return (
    <section className="relative min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 overflow-hidden">
      {}
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
          <div className="bg-red-900/30 text-red-300 p-3 rounded mb-4 border border-red-700/30 text-center">
            {err}
          </div>
        )}

        {isPublicView && (
          <div className="bg-yellow-900/20 text-yellow-200 p-3 rounded mb-4 text-center">
            {tLabel(
              "Показана публічна версія аналітики.",
              "Public analytics view."
            )}
          </div>
        )}

        {!localStorage.getItem("token") ? (
          <div className="text-center text-gray-400 mt-10">
            {tLabel(
              "Будь ласка, увійдіть, щоб переглянути аналітику.",
              "Please log in to view analytics."
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-7 gap-4 mb-10">
              <StatCard
                title={tLabel("Курси (підписані)", "Courses (enrolled)")}
                value={stats.enrolledCourses}
              />
              <StatCard
                title={tLabel("Тести пройдено", "Tests completed")}
                value={stats.testsTaken}
              />
              <StatCard
                title={tLabel("Середній бал", "Average score")}
                value={stats.avgScore}
              />
              <StatCard
                title={tLabel("Сертифікатів", "Certificates")}
                value={stats.certificates}
              />
              <StatCard
                title={tLabel("Прохідність", "Pass rate")}
                value={stats.passRate}
              />
              <StatCard
                title={tLabel("Поточний стрик", "Current streak")}
                value={stats.streak}
              />
              <StatCard
                title={tLabel("Рівень користувача", "User level")}
                value={`Lv. ${stats.level}`}
                hint={`${stats.levelProgress}% ${tLabel(
                  "до наступного рівня",
                  "to next level"
                )}`}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
                <div className="flex justify-between mb-3">
                  <div className="text-lg font-semibold">
                    {tLabel("Активність", "Activity")}
                  </div>
                  <div className="text-sm text-gray-400">
                    {tLabel("ост. 30 днів", "last 30 days")}
                  </div>
                </div>
                <LineChart points={daily?.activity ?? []} color="#34d399" />
              </div>

              <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
                <div className="flex justify-between mb-3">
                  <div className="text-lg font-semibold">
                    {tLabel("Ваші тести", "Your tests")}
                  </div>
                  <div className="text-sm text-gray-400">
                    {tLabel("ост. 30 днів", "last 30 days")}
                  </div>
                </div>
                <LineChart points={daily?.tests ?? []} color="#60a5fa" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
              <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
                <div className="flex justify-between mb-2">
                  <div className="text-lg font-semibold">
                    {tLabel("Топ курсів", "Top courses")}
                  </div>
                  <div className="text-sm text-gray-400">Top 10</div>
                </div>
                <BarChart items={topCourses} />
              </div>

              <div className="bg-gray-900/70 border border-gray-700 p-4 rounded-xl backdrop-blur-md shadow-lg">
                <div className="flex justify-between mb-2">
                  <div className="text-lg font-semibold">
                    {tLabel("Останні події", "Recent events")}
                  </div>
                  <div className="text-sm text-gray-400">
                    Login / Test / Cert
                  </div>
                </div>
                <div className="max-h-72 overflow-auto text-sm">
                  <table className="w-full">
                    <thead>
                    <tr className="text-gray-400 text-left">
                      <th className="pb-2">
                        {tLabel("Час", "Time")}
                      </th>
                      <th className="pb-2">
                        {tLabel("Тип", "Type")}
                      </th>
                      <th className="pb-2">
                        {tLabel("Опис", "Description")}
                      </th>
                    </tr>
                    </thead>
                    <tbody>
                    {recent.map((r, i) => (
                      <tr
                        key={i}
                        className="border-t border-gray-800/60"
                      >
                        <td className="py-2 text-xs text-gray-400">
                          {formatDate(r.created_at || r.time)}
                        </td>
                        <td className="py-2 text-green-400">
                          {r.type}
                        </td>
                        <td className="py-2 text-gray-300">
                          {r.description}
                        </td>
                      </tr>
                    ))}
                    {recent.length === 0 && (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center py-4 text-gray-500"
                        >
                          {tLabel("Немає подій", "No events")}
                        </td>
                      </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
