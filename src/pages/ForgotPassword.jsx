import { useState } from "react";
import { Mail, Send, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/apiClient";
import { validatePassword } from "../lib/validatePassword";
import PasswordStrengthBar from "../components/PasswordStrengthBar";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stage, setStage] = useState("email"); 
  const [newPassword, setNewPassword] = useState("");
  const [passwordCheck, setPasswordCheck] = useState({
    isValid: false,
    rules: { length: false, upper: false, number: false, special: false },
  });

  
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(
        data.message ||
        (i18n.language === "ua"
          ? "📩 Перевірте пошту, ми надіслали інструкції 💚"
          : "📩 Check your email, we’ve sent reset instructions 💚")
      );

      if (res.ok) {
        
        setTimeout(() => setStage("reset"), 1000);
      }
    } catch {
      setMessage(
        i18n.language === "ua"
          ? " Помилка підключення до сервера"
          : " Server connection error"
      );
    } finally {
      setLoading(false);
    }
  };

  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordCheck.isValid) {
      toast.error(
        i18n.language === "ua"
          ? "Пароль має містити 6+ символів, велику літеру, цифру та спецсимвол"
          : "Password must include at least 6 characters, an uppercase letter, a number, and a special symbol"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(
          i18n.language === "ua"
            ? "Пароль успішно змінено! Тепер можете увійти."
            : "Password changed successfully! You can now log in."
        );
        setStage("email");
        setEmail("");
        setNewPassword("");
      } else {
        setMessage(
          data.message ||
          (i18n.language === "ua"
            ? " Помилка зміни пароля"
            : " Password reset error")
        );
      }
    } catch {
      setMessage(
        i18n.language === "ua"
          ? " Помилка підключення до сервера"
          : " Server connection error"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-900 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700"
      >
        {stage === "email" ? (
          <>
            <h2 className="text-2xl font-bold text-center mb-4 text-green-400">
              🔐 {t("forgot_title", "Відновлення пароля")}
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              {t(
                "forgot_subtitle",
                "Введіть вашу пошту, і ми надішлемо посилання для зміни пароля."
              )}
            </p>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  placeholder={
                    i18n.language === "ua"
                      ? "Ваша електронна пошта"
                      : "Your email address"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {loading
                  ? t("sending", "Надсилання...")
                  : t("send_instruction", "Надіслати інструкцію")}
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-center mb-4 text-green-400">
              🔒 {t("reset_title", "Створіть новий пароль")}
            </h2>
            <p className="text-sm text-gray-400 text-center mb-6">
              {t(
                "reset_subtitle",
                "Введіть новий надійний пароль для вашого облікового запису."
              )}
            </p>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  placeholder={
                    i18n.language === "ua" ? "Новий пароль" : "New password"
                  }
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setPasswordCheck(validatePassword(e.target.value));
                  }}
                  required
                  className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                />
                <PasswordStrengthBar password={newPassword} />
              </div>

              <button
                type="submit"
                disabled={loading || !passwordCheck.isValid}
                className={`w-full transition text-white py-2 rounded-lg flex items-center justify-center gap-2 ${
                  passwordCheck.isValid
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-gray-700 cursor-not-allowed"
                }`}
              >
                {loading
                  ? t("saving", "Збереження...")
                  : t("change_password", "Змінити пароль")}
              </button>
            </form>
          </>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-gray-300 bg-gray-800/50 rounded-lg p-2">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
