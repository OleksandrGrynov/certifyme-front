import { useState, useEffect, useCallback } from "react";
import {
    Search,
    Trash2,
    FileCheck2,
    RefreshCw,
    ExternalLink,
    Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminCertificatesPage() {
    const [certificates, setCertificates] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [filtered, setFiltered] = useState([]);
    const { i18n } = useTranslation();
    const lang = i18n.language === "en" ? "en" : "ua";

    // confirm modal
    const [confirmState, setConfirmState] = useState({
        open: false,
        title: lang === "ua" ? "Підтвердження" : "Confirm",
        message: "",
        confirmText: lang === "ua" ? "Видалити" : "Delete",
        cancelText: lang === "ua" ? "Скасувати" : "Cancel",
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

    // helpers
    const getUserName = (c) =>
      c?.user?.name || c?.user_name || (c?.user_id ? `#${c.user_id}` : "-");
    const getUserEmail = (c) => c?.user?.email || c?.user_email || "-";

    // load
    const loadCertificates = useCallback(async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `http://localhost:5000/api/admin/certificates?lang=${lang}`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (data.success) {
                setCertificates(data.certificates || []);
                setFiltered(data.certificates || []);
            } else {
                toast.error(
                  "❌ " +
                  (data.message ||
                    (lang === "ua"
                      ? "Не вдалося отримати сертифікати"
                      : "Failed to fetch certificates"))
                );
            }
        } catch (err) {
            console.error("❌ Error loading certificates:", err);
            toast.error(
              "❌ " + (lang === "ua" ? "Помилка завантаження" : "Load error")
            );
        } finally {
            setLoading(false);
        }
    }, [lang]);

    useEffect(() => {
        loadCertificates();
    }, [loadCertificates]);

    // search
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

    // delete
    const handleDelete = async (id) => {
        const ok = await confirmAsync({
            title: lang === "ua" ? "Видалення сертифіката" : "Delete certificate",
            message:
              lang === "ua" ? "Видалити цей сертифікат?" : "Delete this certificate?",
            confirmText: lang === "ua" ? "Видалити" : "Delete",
            cancelText: lang === "ua" ? "Скасувати" : "Cancel",
        });
        if (!ok) return;

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
              `http://localhost:5000/api/admin/certificates/${id}`,
              {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
              }
            );
            const data = await res.json();
            if (data.success) {
                setCertificates((prev) => prev.filter((c) => c.id !== id));
                setFiltered((prev) => prev.filter((c) => c.id !== id));
                toast.success(
                  lang === "ua" ? "✅ Сертифікат видалено" : "✅ Certificate deleted"
                );
            } else {
                toast.error(
                  "❌ " +
                  (data.message ||
                    (lang === "ua" ? "Помилка видалення" : "Delete error"))
                );
            }
        } catch (err) {
            console.error("❌ Error deleting certificate:", err);
            toast.error(
              "❌ " + (lang === "ua" ? "Помилка видалення" : "Delete error")
            );
        }
    };

    // view PDF
    const handleView = (certId) => {
        window.open(`/verify/${certId}`, "_blank");
    };

    // update expiration
    const handleUpdateDate = async (id, newDate) => {
        if (!newDate) return;
        const token = localStorage.getItem("token");

        try {
            const res = await fetch(`http://localhost:5000/api/certificates/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ expires: newDate }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success(
                  lang === "ua" ? "✅ Дата дії оновлена" : "✅ Expiration date updated"
                );
                setCertificates((prev) =>
                  prev.map((c) => (c.id === id ? { ...c, expires: newDate } : c))
                );
            } else {
                toast.error("❌ " + (data.message || "Error updating date"));
            }
        } catch (err) {
            console.error("❌ Error updating expiration date:", err);
            toast.error("❌ Server error");
        }
    };

    const isExpired = (expires) =>
      expires ? new Date(expires) < new Date() : false;

    return (
      <div className="space-y-6">
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
                            {lang === "ua" ? "Немає сертифікатів" : "No certificates found"}
                        </td>
                    </tr>
                  ) : (
                    filtered.map((c) => (
                      <tr
                        key={c.id}
                        className={`border-b border-gray-800 hover:bg-gray-800/40 transition ${
                          isExpired(c.expires) ? "opacity-70" : ""
                        }`}
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
                              <div className="flex items-center justify-between gap-2 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 w-40">
                                  <input
                                    type="date"
                                    defaultValue={
                                        c.expires
                                          ? new Date(c.expires).toISOString().split("T")[0]
                                          : ""
                                    }
                                    onChange={(e) =>
                                      handleUpdateDate(c.id, e.target.value)
                                    }
                                    className="bg-transparent text-gray-200 text-sm outline-none w-full cursor-pointer"
                                  />
                                  <Calendar size={16} className="text-gray-400" />
                              </div>
                              {isExpired(c.expires) && (
                                <div className="text-red-500 text-xs font-semibold mt-1">
                                    {lang === "ua" ? "Неактивний" : "Inactive"}
                                </div>
                              )}
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
                                title={lang === "ua" ? "Видалити" : "Delete"}
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
