import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Save, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [user, setUser] = useState({
        first_name: "",
        last_name: "",
        email: "",
        joined: "",
    });
    const [isEditing, setIsEditing] = useState(false);
    const [newData, setNewData] = useState({
        first_name: "",
        last_name: "",
        email: "",
    });
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
    const token = localStorage.getItem("token");

    // 🔹 Отримати поточні дані користувача
    useEffect(() => {
        const isAuth = localStorage.getItem("isAuthenticated") === "true";
        if (!isAuth) {
            navigate("/");
            return;
        }

        fetch("http://localhost:5000/api/users/me", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success && data.user) {
                    const u = {
                        first_name: data.user.first_name,
                        last_name: data.user.last_name,
                        email: data.user.email,
                        joined: new Date(data.user.created_at).toLocaleDateString("uk-UA"),
                    };
                    setUser(u);
                    setNewData({
                        first_name: u.first_name,
                        last_name: u.last_name,
                        email: u.email,
                    });
                }
            })
            .catch((err) => console.error("❌ Profile fetch error:", err));
    }, [navigate, token]);

    // 🔹 Вихід
    const handleLogout = () => {
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("token");
        navigate("/");
        window.location.reload();
    };

    // 🔹 Зберегти зміни профілю
    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!newData.first_name || !newData.last_name || !newData.email) {
                alert("⚠️ Заповніть усі поля!");
                return;
            }

            const res = await fetch("http://localhost:5000/api/users/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    first_name: newData.first_name,
                    last_name: newData.last_name,
                    email: newData.email,
                }),
            });

            const data = await res.json();
            if (data.success) {
                setUser({
                    first_name: data.user.first_name,
                    last_name: data.user.last_name,
                    email: data.user.email,
                    joined: new Date(data.user.created_at).toLocaleDateString("uk-UA"),
                });
                setIsEditing(false);
                alert("✅ Дані успішно оновлено");
            } else {
                alert("❌ " + data.message);
            }
        } catch (err) {
            console.error("Помилка при оновленні:", err);
            alert("❌ Помилка при оновленні");
        }
    };

    // 🔒 Зміна пароля
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            alert(t("passwords_not_match"));
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/users/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    oldPassword: passwords.old,
                    newPassword: passwords.new,
                }),
            });

            const data = await res.json();
            if (data.success) {
                alert(t("password_changed"));
                setPasswords({ old: "", new: "", confirm: "" });
                setShowPasswordForm(false);
            } else {
                alert(data.message || t("update_error"));
            }
        } catch (err) {
            console.error(err);
            alert(t("server_error"));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200 flex items-center justify-center px-4 py-10">
            <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-700">
                <div className="flex justify-center mb-4">
                    <div className="bg-green-700/30 rounded-full p-4">
                        <User size={48} className="text-green-400" />
                    </div>
                </div>

                {isEditing ? (
                    <div className="space-y-3 mb-4">
                        <input
                            type="text"
                            value={newData.first_name}
                            onChange={(e) =>
                                setNewData({ ...newData, first_name: e.target.value })
                            }
                            placeholder={t("form_first_name") || "Ім'я"}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        <input
                            type="text"
                            value={newData.last_name}
                            onChange={(e) =>
                                setNewData({ ...newData, last_name: e.target.value })
                            }
                            placeholder={t("form_last_name") || "Прізвище"}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        <input
                            type="email"
                            value={newData.email}
                            onChange={(e) =>
                                setNewData({ ...newData, email: e.target.value })
                            }
                            placeholder={t("form_email")}
                            className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
                        />
                        <button
                            onClick={handleSave}
                            className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg flex items-center justify-center space-x-2"
                        >
                            <Save size={18} />
                            <span>{t("save_changes")}</span>
                        </button>
                    </div>
                ) : (
                    <>
                        <h2 className="text-2xl font-semibold mb-2">
                            {user.first_name} {user.last_name}
                        </h2>
                        <p className="text-gray-400 mb-4">{user.email}</p>
                        <div className="border-t border-gray-700 pt-4 mt-4 text-sm text-gray-500">
                            <p>
                                {t("member_since")}{" "}
                                <span className="text-gray-300">{user.joined}</span>
                            </p>
                        </div>
                    </>
                )}

                {!isEditing && (
                    <div className="flex flex-col space-y-3 mt-6">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg"
                        >
                            {t("edit_profile")}
                        </button>

                        <button
                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg flex items-center justify-center space-x-2"
                        >
                            <Lock size={18} />
                            <span>{t("change_password")}</span>
                        </button>
                    </div>
                )}

                {showPasswordForm && (
                    <form
                        onSubmit={handlePasswordChange}
                        className="mt-6 text-left space-y-3 border-t border-gray-700 pt-4"
                    >
                        <input
                            type="password"
                            placeholder={t("old_password")}
                            value={passwords.old}
                            onChange={(e) =>
                                setPasswords({ ...passwords, old: e.target.value })
                            }
                            className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                            required
                        />
                        <input
                            type="password"
                            placeholder={t("new_password")}
                            value={passwords.new}
                            onChange={(e) =>
                                setPasswords({ ...passwords, new: e.target.value })
                            }
                            className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                            required
                        />
                        <input
                            type="password"
                            placeholder={t("confirm_password")}
                            value={passwords.confirm}
                            onChange={(e) =>
                                setPasswords({ ...passwords, confirm: e.target.value })
                            }
                            className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-600"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg"
                        >
                            {t("confirm")}
                        </button>
                    </form>
                )}

                <button
                    onClick={handleLogout}
                    className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition flex items-center justify-center space-x-2"
                >
                    <LogOut size={18} />
                    <span>{t("logout")}</span>
                </button>
            </div>
        </div>
    );
}
