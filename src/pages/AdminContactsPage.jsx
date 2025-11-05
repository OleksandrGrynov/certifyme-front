import { useEffect, useState, useRef, useCallback } from "react";
import { Trash, MessageCircle, Mail, Phone, Send, Check, Clock, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminContactsPage() {
  const { i18n } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const [contacts, setContacts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState([]);
  const prevIdsRef = useRef([]);
  const audioRef = useRef(null);

  // confirm modal state
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: tLabel("Підтвердження", "Confirmation"),
    message: "",
    confirmText: tLabel("Видалити", "Delete"),
    cancelText: tLabel("Скасувати", "Cancel"),
    resolve: null,
  });

  const confirmAsync = ({ title, message, confirmText, cancelText }) =>
    new Promise((resolve) =>
      setConfirmState({
        open: true,
        title: title || confirmState.title,
        message: message || "",
        confirmText: confirmText || confirmState.confirmText,
        cancelText: cancelText || confirmState.cancelText,
        resolve,
      })
    );

  const closeConfirm = (result) => {
    if (confirmState.resolve) confirmState.resolve(result);
    setConfirmState((s) => ({ ...s, open: false }));
  };

  const fetchContacts = useCallback(() => {
    fetch("http://localhost:5000/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;

        const prevIds = prevIdsRef.current;
        const newOnes = data.filter((c) => !prevIds.includes(c.id)).map((c) => c.id);

        if (newOnes.length > 0) {
          playSound();
          setNewIds(newOnes);
          setTimeout(() => setNewIds([]), 3000);
        }

        prevIdsRef.current = data.map((c) => c.id);
        setContacts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching contacts:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchContacts();
    const interval = setInterval(fetchContacts, 5000);
    return () => clearInterval(interval);
  }, [fetchContacts]);

  const playSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirmAsync({
      title: tLabel("Підтвердження", "Confirmation"),
      message: tLabel("Ви впевнені, що хочете видалити цю заявку?", "Are you sure you want to delete this request?"),
      confirmText: tLabel("Видалити", "Delete"),
      cancelText: tLabel("Скасувати", "Cancel"),
    });
    if (!ok) return;
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
      console.error("❌ Error updating status:", err);
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
    return (
      <p className="text-center text-gray-400">
        ⌛ {tLabel("Завантаження заявок...", "Loading requests...")}
      </p>
    );

  const getStatusBadge = (status) => {
    const common = "px-2 py-0.5 text-xs rounded-full";
    switch (status) {
      case "new":
        return (
          <span className={`${common} bg-blue-900/40 text-blue-400`}>
            🔵 {tLabel("Нова", "New")}
          </span>
        );
      case "in_progress":
        return (
          <span className={`${common} bg-yellow-900/40 text-yellow-400`}>
            🟡 {tLabel("В обробці", "In progress")}
          </span>
        );
      case "confirmed":
        return (
          <span className={`${common} bg-green-900/40 text-green-400`}>
            🟢 {tLabel("Підтверджено", "Confirmed")}
          </span>
        );
      default:
        return null;
    }
  };

  const renderSection = (uaTitle, enTitle, list, color) => (
    <div className="mb-10">
      <h3 className={`text-lg font-semibold mb-3 ${color}`}>
        {tLabel(uaTitle, enTitle)}{" "}
        <span className="text-gray-400">({list.length})</span>
      </h3>
      {list.length === 0 ? (
        <p className="text-gray-500 text-sm italic">
          {tLabel("Немає заявок", "No requests")}
        </p>
      ) : (
        <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div
              key={c.id}
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
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock size={12} className="opacity-70" />
                  {c.created_at ? (
                    <span>
                   {new Date(c.created_at).toLocaleString(
                    i18n.language === "ua" ? "uk-UA" : "en-US",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                       minute: "2-digit",
                    }
                  )}
                  </span>
                  ) : (
                    <span>—</span>
                  )}
                </div>


                <div className="flex gap-2">
                  {c.status === "new" && (
                    <button
                      onClick={() => handleStatusChange(c.id, "in_progress")}
                      className="bg-yellow-500 hover:bg-yellow-600 text-xs px-2 py-1 rounded text-black flex items-center gap-1"
                    >
                      <Clock size={12} />{" "}
                      {tLabel("В обробку", "Set in progress")}
                    </button>
                  )}
                  {c.status === "in_progress" && (
                    <button
                      onClick={() => handleStatusChange(c.id, "confirmed")}
                      className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1 rounded text-black flex items-center gap-1"
                    >
                      <Check size={12} />{" "}
                      {tLabel("Підтвердити", "Confirm")}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="bg-red-600 hover:bg-red-700 text-xs px-2 py-1 rounded flex items-center gap-1"
                  >
                    <Trash size={12} /> {tLabel("Видалити", "Delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <audio ref={audioRef} src="/notify.mp3" preload="auto" />

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-green-400 flex items-center gap-2">
          <MessageCircle size={22} />{" "}
          {tLabel("Заявки користувачів", "User Requests")}
          <span className="ml-2 bg-green-700/30 text-green-300 text-xs px-2 py-0.5 rounded-full">
            {contacts.length}
          </span>
        </h2>

        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={tLabel("Пошук заявок...", "Search requests...")}
          className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-200 focus:ring-2 focus:ring-green-600"
        />
      </div>

      {renderSection("Нові заявки", "New requests", grouped.new, "text-blue-400")}
      {renderSection("В обробці", "In progress", grouped.in_progress, "text-yellow-400")}
      {renderSection("Підтверджені", "Confirmed", grouped.confirmed, "text-green-400")}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        onCancel={() => closeConfirm(false)}
        onConfirm={() => closeConfirm(true)}
      />
    </div>
  );
}
