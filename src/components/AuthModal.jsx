import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GoogleLogin } from "@react-oauth/google";
import { Mail, Lock, Eye, EyeOff, User, LogIn } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import OtpVerifyModal from "./OtpVerifyModal"; // 👈 додаємо компонент OTP з попереднього кроку

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
    const [showPassword, setShowPassword] = useState(false);
    const [showSetPassword, setShowSetPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");

    // 🔹 новий стан для OTP-вікна
    const [showOtpModal, setShowOtpModal] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isRegister) {
                // 🔸 Реєстрація з OTP
                const res = await fetch("http://localhost:5000/api/users/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();

                if (res.ok) {
                    alert(data.message);
                    // відкриваємо OTP модалку
                    setShowOtpModal(true);
                } else {
                    alert(data.message || "Помилка реєстрації");
                }
            } else {
                // 🔹 Логін звичайний
                const res = await fetch("http://localhost:5000/api/users/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });
                const data = await res.json();

                if (data.success) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("isAuthenticated", "true");
                    onClose();
                    window.location.reload();
                } else alert(data.message || t("error_login"));
            }
        } catch (err) {
            alert(t("error_connection"));
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const token = credentialResponse.credential;
            const res = await fetch("http://localhost:5000/api/auth/google-token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            if (data.success) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("isAuthenticated", "true");
                if (data.user && (!data.user.password || data.user.password === "")) {
                    setShowSetPassword(true);
                } else {
                    onClose();
                    window.location.reload();
                }
            } else alert(t("error_google"));
        } catch {
            alert(t("error_google"));
        }
    };

    const handleSetPassword = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/users/set-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ newPassword }),
            });
            const result = await res.json();
            if (result.success) {
                alert(t("password_created"));
                setShowSetPassword(false);
                onClose();
                window.location.reload();
            } else alert(result.message || t("error_general"));
        } catch {
            alert(t("error_connection"));
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
                <AnimatePresence>
                    <motion.div
                        key="auth"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 10 }}
                        className="relative bg-gray-900 text-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-md"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                        >
                            ✕
                        </button>

                        <h2 className="text-3xl font-bold text-center mb-2 text-green-500 flex items-center justify-center gap-2">
                            {isRegister ? (
                                <>
                                    <User size={22} /> {t("register_title")}
                                </>
                            ) : (
                                <>
                                    <LogIn size={22} /> {t("login_title")}
                                </>
                            )}
                        </h2>
                        <p className="text-sm text-gray-400 text-center mb-6">
                            {isRegister ? t("register_subtitle") : t("login_subtitle")}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {isRegister && (
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <User size={18} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            name="first_name"
                                            type="text"
                                            placeholder={t("form_first_name")}
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                                            required
                                        />
                                    </div>
                                    <div className="relative flex-1">
                                        <User size={18} className="absolute left-3 top-3 text-gray-400" />
                                        <input
                                            name="last_name"
                                            type="text"
                                            placeholder={t("form_last_name")}
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className="w-full bg-gray-800 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="email"
                                    type="email"
                                    placeholder={t("form_email")}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                                    required
                                />
                            </div>

                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder={t("form_password")}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-gray-800 rounded-lg pl-10 pr-10 py-2 focus:ring-2 focus:ring-green-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg font-semibold shadow-lg"
                            >
                                {loading
                                    ? t("loading")
                                    : isRegister
                                        ? t("register_button")
                                        : t("login_button")}
                            </button>
                        </form>

                        <div className="flex items-center my-6">
                            <div className="flex-1 h-px bg-gray-700"></div>
                            <span className="px-3 text-gray-500 text-sm">{t("or")}</span>
                            <div className="flex-1 h-px bg-gray-700"></div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => alert(t("error_google"))}
                            />
                        </div>

                        <p className="text-sm text-center mt-6 text-gray-400">
                            {isRegister ? t("already_account") : t("no_account")}{" "}
                            <button
                                type="button"
                                onClick={() => setIsRegister(!isRegister)}
                                className="text-green-500 hover:underline font-semibold"
                            >
                                {isRegister ? t("login_link") : t("register_link")}
                            </button>
                        </p>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* 🔹 Модалка OTP підтвердження */}
            {showOtpModal && (
                <OtpVerifyModal
                    email={formData.email}
                    onSuccess={(user) => {
                        console.log("✅ Успішна авторизація:", user);
                        onClose();
                        window.location.reload();
                    }}
                    onClose={() => setShowOtpModal(false)}
                />
            )}

            {/* 🔹 Модалка створення пароля після Google */}
            {showSetPassword && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] backdrop-blur-sm">
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gray-900 text-gray-200 rounded-2xl shadow-2xl p-8 w-full max-w-sm"
                    >
                        <h3 className="text-xl font-semibold text-center mb-4 text-green-400">
                            {t("create_password_title")}
                        </h3>

                        <input
                            type="password"
                            placeholder={t("create_password_placeholder")}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-800 rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-green-600"
                        />

                        <button
                            onClick={handleSetPassword}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg"
                        >
                            {t("save_password")}
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}
