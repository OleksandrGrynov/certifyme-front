import { useEffect, useState } from "react";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import {
    BarChart3,
    Users,
    BookOpen,
    FileCheck2,
    DollarSign,
    Calendar,
    TrendingUp,
    Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export default function AdminAnalyticsPage() {
    const { t, i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    const [overview, setOverview] = useState(null);
    const [usersDaily, setUsersDaily] = useState([]);
    const [paymentsDaily, setPaymentsDaily] = useState([]);
    const [topTests, setTopTests] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [days, setDays] = useState(30);

    // 🔹 Завантаження даних
    const loadData = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [o, u, p, t, us] = await Promise.all([
            fetch(`http://localhost:5000/api/admin/analytics/overview?lang=${lang}`, { headers }).then((r) => r.json()),
            fetch(`http://localhost:5000/api/admin/analytics/daily-users?days=${days}&lang=${lang}`, { headers }).then((r) => r.json()),
            fetch(`http://localhost:5000/api/admin/analytics/payments-daily?days=${days}&lang=${lang}`, { headers }).then((r) => r.json()),
            fetch(`http://localhost:5000/api/admin/analytics/top-tests?lang=${lang}`, { headers }).then((r) => r.json()),
            fetch(`http://localhost:5000/api/admin/analytics/top-users?lang=${lang}`, { headers }).then((r) => r.json()),
        ]);

        if (o.success) setOverview(o.data);
        if (u.success) setUsersDaily(u.data);
        if (p.success) setPaymentsDaily(p.data);
        if (t.success) setTopTests(t.data);
        if (us.success) setTopUsers(us.data);
    };

    useEffect(() => {
        loadData();
    }, [days, lang]);

    if (!overview)
        return (
            <p className="text-gray-400 text-center mt-10 animate-pulse">
                {lang === "ua" ? "Завантаження аналітики..." : "Loading analytics..."}
            </p>
        );

    const formatDate = (d) =>
        new Date(d).toLocaleDateString(lang === "ua" ? "uk-UA" : "en-US");

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 🔘 Перемикач днів */}
            <div className="flex justify-end gap-2 mb-4">
                {[7, 30, 90].map((d) => (
                    <button
                        key={d}
                        onClick={() => setDays(d)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                            days === d
                                ? "bg-green-500 text-black shadow-lg"
                                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                    >
                        {d} {lang === "ua" ? "днів" : "days"}
                    </button>
                ))}
            </div>

            {/* 📊 Загальні показники */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={<Users />} title={lang === "ua" ? "Користувачів" : "Users"} value={overview.total_users} />
                <StatCard icon={<BookOpen />} title={lang === "ua" ? "Тестів" : "Tests"} value={overview.tests} />
                <StatCard icon={<FileCheck2 />} title={lang === "ua" ? "Сертифікатів" : "Certificates"} value={overview.certificates} />
                <StatCard icon={<BarChart3 />} title={lang === "ua" ? "Середній % успіху" : "Average score"} value={`${overview.avg_percent}%`} />
                <StatCard
                    icon={<DollarSign />}
                    title={lang === "ua" ? "Продажі (USD)" : "Sales (USD)"}
                    value={overview.payments_total.toFixed(2)}
                />
                <StatCard
                    icon={<Calendar />}
                    title={lang === "ua" ? "Оновлено" : "Updated"}
                    value={formatDate(overview.last_updated)}
                />
            </div>

            {/* 📈 Нові користувачі */}
            <ChartBox title={lang === "ua" ? `Нові користувачі (${days} днів)` : `New users (${days} days)`}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={usersDaily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: "#aaa", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#aaa" }} />
                        <Tooltip contentStyle={{ background: "#111", borderRadius: 8 }} />
                        <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2.5} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartBox>

            {/* 💳 Оплати */}
            <ChartBox title={lang === "ua" ? `Оплати (${days} днів)` : `Payments (${days} days)`}>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={paymentsDaily}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                        <XAxis dataKey="date" tick={{ fill: "#aaa" }} />
                        <YAxis tick={{ fill: "#aaa" }} />
                        <Tooltip contentStyle={{ background: "#111", borderRadius: 8 }} />
                        <Bar dataKey="total_usd" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartBox>

            {/* 🧾 Топ тестів */}
            <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-lg">
                <h3 className="text-lg md:text-xl text-green-400 font-semibold mb-5 flex items-center gap-2">
                    <BarChart3 size={22} />
                    {lang === "ua" ? "Топ тестів" : "Top tests"}
                </h3>

                {topTests.length ? (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {topTests.map((t, i) => (
                            <motion.div
                                key={t.test}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`relative p-5 rounded-xl border border-gray-800 bg-gradient-to-br from-gray-800/60 to-gray-900/70 hover:border-green-600 transition-all duration-300 ${
                                    i === 0
                                        ? "ring-2 ring-yellow-400/50"
                                        : i === 1
                                            ? "ring-2 ring-gray-400/40"
                                            : i === 2
                                                ? "ring-2 ring-amber-700/50"
                                                : ""
                                }`}
                            >
                                {/* Номер місця */}
                                <div className="absolute top-2 right-3 text-xs text-gray-500">
                                    #{i + 1}
                                </div>

                                {/* Іконка */}
                                <div className="flex items-center gap-2 mb-3">
                                    {i < 3 && (
                                        <Trophy
                                            size={18}
                                            className={
                                                i === 0
                                                    ? "text-yellow-400"
                                                    : i === 1
                                                        ? "text-gray-300"
                                                        : "text-amber-700"
                                            }
                                        />
                                    )}
                                    <h4 className="text-lg font-semibold text-white truncate">
                                        {t.test}
                                    </h4>
                                </div>

                                {/* Прогрес бар (візуалізує count) */}
                                <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${(t.count / topTests[0].count) * 100}%`,
                                        }}
                                        transition={{ duration: 0.6 }}
                                        className="h-full bg-green-500"
                                    />
                                </div>

                                {/* Кількість проходжень */}
                                <p className="text-sm text-gray-400 mt-1">
                                    {lang === "ua" ? "Проходжень:" : "Attempts:"}{" "}
                                    <span className="text-green-400 font-semibold">{t.count}</span>
                                </p>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-6 italic">
                        {lang === "ua" ? "Немає даних про тести" : "No test data available"}
                    </p>
                )}
            </div>


            {/* 👑 Топ користувачів */}
            <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-800 shadow-lg">
                <h3 className="text-lg md:text-xl text-green-400 font-semibold mb-5 flex items-center gap-2">
                    <TrendingUp size={22} />
                    {lang === "ua" ? "Топ користувачів за оплатами" : "Top users by payments"}
                </h3>

                {topUsers.length ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-gray-300 border-collapse rounded-xl overflow-hidden">
                            <thead className="bg-green-900/10 text-green-400 border-b border-gray-700 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="text-left py-3 px-4 w-[60px]">#</th>
                                <th className="text-left py-3 px-4">{lang === "ua" ? "Ім’я" : "Name"}</th>
                                <th className="text-left py-3 px-4">Email</th>
                                <th className="text-center py-3 px-4">{lang === "ua" ? "Оплат" : "Payments"}</th>
                                <th className="text-center py-3 px-4">{lang === "ua" ? "Сума, USD" : "Total, USD"}</th>
                            </tr>
                            </thead>
                            <tbody>
                            {topUsers.map((u, i) => (
                                <motion.tr
                                    key={u.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`border-b border-gray-800 hover:bg-gray-800/40 transition-all duration-200 ${
                                        i === 0
                                            ? "text-yellow-400 font-semibold bg-gradient-to-r from-yellow-900/10 via-yellow-800/10 to-transparent"
                                            : i === 1
                                                ? "text-gray-200"
                                                : i === 2
                                                    ? "text-amber-600"
                                                    : "text-gray-400"
                                    }`}
                                >
                                    <td className="py-3 px-4 flex items-center gap-2 font-semibold">
                                        {i < 3 && <Trophy size={14} className="text-yellow-400" />}
                                        #{i + 1}
                                    </td>
                                    <td className="py-3 px-4 whitespace-nowrap">{u.name}</td>
                                    <td className="py-3 px-4 text-yellow-300">{u.email}</td>
                                    <td className="py-3 px-4 text-center font-semibold">{u.payments}</td>
                                    <td className="py-3 px-4 text-center font-bold text-green-400">
                                        ${Number(u.total_usd).toFixed(2)}
                                    </td>
                                </motion.tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-6 italic">
                        {lang === "ua"
                            ? "Немає даних про користувачів"
                            : "No user data available"}
                    </p>
                )}
            </div>

        </div>
    );
}

// 📊 Компоненти
function ChartBox({ title, children }) {
    return (
        <motion.div
            className="bg-gray-900/60 p-6 rounded-xl border border-gray-800 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h3 className="text-lg text-green-400 font-semibold mb-4">{title}</h3>
            {children}
        </motion.div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <motion.div
            className="bg-gray-900/70 p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center text-center hover:scale-105 transition-transform"
            whileHover={{ y: -3 }}
        >
            <div className="text-green-400 mb-2">{icon}</div>
            <h4 className="text-gray-300 text-sm">{title}</h4>
            <p className="text-xl font-semibold text-white">{value}</p>
        </motion.div>
    );
}
