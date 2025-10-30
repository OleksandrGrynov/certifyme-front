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

export default function AdminAnalyticsPage() {
    const [overview, setOverview] = useState(null);
    const [usersDaily, setUsersDaily] = useState([]);
    const [paymentsDaily, setPaymentsDaily] = useState([]);
    const [topTests, setTopTests] = useState([]);
    const [topUsers, setTopUsers] = useState([]);
    const [days, setDays] = useState(30);

    const loadData = async () => {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        const [o, u, p, t, us] = await Promise.all([
            fetch("http://localhost:5000/api/admin/analytics/overview", { headers }).then((r) =>
                r.json()
            ),
            fetch(`http://localhost:5000/api/admin/analytics/daily-users?days=${days}`, {
                headers,
            }).then((r) => r.json()),
            fetch(`http://localhost:5000/api/admin/analytics/payments-daily?days=${days}`, {
                headers,
            }).then((r) => r.json()),
            fetch("http://localhost:5000/api/admin/analytics/top-tests", { headers }).then((r) =>
                r.json()
            ),
            fetch("http://localhost:5000/api/admin/analytics/top-users", { headers }).then((r) =>
                r.json()
            ),
        ]);

        if (o.success) setOverview(o.data);
        if (u.success) setUsersDaily(u.data);
        if (p.success) setPaymentsDaily(p.data);
        if (t.success) setTopTests(t.data);
        if (us.success) setTopUsers(us.data);
    };

    useEffect(() => {
        loadData();
    }, [days]);

    if (!overview)
        return (
            <p className="text-gray-400 text-center mt-10 animate-pulse">
                Завантаження аналітики...
            </p>
        );

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* 🔘 Фільтри */}
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
                        {d} днів
                    </button>
                ))}
            </div>

            {/* 📊 Загальні показники */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <StatCard icon={<Users />} title="Користувачів" value={overview.total_users} />
                <StatCard icon={<BookOpen />} title="Тестів" value={overview.tests} />
                <StatCard icon={<FileCheck2 />} title="Сертифікатів" value={overview.certificates} />
                <StatCard icon={<BarChart3 />} title="Середній % успіху" value={`${overview.avg_percent}%`} />
                <StatCard
                    icon={<DollarSign />}
                    title="Продажі (USD)"
                    value={overview.payments_total.toFixed(2)}
                />
                <StatCard
                    icon={<Calendar />}
                    title="Дата оновлення"
                    value={new Date(overview.last_updated).toLocaleDateString()}
                />
            </div>

            {/* 📈 Нові користувачі */}
            <ChartBox title={`Нові користувачі (${days} днів)`}>
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
            <ChartBox title={`Оплати (${days} днів)`}>
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
            <ChartBox title="Топ тестів">
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topTests}>
                        <XAxis dataKey="test" tick={{ fill: "#aaa", fontSize: 12 }} />
                        <YAxis tick={{ fill: "#aaa" }} />
                        <Tooltip contentStyle={{ background: "#111", borderRadius: 8 }} />
                        <Bar dataKey="count" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </ChartBox>

            {/* 👑 Топ користувачів */}
            <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg text-green-400 font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp size={20} /> Топ користувачів за оплатами
                </h3>
                <table className="w-full text-sm text-gray-300 border-collapse">
                    <thead className="text-green-400 border-b border-gray-700">
                    <tr>
                        <th className="text-left py-2">#</th>
                        <th className="text-left">Ім’я</th>
                        <th>Email</th>
                        <th>Кількість оплат</th>
                        <th>Сума, USD</th>
                    </tr>
                    </thead>
                    <tbody>
                    {topUsers.length ? (
                        topUsers.map((u, i) => (
                            <motion.tr
                                key={u.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={`border-b border-gray-800 ${
                                    i === 0
                                        ? "text-yellow-400"
                                        : i === 1
                                            ? "text-gray-300"
                                            : i === 2
                                                ? "text-amber-700"
                                                : "text-gray-300"
                                }`}
                            >
                                <td className="py-2 font-semibold flex items-center gap-2">
                                    {i < 3 && <Trophy size={14} />}
                                    #{i + 1}
                                </td>
                                <td>{u.name}</td>
                                <td>{u.email}</td>
                                <td>{u.payments}</td>
                                <td>${Number(u.total_usd).toFixed(2)}</td>
                            </motion.tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center text-gray-500 py-4">
                                Немає даних про користувачів
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

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
