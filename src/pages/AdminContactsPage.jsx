import { useEffect, useState, useRef } from "react";
import {
    Trash,
    MessageCircle,
    Mail,
    Phone,
    Send,
    Check,
    Clock,
    User
} from "lucide-react";
import { motion } from "framer-motion";

export default function AdminContactsPage() {
    const [contacts, setContacts] = useState([]);
    const [filter, setFilter] = useState("");
    const [loading, setLoading] = useState(true);
    const [newIds, setNewIds] = useState([]); // 💡 для підсвічування нових
    const prevIdsRef = useRef([]); // 🧠 зберігаємо попередні ID
    const audioRef = useRef(null); // 🔊 звук

    // Автооновлення
    useEffect(() => {
        fetchContacts();
        const interval = setInterval(fetchContacts, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchContacts = () => {
        fetch("http://localhost:5000/api/contacts")
            .then((r) => r.json())
            .then((data) => {
                if (!Array.isArray(data)) return;

                const prevIds = prevIdsRef.current;
                const newOnes = data
                    .filter((c) => !prevIds.includes(c.id))
                    .map((c) => c.id);

                if (newOnes.length > 0) {
                    // 🔔 нові заявки → звук + підсвічування
                    playSound();
                    setNewIds(newOnes);
                    setTimeout(() => setNewIds([]), 3000);
                }

                prevIdsRef.current = data.map((c) => c.id);
                setContacts(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error("❌ Помилка отримання контактів:", err);
                setLoading(false);
            });
    };

    const playSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Видалити цю заявку?")) return;
        await fetch(`http://localhost:5000/api/contacts/${id}`, { method: "DELETE" });
        setContacts((prev) => prev.filter((c) => c.id !== id));
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`http://localhost:5000/api/contacts/${id}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            const data = await res.json();
            if (data.success) {
                setContacts((prev) =>
                    prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
                );
            }
        } catch (err) {
            console.error("❌ Помилка оновлення статусу:", err);
        }
    };

    const filtered = contacts.filter((c) => {
        const s = filter.toLowerCase();
        return (
            c.name.toLowerCase().includes(s) ||
            c.email.toLowerCase().includes(s) ||
            c.phone.toLowerCase().includes(s) ||
            (c.telegram && c.telegram.toLowerCase().includes(s))
        );
    });

    const grouped = {
        new: filtered.filter((c) => c.status === "new"),
        in_progress: filtered.filter((c) => c.status === "in_progress"),
        confirmed: filtered.filter((c) => c.status === "confirmed"),
    };

    if (loading)
        return <p className="text-center text-gray-400">⏳ Завантаження заявок...</p>;

    const getStatusBadge = (status) => {
        const common = "px-2 py-0.5 text-xs rounded-full";
        switch (status) {
            case "new":
                return <span className={`${common} bg-blue-900/40 text-blue-400`}>🔵 Нова</span>;
            case "in_progress":
                return <span className={`${common} bg-yellow-900/40 text-yellow-400`}>🟡 У процесі</span>;
            case "confirmed":
                return <span className={`${common} bg-green-900/40 text-green-400`}>🟢 Підтверджена</span>;
            default:
                return null;
        }
    };

    const renderSection = (title, list, color) => (
        <div className="mb-10">
            <h3 className={`text-lg font-semibold mb-3 ${color}`}>
                {title} <span className="text-gray-400">({list.length})</span>
            </h3>
            {list.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Немає заявок</p>
            ) : (
                <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((c) => (
                        <motion.div
                            key={c.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                            className={`relative bg-gray-900 border rounded-xl p-5 flex flex-col justify-between transition-all duration-500 ${
                                newIds.includes(c.id)
                                    ? "border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                                    : "border-gray-700 hover:border-green-500"
                            }`}
                        >
                            <div className="absolute top-3 right-3">{getStatusBadge(c.status)}</div>

                            <div>
                                <h4 className="text-green-400 font-semibold text-lg flex items-center gap-2">
                                    <User size={16} /> {c.name}
                                </h4>
                                <p className="flex items-center gap-2 text-gray-300 text-sm mt-1">
                                    <Mail size={14} className="text-blue-400" />
                                    <a href={`mailto:${c.email}`} className="hover:text-blue-300">
                                        {c.email}
                                    </a>
                                </p>
                                <p className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Phone size={14} className="text-pink-400" />
                                    <a
                                        href={`tel:${c.phone.replace(/\s/g, "")}`}
                                        className="hover:text-pink-300"
                                    >
                                        {c.phone}
                                    </a>
                                </p>
                                {c.telegram && (
                                    <p className="flex items-center gap-2 text-gray-300 text-sm">
                                        <Send size={14} className="text-sky-400" />
                                        <a
                                            href={`https://t.me/${c.telegram.replace("@", "")}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hover:text-sky-300"
                                        >
                                            {c.telegram}
                                        </a>
                                    </p>
                                )}
                                {c.message && (
                                    <p className="text-gray-400 text-sm mt-2 border-t border-gray-700 pt-2">
                                        “{c.message}”
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-700">
                                <span className="text-xs text-gray-500">
                                    {new Date(c.created_at).toLocaleString("uk-UA")}
                                </span>

                                <div className="flex gap-2">
                                    {c.status === "new" && (
                                        <button
                                            onClick={() => handleStatusChange(c.id, "in_progress")}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-xs px-2 py-1 rounded text-black flex items-center gap-1"
                                        >
                                            <Clock size={12} /> У процесі
                                        </button>
                                    )}
                                    {c.status === "in_progress" && (
                                        <button
                                            onClick={() => handleStatusChange(c.id, "confirmed")}
                                            className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1 rounded text-black flex items-center gap-1"
                                        >
                                            <Check size={12} /> Підтвердити
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                                    >
                                        <Trash size={12} /> Видалити
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            {/* 🔊 Аудіо для сповіщень */}
            <audio ref={audioRef} src="/notify.mp3" preload="auto" />

            {/* 🔍 Пошук */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
                    <MessageCircle size={22} /> Заявки користувачів
                    <span className="ml-2 bg-green-700/30 text-green-300 text-xs px-2 py-0.5 rounded-full">
                        {contacts.length}
                    </span>
                </h2>

                <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Пошук за ім’ям, email, телефоном або Telegram..."
                    className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 w-72 focus:border-green-500 focus:outline-none"
                />
            </div>

            {renderSection("🆕 Нові", grouped.new, "text-blue-400")}
            {renderSection("⏳ У процесі", grouped.in_progress, "text-yellow-400")}
            {renderSection("✅ Підтверджені", grouped.confirmed, "text-green-400")}
        </div>
    );
}
