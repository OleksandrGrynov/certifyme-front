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
import { motion, AnimatePresence } from "framer-motion";
import ContactModal from "./ContactModal";
import AuthModal from "./AuthModal";
import OtpVerifyModal from "./OtpVerifyModal";
import { useTranslation } from "react-i18next";
import LanguageToggle from "./LanguageToggle";
import logo from "../logo.png";

export default function Header({ onShowContact }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showAuth, setShowAuth] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otpEmail, setOtpEmail] = useState("");

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const { i18n } = useTranslation();

    const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

    /* ======================================================
       🌐 Ініціалізація мови
       ====================================================== */
    useEffect(() => {
        const savedLang = localStorage.getItem("i18nextLng") || "ua";
        i18n.changeLanguage(savedLang);
    }, [i18n]);

    /* ======================================================
       🔑 Авторизація + роль
       ====================================================== */
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

    /* ======================================================
       🧩 Обробники
       ====================================================== */
    const handleProfileClick = () => {
        if (isAuthenticated) window.location.href = "/profile";
        else setShowAuth(true);
    };

    const handleNavClick = (path) => {
        window.location.href = path;
        setIsOpen(false);
    };

    /* ======================================================
       ✨ Компонент
       ====================================================== */
    return (
      <>
          <header className="fixed top-0 left-0 w-full bg-gradient-to-r from-green-900 via-green-800 to-black text-gray-300 shadow-lg z-50 backdrop-blur-lg">
              <div className="max-w-7xl mx-auto flex justify-between items-center px-5 md:px-8 py-3">
                  {/* 🔹 Логотип */}
                  <div
                    onClick={() => (window.location.href = "/")}
                    className="flex items-center space-x-2 cursor-pointer hover:opacity-90 transition"
                  >
                      <img
                        src={logo}
                        alt="CertifyMe"
                        className="w-10 h-10 rounded-md border border-gray-500 bg-white/10 p-1"
                      />
                      <span className="text-lg font-semibold text-white">CertifyMe</span>
                  </div>

                  {/* 🔹 Desktop навігація */}
                  <nav className="hidden md:flex space-x-6 text-gray-300">
                      <button
                        onClick={() => handleNavClick("/tests")}
                        className="hover:text-white transition flex items-center gap-1"
                      >
                          <Award size={18} />
                          {tLabel("Тести", "Tests")}
                      </button>
                      <button
                        onClick={() => handleNavClick("/my-certificates")}
                        className="hover:text-white transition flex items-center gap-1"
                      >
                          <FileText size={18} />
                          {tLabel("Мої сертифікати", "My Certificates")}
                      </button>
                      <button
                        onClick={() => handleNavClick("/achievements")}
                        className="hover:text-white transition flex items-center gap-1"
                      >
                          <Trophy size={18} />
                          {tLabel("Досягнення", "Achievements")}
                      </button>
                      <button
                        onClick={() => handleNavClick("/analytics")}
                        className="hover:text-white transition flex items-center gap-1"
                      >
                          <Briefcase size={18} />
                          {tLabel("Аналітика", "Analytics")}
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleNavClick("/admin")}
                          className="hover:text-white transition flex items-center gap-1 text-green-400 font-semibold"
                        >
                            <Shield size={18} />
                            Admin
                        </button>
                      )}
                  </nav>

                  {/* 🔹 Права частина (desktop) */}
                  <div className="hidden md:flex items-center space-x-5">
                      <LanguageToggle />

                      <button
                        onClick={onShowContact}
                        className="bg-black text-white px-5 py-2 rounded-lg hover:bg-gray-800 transition flex items-center gap-2 shadow-md"
                      >
                          <Phone size={18} />
                          {tLabel("Зв’язатися", "Contact Us")}
                      </button>

                      <button
                        onClick={handleProfileClick}
                        className="flex items-center gap-1 text-gray-300 hover:text-white transition"
                      >
                          <User size={20} />
                          {tLabel("Профіль", "Profile")}
                      </button>
                  </div>

                  {/* 🔹 Кнопка бургер-меню */}
                  <button
                    className="md:hidden text-gray-300 hover:text-white transition"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                      {isOpen ? <X size={26} /> : <Menu size={26} />}
                  </button>
              </div>

              {/* 🔹 Анімоване бургер-меню */}
              <AnimatePresence>
                  {isOpen && (
                    <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.5 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 bg-black z-40 md:hidden"
                          onClick={() => setIsOpen(false)}
                        />

                        <motion.nav
                          initial={{ y: -40, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -40, opacity: 0 }}
                          transition={{ type: "spring", stiffness: 120, damping: 12 }}
                          className="absolute top-full left-0 w-full bg-black/95 text-gray-200 flex flex-col items-center py-6 space-y-5 z-50 shadow-xl border-t border-gray-700 backdrop-blur-md"
                        >
                            <button
                              onClick={() => handleNavClick("/tests")}
                              className="hover:text-green-400 transition"
                            >
                                {tLabel("Тести", "Tests")}
                            </button>
                            <button
                              onClick={() => handleNavClick("/my-certificates")}
                              className="hover:text-green-400 transition"
                            >
                                {tLabel("Мої сертифікати", "My Certificates")}
                            </button>
                            <button
                              onClick={() => handleNavClick("/achievements")}
                              className="hover:text-green-400 transition"
                            >
                                {tLabel("Досягнення", "Achievements")}
                            </button>
                            <button
                              onClick={() => handleNavClick("/analytics")}
                              className="hover:text-green-400 transition"
                            >
                                {tLabel("Аналітика", "Analytics")}
                            </button>

                            {isAdmin && (
                              <button
                                onClick={() => handleNavClick("/admin")}
                                className="text-green-400 font-semibold hover:text-green-300 transition"
                              >
                                  Admin
                              </button>
                            )}

                            <div className="pt-3">
                                <LanguageToggle />
                            </div>

                            <button
                              onClick={() => {
                                  onShowContact();
                                  setIsOpen(false);
                              }}
                              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md"
                            >
                                <Phone size={18} />
                                {tLabel("Зв’язатися", "Contact Us")}
                            </button>

                            <button
                              onClick={() => {
                                  handleProfileClick();
                                  setIsOpen(false);
                              }}
                              className="flex items-center gap-1 text-gray-300 hover:text-green-400 transition"
                            >
                                <User size={20} />
                                {tLabel("Профіль", "Profile")}
                            </button>
                        </motion.nav>
                    </>
                  )}
              </AnimatePresence>
          </header>

          {/* 🔹 Модалки */}
          {showAuth && (
            <AuthModal
              isOpen={showAuth}
              onClose={() => setShowAuth(false)}
              onOtpStart={(email) => {
                  setOtpEmail(email);
                  setShowAuth(false);
                  setShowOtp(true);
              }}
            />
          )}

          {showOtp && (
            <OtpVerifyModal
              email={otpEmail}
              onSuccess={() => {
                  setShowOtp(false);
                  window.location.reload();
              }}
              onClose={() => setShowOtp(false)}
            />
          )}
      </>
    );
}
