import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/apiClient";

export default function OtpVerifyModal({ email, onSuccess, onClose }) {
  const { i18n } = useTranslation();
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const lang = i18n.language === "en" ? "en" : "ua";

  const messages = {
    ua: {
      title: "Підтвердження пошти",
      subtitle: `Ми надіслали 6-значний код на адресу`,
      placeholder: "Введіть код...",
      btn_verify: "Підтвердити",
      btn_close: "Закрити",
      verifying: "Перевіряємо...",
      success: "Акаунт підтверджено! Вхід виконано ✅",
      error: "Невірний або прострочений код",
    },
    en: {
      title: "Email verification",
      subtitle: `We sent a 6-digit code to`,
      placeholder: "Enter code...",
      btn_verify: "Verify",
      btn_close: "Close",
      verifying: "Verifying...",
      success: "Account verified! Logged in ✅",
      error: "Invalid or expired code",
    },
  };

  async function handleVerify() {
    if (otp.length !== 6) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        setStatus("success");
        setMessage(messages[lang].success);

        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 7000);
      } else {
        setStatus("error");
        setMessage(data.message || messages[lang].error);
      }
    } catch (err) {
      console.error(" verify error:", err);
      setStatus("error");
      setMessage(messages[lang].error);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        className="bg-gray-800 text-gray-100 rounded-2xl p-8 shadow-2xl w-[90%] max-w-md text-center"
      >
        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <h2 className="text-2xl font-bold mb-2">{messages[lang].title}</h2>
              <p className="text-gray-400 mb-4">
                {messages[lang].subtitle} <span className="text-green-400">{email}</span>
              </p>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                maxLength={6}
                className="w-full text-center text-2xl tracking-widest p-3 rounded-lg bg-gray-700 focus:ring-2 focus:ring-green-500 outline-none mb-4"
                placeholder={messages[lang].placeholder}
              />

              {message && <p className="text-sm text-red-400 mb-2">{message}</p>}
              <div className="flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  {messages[lang].btn_close}
                </button>
                <button
                  disabled={otp.length < 6}
                  onClick={handleVerify}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                >
                  {messages[lang].btn_verify}
                </button>
              </div>
            </motion.div>
          )}

          {status === "loading" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <Loader2 className="w-10 h-10 text-green-400 animate-spin mb-4" />
              <p>{messages[lang].verifying}</p>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              <p className="text-lg">{message}</p>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <XCircle className="w-16 h-16 text-red-500 mb-4" />
              <p className="text-red-400">{message}</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
              >
                {messages[lang].btn_verify}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
