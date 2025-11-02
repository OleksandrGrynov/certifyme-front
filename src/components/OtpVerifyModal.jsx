import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function OtpVerifyModal({ email, onSuccess, onClose }) {
  const { i18n } = useTranslation();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const inputs = useRef([]);

  const lang = i18n.language === "en" ? "en" : "ua";

  const messages = {
    ua: {
      title: "Підтвердження пошти",
      subtitle: `Ми надіслали код на адресу`,
      btn_verify: "Підтвердити",
      btn_close: "Закрити",
      verifying: "Перевіряємо...",
      success: "Акаунт підтверджено ✅",
      error: "Невірний або прострочений код",
    },
    en: {
      title: "Email verification",
      subtitle: `We sent a code to`,
      btn_verify: "Verify",
      btn_close: "Close",
      verifying: "Verifying...",
      success: "Account verified ✅",
      error: "Invalid or expired code",
    },
  };

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1].focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 6) return;
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("http://localhost:5000/api/users/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        setStatus("success");
        setMessage(messages[lang].success);
        setTimeout(() => {
          onSuccess(data.user);
          onClose();
        }, 1500);
      } else {
        setStatus("error");
        setMessage(data.message || messages[lang].error);
      }
    } catch (err) {
      console.error("❌ verify error:", err);
      setStatus("error");
      setMessage(messages[lang].error);
    }
  };

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
              <h2 className="text-2xl font-bold mb-2 text-green-400">{messages[lang].title}</h2>
              <p className="text-gray-400 mb-6">
                {messages[lang].subtitle} <span className="text-green-400">{email}</span>
              </p>

              {}
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputs.current[i] = el)}
                    type="text"
                    value={digit}
                    maxLength={1}
                    onChange={(e) => handleChange(e, i)}
                    onKeyDown={(e) => handleKeyDown(e, i)}
                    className="w-10 h-12 text-center text-xl bg-gray-700 text-gray-100 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                ))}
              </div>

              {message && <p className="text-sm text-red-400 mb-3">{message}</p>}

              <div className="flex justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600"
                >
                  {messages[lang].btn_close}
                </button>
                <button
                  onClick={handleVerify}
                  disabled={otp.join("").length < 6}
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
              <p className="text-lg text-green-300">{message}</p>
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
              <p className="text-red-400 mb-3">{message}</p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg"
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
