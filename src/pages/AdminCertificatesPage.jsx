import { useState, useEffect } from "react";
import { Search, Trash2, FileCheck2, RefreshCw, ExternalLink } from "lucide-react";

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filtered, setFiltered] = useState([]);

    // 🔹 Завантаження сертифікатів
    const loadCertificates = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch("http://localhost:5000/api/admin/certificates", {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setCertificates(data.certificates || []);
                setFiltered(data.certificates || []);
            } else {
                alert("❌ Не вдалося отримати сертифікати");
            }
        } catch (err) {
            console.error("❌ Error loading certificates:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCertificates();
    }, []);

    // 🔍 Пошук
    useEffect(() => {
        const s = search.toLowerCase();
        setFiltered(
            certificates.filter(
                (c) =>
                    c.user_name?.toLowerCase().includes(s) ||
                    c.user_email?.toLowerCase().includes(s) ||
                    c.test_title?.toLowerCase().includes(s)
            )
        );
    }, [search, certificates]);

    // 🗑️ Видалення
    const handleDelete = async (id) => {
        if (!window.confirm("Видалити цей сертифікат?")) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:5000/api/admin/certificates/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setCertificates((prev) => prev.filter((c) => c.id !== id));
                setFiltered((prev) => prev.filter((c) => c.id !== id));
                alert("✅ Сертифікат видалено");
            } else {
                alert("❌ " + data.message);
            }
        } catch (err) {
            console.error("❌ Error deleting certificate:", err);
        }
    };

    // 🔗 Перегляд PDF / перевірка сертифікату
    const handleView = (certId) => {
        window.open(`/verify/${certId}`, "_blank");
    };

    return (
        <div className="space-y-6">
            {/* Заголовок */}
            <div className="flex justify-between items-center">
                <h2 className="text-xl text-green-400 font-semibold flex items-center gap-2">
                    <FileCheck2 size={22} /> Сертифікати
                </h2>
                <button
                    onClick={loadCertificates}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition"
                >
                    <RefreshCw size={16} /> Оновити
                </button>
            </div>

            {/* Пошук */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Пошук за ім’ям, email або тестом..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 pr-3 py-2 w-full bg-gray-800 text-gray-200 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                />
            </div>

            {/* Таблиця */}
            <div className="overflow-x-auto bg-gray-900/70 border border-gray-800 rounded-xl">
                <table className="w-full text-left">
                    <thead>
                    <tr className="bg-gray-800 text-green-400 text-sm uppercase">
                        <th className="p-3">ID</th>
                        <th className="p-3">Користувач</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Тест</th>
                        <th className="p-3">% Успіху</th>
                        <th className="p-3">Дата видачі</th>
                        <th className="p-3">Дійсний до</th>
                        <th className="p-3 text-center">Дії</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-400">
                                Завантаження...
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-500">
                                Немає сертифікатів
                            </td>
                        </tr>
                    ) : (
                        filtered.map((c) => (
                            <tr
                                key={c.id}
                                className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                            >
                                <td className="p-3 text-gray-400">{c.id}</td>
                                <td className="p-3 text-gray-300">{c.user_name}</td>
                                <td className="p-3 text-gray-400">{c.user_email || "-"}</td>
                                <td className="p-3 text-gray-200 font-medium">
                                    {c.test_title}
                                </td>
                                <td className="p-3 text-center text-green-400 font-semibold">
                                    {c.percent || 0}%
                                </td>
                                <td className="p-3 text-gray-400">
                                    {c.issued
                                        ? new Date(c.issued).toLocaleDateString("uk-UA")
                                        : "-"}
                                </td>
                                <td className="p-3 text-gray-400">
                                    {c.expires
                                        ? new Date(c.expires).toLocaleDateString("uk-UA")
                                        : "-"}
                                </td>
                                <td className="p-3 text-center flex justify-center gap-3">
                                    <button
                                        onClick={() => handleView(c.cert_id)}
                                        title="Переглянути сертифікат"
                                        className="text-blue-400 hover:text-blue-600 transition"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        title="Видалити"
                                        className="text-red-500 hover:text-red-700 transition"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
