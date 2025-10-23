import { useState, useEffect } from "react";
import {
    Menu,
    X,
    Globe,
    Phone,
    User,
    Award,
    Briefcase,
    Trophy,
    Shield,
} from "lucide-react";
import ContactModal from "./ContactModal";
import AuthModal from "./AuthModal";
import { useTranslation } from "react-i18next";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { t, i18n } = useTranslation();

    // 🔹 Перевіряємо, чи користувач авторизований і чи він адмін
    useEffect(() => {
        const token = localStorage.getItem("token");
        const auth = localStorage.getItem("isAuthenticated") === "true";
        setIsAuthenticated(auth);

        if (token) {
            try {
                const payload = JSON.parse(atob(token.split(".")[1]));
                if (payload.role === "admin") setIsAdmin(true);
            } catch (err) {
                console.error("JWT decode error:", err);
            }
        }
    }, []);

    const changeLanguage = (lang) => i18n.changeLanguage(lang);

    const handleProfileClick = () => {
        if (isAuthenticated) {
            window.location.href = "/profile";
        } else {
            setShowAuth(true);
        }
    };

    const handleLoginSuccess = () => {
        setIsAuthenticated(true);
        localStorage.setItem("isAuthenticated", "true");
        setShowAuth(false);
    };

    return (
        <header className="bg-gradient-to-r from-green-900 via-green-800 to-black text-gray-300 shadow-md relative z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
                {/* 🔹 Лого */}
                <div className="flex items-center space-x-2">
                    <div className="bg-white/10 border border-gray-400 rounded-lg p-2">
                        <span className="text-2xl font-bold text-white">C</span>
                    </div>
                    <span className="text-lg font-semibold">CertifyMe</span>
                </div>

                {/* 🔹 Навігація */}
                <nav className="hidden md:flex space-x-6 text-gray-300">
                    <a
                        href="/tests"
                        className="hover:text-white transition flex items-center space-x-1"
                    >
                        <Award size={18} />
                        <span>{t("nav.tests")}</span>
                    </a>
                    <a
                        href="/certificates"
                        className="hover:text-white transition flex items-center space-x-1"
                    >
                        <Trophy size={18} />
                        <span>{t("nav.certificates")}</span>
                    </a>
                    <a
                        href="/achievements"
                        className="hover:text-white transition flex items-center space-x-1"
                    >
                        <Trophy size={18} />
                        <span>{t("nav.achievements")}</span>
                    </a>
                    <a
                        href="/partners"
                        className="hover:text-white transition flex items-center space-x-1"
                    >
                        <Briefcase size={18} />
                        <span>{t("nav.partners")}</span>
                    </a>

                    {/* 🔹 Адмін (тільки для admin role) */}
                    {isAdmin && (
                        <a
                            href="/admin"
                            className="hover:text-white transition flex items-center space-x-1 text-green-400 font-semibold"
                        >
                            <Shield size={18} />
                            <span>Admin</span>
                        </a>
                    )}
                </nav>

                {/* 🔹 Права частина */}
                <div className="hidden md:flex items-center space-x-6">
                    {/* 🌐 Мови */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => changeLanguage("ua")}
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                i18n.language === "ua"
                                    ? "bg-green-600 text-white"
                                    : "hover:text-white"
                            }`}
                        >
                            <Globe size={18} />
                            <span>UA</span>
                        </button>
                        <button
                            onClick={() => changeLanguage("en")}
                            className={`flex items-center space-x-1 px-2 py-1 rounded ${
                                i18n.language === "en"
                                    ? "bg-green-600 text-white"
                                    : "hover:text-white"
                            }`}
                        >
                            <Globe size={18} />
                            <span>EN</span>
                        </button>
                    </div>

                    {/* 📞 Контакт */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2"
                    >
                        <Phone size={18} />
                        <span>{t("nav.contact")}</span>
                    </button>

                    {/* 👤 Профіль */}
                    <button
                        onClick={handleProfileClick}
                        className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                    >
                        <User size={20} />
                        <span>{t("nav.profile")}</span>
                    </button>
                </div>

                {/* 🔹 Мобільна кнопка */}
                <button
                    className="md:hidden text-gray-300 hover:text-white"
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <X size={26} /> : <Menu size={26} />}
                </button>
            </div>

            {/* 🔹 Мобільне меню */}
            {isOpen && (
                <nav className="md:hidden bg-black/90 text-gray-300 flex flex-col items-center space-y-4 py-4">
                    <a href="/tests" className="hover:text-white transition">
                        {t("nav.tests")}
                    </a>
                    <a href="/certificates" className="hover:text-white transition">
                        {t("nav.certificates")}
                    </a>
                    <a href="/achievements" className="hover:text-white transition">
                        {t("nav.achievements")}
                    </a>
                    <a href="/partners" className="hover:text-white transition">
                        {t("nav.partners")}
                    </a>

                    {/* 🔹 Адмін (мобільна версія) */}
                    {isAdmin && (
                        <a
                            href="/admin"
                            className="hover:text-white transition text-green-400 font-semibold"
                        >
                            Admin
                        </a>
                    )}

                    {/* Мови */}
                    <div className="flex items-center space-x-3 border-t border-gray-700 pt-3">
                        <button
                            onClick={() => changeLanguage("ua")}
                            className={`px-2 py-1 rounded ${
                                i18n.language === "ua" ? "bg-green-600 text-white" : ""
                            }`}
                        >
                            UA
                        </button>
                        <button
                            onClick={() => changeLanguage("en")}
                            className={`px-2 py-1 rounded ${
                                i18n.language === "en" ? "bg-green-600 text-white" : ""
                            }`}
                        >
                            EN
                        </button>
                    </div>

                    {/* Контакт */}
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2"
                    >
                        <Phone size={18} />
                        <span>{t("nav.contact")}</span>
                    </button>

                    {/* Профіль */}
                    <button
                        onClick={handleProfileClick}
                        className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                    >
                        <User size={20} />
                        <span>{t("nav.profile")}</span>
                    </button>
                </nav>
            )}

            {/* 🔹 Модальні вікна */}
            <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />
            <AuthModal
                isOpen={showAuth}
                onClose={() => setShowAuth(false)}
                onLoginSuccess={handleLoginSuccess}
            />
        </header>
    );
}
