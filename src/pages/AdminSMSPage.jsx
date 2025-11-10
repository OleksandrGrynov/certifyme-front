import { useState } from "react";
import { Send, Phone, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { API_URL } from "../lib/apiClient";
import { useTranslation } from "react-i18next";

export default function AdminSMSPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { i18n } = useTranslation();

  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error(tLabel(" Введіть текст повідомлення", " Enter message text"));
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) return toast.error(tLabel(" Ви не авторизовані", " You are not authorized"));

    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/sms/send-promo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          tLabel(
            `${data.message || "Розсилку надіслано!"}`,
            `${data.message || "Message sent successfully!"}`
          )
        );
        setMessage("");
      } else {
        toast.error(tLabel(data.message || "⚠️ Помилка розсилки", data.message || "⚠️ Sending error"));
      }
    } catch (err) {
      console.error(" sendPromo error:", err);
      toast.error(tLabel("⚠️ Сервер недоступний", "⚠️ Server unavailable"));
    } finally {
      setTimeout(() => setSending(false), 1000);
    }
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gray-900 border border-green-700 rounded-2xl shadow-2xl max-w-lg w-full p-8"
      >
        <div className="flex items-center gap-2 mb-5">
          <Phone size={24} className="text-green-500" />
          <h1 className="text-2xl font-bold text-green-400">
            {tLabel("SMS Розсилка", "SMS Broadcast")}
          </h1>
        </div>

        <p className="text-gray-400 mb-4">
          {tLabel(
            "Надішліть рекламне повідомлення всім користувачам, які підписались на SMS-сповіщення.",
            "Send a promotional message to all users who have subscribed to SMS notifications."
          )}
        </p>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder={tLabel("Введіть текст повідомлення...", "Enter your message...")}
          className="w-full p-3 rounded-lg bg-gray-800 border border-green-700 text-white focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
        />

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSend}
          disabled={sending}
          className="mt-5 w-full flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg shadow-md transition"
        >
          {sending ? (
            <>
              <Loader2 size={18} className="animate-spin" />{" "}
              {tLabel("Надсилання...", "Sending...")}
            </>
          ) : (
            <>
              <Send size={18} /> {tLabel("Надіслати SMS", "Send SMS")}
            </>
          )}
        </motion.button>
      </motion.div>

      <Toaster position="top-center" />
    </section>
  );
}
