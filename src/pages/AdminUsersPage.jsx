import { useState, useEffect } from "react";
import { Trash } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import ConfirmModal from "../components/ConfirmModal";
import { API_URL } from "../lib/apiClient";

export default function AdminUsersPage() {
    const { i18n } = useTranslation();
    const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

    const [users, setUsers] = useState([]);

    
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

    
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch(`${API_URL}/api/admin/users`, {
            headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((data) => {
              if (data.success) setUsers(data.users);
          })
          .catch((err) => console.error("❌ Error loading users:", err));
    }, []);

    
    const handleDeleteUser = async (id, email) => {
        const ok = await confirmAsync({
            title: tLabel("Підтвердження", "Confirmation"),
            message: tLabel(
              `Ви справді хочете видалити користувача ${email}?`,
              `Are you sure you want to delete user ${email}?`
            ),
            confirmText: tLabel("Видалити", "Delete"),
            cancelText: tLabel("Скасувати", "Cancel"),
        });
        if (!ok) return;

        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.success) {
            setUsers((prev) => prev.filter((u) => u.id !== id));
            toast.success(tLabel("Користувача видалено!", "User deleted successfully!"));
        } else {
            toast.error("❌ " + data.message);
        }
    };

    
    const handleChangeRole = async (id, newRole) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/admin/users/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ role: newRole }),
        });
        const data = await res.json();

        if (data.success) {
            setUsers((prev) =>
              prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
            );
            toast.success(tLabel("Роль оновлено", "Role updated"));
        } else {
            toast.error(
              "❌ " + (data.message || tLabel("Помилка сервера", "Server error"))
            );
        }
    };

    return (
      <div>
          <h2 className="text-xl mb-2 text-green-400">
              {tLabel("Користувачі", "Users")}
          </h2>

          <table className="w-full border-collapse text-left mb-8">
              <thead>
              <tr className="bg-green-900/30 text-green-400">
                  <th className="p-3">ID</th>
                  <th className="p-3">{tLabel("Ім’я", "Name")}</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">{tLabel("Роль", "Role")}</th>
                  <th className="p-3">{tLabel("Створено", "Created at")}</th>
                  <th className="p-3 text-center">{tLabel("Дія", "Action")}</th>
              </tr>
              </thead>

              <tbody>
              {users.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-gray-700 hover:bg-gray-800/50 transition"
                >
                    <td className="p-3">{u.id}</td>
                    <td className="p-3">
                        {u.full_name || `${u.first_name || ""} ${u.last_name || ""}`}
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3">
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value)}
                          className="bg-gray-800 text-green-400 p-1 rounded"
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>
                    </td>
                    <td className="p-3">
                        {new Date(u.created_at).toLocaleDateString(
                          i18n.language === "ua" ? "uk-UA" : "en-US"
                        )}
                    </td>
                    <td className="p-3 text-center">
                        {u.role !== "admin" ? (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center justify-center gap-1 mx-auto"
                          >
                              <Trash size={16} /> {tLabel("Видалити", "Delete")}
                          </button>
                        ) : (
                          <span className="text-gray-500 italic">
                    {tLabel("Адміністратор", "Administrator")}
                  </span>
                        )}
                    </td>
                </tr>
              ))}
              </tbody>
          </table>

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
