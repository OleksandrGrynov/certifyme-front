import { useState, useEffect } from "react";
import {
    Menu,
    X,
    Phone,
    User,
    Award,
    Briefcase,
    Trophy,
    Shield,
    FileText,
} from "lucide-react";
import ContactModal from "./ContactModal";
import AuthModal from "./AuthModal";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";
import logo from "../logo.png";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { i18n } = useTranslation();

    const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

    // 🔹 Зчитування мови з localStorage при старті
    useEffect(() => {
        const savedLang = localStorage.getItem("i18nextLng") || "ua";
        i18n.changeLanguage(savedLang);
    }, [i18n]);

    // 🔹 Перевірка токена і ролі користувача
    useEffect(() => {
        const token = localStorage.getItem("token");
        const auth = localStorage.getItem("isAuthenticated") === "true";
        setIsAuthenticated(auth);

        if (token && token.split(".").length === 3) {
            try {
                const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
                const decoded = JSON.parse(atob(base64));
                if (decoded?.role === "admin") setIsAdmin(true);
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("isAuthenticated");
                setIsAuthenticated(false);
                setIsAdmin(false);
            }
        }
    }, []);

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
              {/* 🔹 Логотип */}
              <div
                onClick={() => (window.location.href = "/")}
                className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition"
              >
                  <img
                    src={logo}
                    alt="CertifyMe logo"
                    className="w-10 h-10 rounded-md border border-gray-500 bg-white/10 p-1"
                  />
                  <span className="text-lg font-semibold text-white">CertifyMe</span>
              </div>


              {/* 🔹 Навігація (Desktop) */}
              <nav className="hidden md:flex space-x-6 text-gray-300">
                  <a href="/tests" className="hover:text-white transition flex items-center space-x-1">
                      <Award size={18} />
                      <span>{tLabel("Тести", "Tests")}</span>
                  </a>
                  <a href="/my-certificates" className="hover:text-white transition flex items-center space-x-1">
                      <FileText size={18} />
                      <span>{tLabel("Мої сертифікати", "My Certificates")}</span>
                  </a>
                  <a href="/achievements" className="hover:text-white transition flex items-center space-x-1">
                      <Trophy size={18} />
                      <span>{tLabel("Досягнення", "Achievements")}</span>
                  </a>
                  <a href="/analytics" className="hover:text-white transition flex items-center space-x-1">
                      <Briefcase size={18} />
                      <span>{tLabel("Аналітика", "Analytics")}</span>
                  </a>

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
                  <LanguageToggle />

                  {/* 📞 Контакт */}
                  <button
                    onClick={() => setShowModal(true)}
                    className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2"
                  >
                      <Phone size={18} />
                      <span>{tLabel("Зв’язатися", "Contact Us")}</span>
                  </button>

                  {/* 👤 Профіль */}
                  <button
                    onClick={handleProfileClick}
                    className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                  >
                      <User size={20} />
                      <span>{tLabel("Профіль", "Profile")}</span>
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
                    {tLabel("Тести", "Tests")}
                </a>
                <a href="/my-certificates" className="hover:text-white transition">
                    {tLabel("Мої сертифікати", "My Certificates")}
                </a>
                <a href="/achievements" className="hover:text-white transition">
                    {tLabel("Досягнення", "Achievements")}
                </a>
                <a href="/analytics" className="hover:text-white transition">
                    {tLabel("Аналітика", "Analytics")}
                </a>

                {isAdmin && (
                  <a href="/admin" className="hover:text-white transition text-green-400 font-semibold">
                      Admin
                  </a>
                )}

                {/* 🌐 Мови */}
                <div className="pt-3">
                    <LanguageToggle />
                </div>

                {/* 📞 Контакт */}
                <button
                  onClick={() => setShowModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition flex items-center space-x-2"
                >
                    <Phone size={18} />
                    <span>{tLabel("Зв’язатися", "Contact Us")}</span>
                </button>

                {/* 👤 Профіль */}
                <button
                  onClick={handleProfileClick}
                  className="flex items-center space-x-1 text-gray-300 hover:text-white transition"
                >
                    <User size={20} />
                    <span>{tLabel("Профіль", "Profile")}</span>
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
