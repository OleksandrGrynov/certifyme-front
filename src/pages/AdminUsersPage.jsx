import { useState, useEffect } from "react";
import { Trash } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function AdminUsersPage() {
    const { t, i18n } = useTranslation();
    const [users, setUsers] = useState([]);

    // завантаження користувачів
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.success) setUsers(data.users);
            })
            .catch((err) => console.error("❌ Error loading users:", err));
    }, []);

    // видалення
    const handleDeleteUser = async (id, email) => {
        if (!window.confirm(`${t("admin.confirmDeleteUser")} ${email}?`)) return;
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
            setUsers((prev) => prev.filter((u) => u.id !== id));
            alert(t("admin.userDeleted"));
        } else {
            alert("❌ " + data.message);
        }
    };

    // зміна ролі
    const handleChangeRole = async (id, newRole) => {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
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
            alert(t("admin.roleUpdated"));
        }
    };

    return (
        <div>
            <h2 className="text-xl mb-2 text-green-400">{t("admin.users")}</h2>
            <table className="w-full border-collapse text-left mb-8">
                <thead>
                <tr className="bg-green-900/30 text-green-400">
                    <th className="p-3">ID</th>
                    <th className="p-3">{t("common.name")}</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">{t("common.role")}</th>
                    <th className="p-3">{t("common.createdAt")}</th>
                    <th className="p-3 text-center">{t("common.action")}</th>
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
                            {u.full_name ||
                                `${u.first_name || ""} ${u.last_name || ""}`}
                        </td>
                        <td className="p-3">{u.email}</td>
                        <td className="p-3">
                            <select
                                value={u.role}
                                onChange={(e) =>
                                    handleChangeRole(u.id, e.target.value)
                                }
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
                                    onClick={() =>
                                        handleDeleteUser(u.id, u.email)
                                    }
                                    className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded flex items-center justify-center gap-1 mx-auto"
                                >
                                    <Trash size={16} /> {t("common.delete")}
                                </button>
                            ) : (
                                <span className="text-gray-500 italic">
                                        {t("admin.isAdmin")}
                                    </span>
                            )}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
