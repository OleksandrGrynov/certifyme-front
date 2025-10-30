import { useState, useEffect } from "react";
import { Search, Trash2, FileCheck2, RefreshCw, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filtered, setFiltered] = useState([]);
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    // 👤 Зручні хелпери
    const getUserName = (c) =>
        c?.user?.name || c?.user_name || (c?.user_id ? `#${c.user_id}` : "-");
    const getUserEmail = (c) => c?.user?.email || c?.user_email || "-";

    // 🔹 Завантаження сертифікатів
    const loadCertificates = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`http://localhost:5000/api/admin/certificates?lang=${lang}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.success) {
                setCertificates(data.certificates || []);
                setFiltered(data.certificates || []);
            } else {
                alert("❌ " + (data.message || "Не вдалося отримати сертифікати"));
            }
        } catch (err) {
            console.error("❌ Error loading certificates:", err);
        } finally {
            setLoading(false);
        }
    };

    // 🟢 Ініціалізація
    useEffect(() => {
        loadCertificates();
    }, [lang]);

    // 🔍 Пошук
    useEffect(() => {
        const s = search.toLowerCase();
        setFiltered(
            certificates.filter((c) => {
                const name = (getUserName(c) || "").toLowerCase();
                const email = (getUserEmail(c) || "").toLowerCase();
                const title =
                    (c.test_title || c.test_title_ua || c.test_title_en || "").toLowerCase();
                return name.includes(s) || email.includes(s) || title.includes(s);
            })
        );
    }, [search, certificates]);

    // 🗑️ Видалення
    const handleDelete = async (id) => {
        if (
            !window.confirm(
                lang === "ua"
                    ? "Видалити цей сертифікат?"
                    : "Delete this certificate?"
            )
        )
            return;

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
                alert(lang === "ua" ? "✅ Сертифікат видалено" : "✅ Certificate deleted");
            } else {
                alert("❌ " + (data.message || "Помилка видалення"));
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
                    <FileCheck2 size={22} />
                    {lang === "ua" ? "Сертифікати" : "Certificates"}
                </h2>
                <button
                    onClick={loadCertificates}
                    className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg transition"
                >
                    <RefreshCw size={16} /> {lang === "ua" ? "Оновити" : "Refresh"}
                </button>
            </div>

            {/* Пошук */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder={
                        lang === "ua"
                            ? "Пошук за ім’ям, email або тестом..."
                            : "Search by name, email or test..."
                    }
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
                        <th className="p-3">{lang === "ua" ? "Користувач" : "User"}</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">{lang === "ua" ? "Тест" : "Test"}</th>
                        <th className="p-3">% {lang === "ua" ? "Успіху" : "Score"}</th>
                        <th className="p-3">{lang === "ua" ? "Дата видачі" : "Issued"}</th>
                        <th className="p-3">{lang === "ua" ? "Дійсний до" : "Valid until"}</th>
                        <th className="p-3 text-center">{lang === "ua" ? "Дії" : "Actions"}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-400">
                                {lang === "ua" ? "Завантаження..." : "Loading..."}
                            </td>
                        </tr>
                    ) : filtered.length === 0 ? (
                        <tr>
                            <td colSpan={8} className="text-center py-10 text-gray-500">
                                {lang === "ua"
                                    ? "Немає сертифікатів"
                                    : "No certificates found"}
                            </td>
                        </tr>
                    ) : (
                        filtered.map((c) => (
                            <tr
                                key={c.id}
                                className="border-b border-gray-800 hover:bg-gray-800/40 transition"
                            >
                                <td className="p-3 text-gray-400">{c.id}</td>
                                <td className="p-3 text-gray-300">{getUserName(c)}</td>
                                <td className="p-3 text-gray-400">{getUserEmail(c)}</td>
                                <td className="p-3 text-gray-200 font-medium">
                                    {c.test_title ||
                                        (lang === "en" ? c.test_title_en : c.test_title_ua)}
                                </td>
                                <td className="p-3 text-center text-green-400 font-semibold">
                                    {c.percent || 0}%
                                </td>
                                <td className="p-3 text-gray-400">
                                    {c.issued
                                        ? new Date(c.issued).toLocaleDateString(
                                            lang === "ua" ? "uk-UA" : "en-US"
                                        )
                                        : "-"}
                                </td>
                                <td className="p-3 text-gray-400">
                                    {c.expires
                                        ? new Date(c.expires).toLocaleDateString(
                                            lang === "ua" ? "uk-UA" : "en-US"
                                        )
                                        : "-"}
                                </td>
                                <td className="p-3 text-center flex justify-center gap-3">
                                    <button
                                        onClick={() => handleView(c.cert_id)}
                                        title={
                                            lang === "ua"
                                                ? "Переглянути сертифікат"
                                                : "View certificate"
                                        }
                                        className="text-blue-400 hover:text-blue-600 transition"
                                    >
                                        <ExternalLink size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        title={
                                            lang === "ua"
                                                ? "Видалити"
                                                : "Delete"
                                        }
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
