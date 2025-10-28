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
import { BarChart3, Users, BookOpen, FileCheck2, UserPlus } from "lucide-react";

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:5000/api/admin/stats", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setStats(data.stats);
            })
            .catch((err) => console.error("❌ Error loading analytics:", err));
    }, []);

    if (!stats)
        return <p className="text-gray-400 text-center mt-10">Завантаження аналітики...</p>;

    return (
        <div className="space-y-8">
            {/* 📊 Карточки */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Users size={22} />} title="Користувачів" value={stats.users} />
                <StatCard icon={<BookOpen size={22} />} title="Тестів" value={stats.tests} />
                <StatCard icon={<FileCheck2 size={22} />} title="Сертифікатів" value={stats.certificates} />
                <StatCard icon={<BarChart3 size={22} />} title="Середній % успіху" value={`${stats.avg_percent}%`} />
            </div>

            {/* 📈 Нові користувачі по місяцях */}
            <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg text-green-400 font-semibold mb-4 flex items-center gap-2">
                    <UserPlus size={20} /> Нові користувачі за останні 12 місяців
                </h3>
                {stats.users_by_month.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.users_by_month}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="month" tick={{ fill: "#aaa", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#aaa" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    borderRadius: "8px",
                                    border: "1px solid #374151",
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="count"
                                stroke="#22c55e"
                                strokeWidth={2.5}
                                dot={{ fill: "#22c55e", r: 5 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500">Недостатньо даних</p>
                )}
            </div>

            {/* 🧾 Сертифікати по тестах */}
            <div className="bg-gray-900/60 p-6 rounded-xl border border-gray-800">
                <h3 className="text-lg text-green-400 font-semibold mb-4">
                    📘 Сертифікати по тестах
                </h3>
                {stats.certs_by_test.length ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={stats.certs_by_test}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                            <XAxis dataKey="test" tick={{ fill: "#aaa", fontSize: 12 }} />
                            <YAxis tick={{ fill: "#aaa" }} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1f2937",
                                    borderRadius: "8px",
                                    border: "1px solid #374151",
                                }}
                            />
                            <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500">Недостатньо даних</p>
                )}
            </div>
        </div>
    );
}

function StatCard({ icon, title, value }) {
    return (
        <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-800 flex flex-col items-center justify-center text-center">
            <div className="text-green-400 mb-2">{icon}</div>
            <h4 className="text-gray-300 text-sm">{title}</h4>
            <p className="text-xl font-semibold text-white">{value}</p>
        </div>
    );
}
