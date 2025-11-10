import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/apiClient";
import { validatePassword } from "../lib/validatePassword";
import PasswordStrengthBar from "../components/PasswordStrengthBar";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordCheck, setPasswordCheck] = useState({
    isValid: false,
    rules: { length: false, upper: false, number: false, special: false },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    
    if (password !== confirm) {
      setMessage(
        i18n.language === "ua"
          ? " Паролі не співпадають"
          : " Passwords do not match"
      );
      return;
    }

    
    const check = validatePassword(password);
    if (!check.isValid) {
      setMessage(
        i18n.language === "ua"
          ? " Пароль має містити мінімум 6 символів, одну велику літеру, цифру та спецсимвол"
          : " Password must contain at least 6 characters, one uppercase letter, a number and a special symbol"
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      setMessage(data.message);

      if (data.success) {
        setTimeout(() => navigate("/"), 2000);
      }
    } catch {
      setMessage(
        i18n.language === "ua"
          ? " Помилка сервера"
          : " Server error"
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
        <h2 className="text-2xl font-bold text-center mb-4 text-green-400">
           {t("reset_password_title") || "Новий пароль"}
        </h2>
        <p className="text-sm text-gray-400 text-center mb-6">
          {t("reset_password_subtitle") ||
            "Введіть новий пароль для свого акаунта."}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder={
                t("new_password_placeholder") || "Новий пароль"
              }
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordCheck(validatePassword(e.target.value));
              }}
              required
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
            />
            <PasswordStrengthBar password={password} />
          </div>

          <div className="relative">
            <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="password"
              placeholder={
                t("confirm_password_placeholder") || "Підтвердження пароля"
              }
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg"
          >
            {loading
              ? t("saving") || "Збереження..."
              : t("save_password_button") || "Зберегти пароль"}
          </button>
        </form>

        {message && (
          <p className="mt-4 text-center text-sm text-gray-300 bg-gray-800/50 rounded-lg p-2">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
