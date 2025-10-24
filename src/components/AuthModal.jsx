import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function AuthModal({ isOpen, onClose }) {
    const { t } = useTranslation();
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const endpoint = isRegister
                ? "http://localhost:5000/api/users/register"
                : "http://localhost:5000/api/users/login";

            const body = isRegister
                ? {
                    first_name: formData.first_name,
                    last_name: formData.last_name,
                    email: formData.email,
                    password: formData.password,
                }
                : {
                    email: formData.email,
                    password: formData.password,
                };

            const res = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("isAuthenticated", "true");
                alert(isRegister ? "✅ Реєстрація успішна!" : "✅ Вхід успішний!");
                onClose();
                window.location.reload();
            } else {
                alert(data.message || "❌ Помилка входу");
            }
        } catch (err) {
            console.error(err);
            alert("❌ Помилка з'єднання з сервером");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="relative bg-gray-900 text-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-semibold text-center mb-4">
                    {isRegister ? t("register_title") : t("login_title")}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && (
                        <>
                            <input
                                name="first_name"
                                type="text"
                                placeholder={t("form_first_name") || "Ім’я"}
                                value={formData.first_name}
                                onChange={handleChange}
                                className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600"
                                required
                            />
                            <input
                                name="last_name"
                                type="text"
                                placeholder={t("form_last_name") || "Прізвище"}
                                value={formData.last_name}
                                onChange={handleChange}
                                className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600"
                                required
                            />
                        </>
                    )}

                    <input
                        name="email"
                        type="email"
                        placeholder={t("form_email")}
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600"
                        required
                    />

                    <input
                        name="password"
                        type="password"
                        placeholder={t("form_password")}
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-gray-800 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-600"
                        required
                    />

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg"
                    >
                        {loading
                            ? t("loading")
                            : isRegister
                                ? t("register_button")
                                : t("login_button")}
                    </button>
                </form>

                <p className="text-sm text-center mt-4">
                    {isRegister ? t("already_account") : t("no_account")}{" "}
                    <button
                        type="button"
                        onClick={() => setIsRegister(!isRegister)}
                        className="text-green-500 hover:underline"
                    >
                        {isRegister ? t("login_link") : t("register_link")}
                    </button>
                </p>
            </div>
        </div>
    );
}
