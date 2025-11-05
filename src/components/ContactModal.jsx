import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import tToast from "../lib/tToast";

export default function ContactModal({ isOpen, onClose }) {
    const { t } = useTranslation();

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
        telegram: "",
        agree: false,
    });

    const [errors, setErrors] = useState({
        phone: "",
        message: "",
    });

    // 🧩 Форматування телефону
    const formatPhone = (value) => {
        let digits = value.replace(/\D/g, "");
        if (!digits.startsWith("380")) digits = "380" + digits;
        digits = digits.slice(0, 12);
        let formatted = "+380";
        if (digits.length > 3) formatted += " (" + digits.slice(3, 5);
        if (digits.length > 5) formatted += ") " + digits.slice(5, 8);
        if (digits.length > 8) formatted += "-" + digits.slice(8, 10);
        if (digits.length > 10) formatted += "-" + digits.slice(10, 12);
        return formatted;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "phone") {
            const formatted = formatPhone(value);
            setForm({ ...form, phone: formatted });

            const valid = /^\+380\s?\(\d{2}\)\s?\d{3}-\d{2}-\d{2}$/.test(formatted);
            setErrors({
                ...errors,
                phone: valid ? "" : t("error_invalid_phone"),
            });
        } else if (name === "message") {
            setForm({ ...form, message: value });
            setErrors({
                ...errors,
                message: value.trim().length === 0 ? "Поле не може бути порожнім" : "",
            });
        } else {
            setForm({ ...form, [name]: type === "checkbox" ? checked : value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (errors.phone || !form.agree || !form.message.trim()) {
            if (!form.message.trim()) {
                setErrors((prev) => ({ ...prev, message: "Поле не може бути порожнім" }));
            }
            toast.error(t("form_check_error"));
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/contacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            if (response.ok) {
                toast.success(t("form_success"));
                setForm({
                    name: "",
                    email: "",
                    phone: "",
                    message: "",
                    telegram: "",
                    agree: false,
                });
                onClose();
            } else {
                const errorData = await response.json();
                console.error("Server error:", errorData);
                tToast.error(
                  "⚠️ Помилка при відправці форми. Спробуйте пізніше.",
                  "⚠️ Failed to send form. Try again later."
                );
            }
        } catch (err) {
            console.error("❌ Fetch error:", err);
            tToast.error("⚠️ Не вдалося зʼєднатися із сервером.", "⚠️ Failed to connect to server.");
        }
    };

    return (
      <AnimatePresence>
          {isOpen && (
            <>
                {/* затемнення */}
                <motion.div
                  className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                />

                {/* модалка */}
                <motion.div
                  className="fixed inset-0 flex items-center justify-center z-50 p-4"
                  initial={{ opacity: 0, y: 50, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 50, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                >
                    <div className="w-full max-w-lg bg-[#0c0c0d]/95 border border-gray-800 rounded-2xl p-8 text-gray-100 shadow-[0_0_40px_rgba(34,197,94,0.3)] backdrop-blur-xl relative">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">{t("contact_title")}</h2>
                            <button
                              onClick={onClose}
                              className="text-gray-400 hover:text-gray-200 text-2xl leading-none"
                            >
                                ✕
                            </button>
                        </div>

                        <p className="text-sm text-gray-400 mb-6">{t("contact_description")}</p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-sm mb-1 block text-gray-300">{t("form_name")}*</label>
                                <input
                                  type="text"
                                  name="name"
                                  value={form.name}
                                  onChange={handleChange}
                                  placeholder={t("placeholder_name")}
                                  required
                                  className="w-full bg-[#1a1a1c] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-gray-300">{t("form_email")}*</label>
                                <input
                                  type="email"
                                  name="email"
                                  value={form.email}
                                  onChange={handleChange}
                                  placeholder={t("placeholder_email")}
                                  required
                                  className="w-full bg-[#1a1a1c] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-gray-300">{t("form_phone")}*</label>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={form.phone}
                                  onChange={handleChange}
                                  placeholder="+380 (__) ___-__-__"
                                  required
                                  className={`w-full bg-[#1a1a1c] border rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none transition-all duration-200 ${
                                    errors.phone
                                      ? "border-red-500 focus:border-red-500"
                                      : "border-gray-700 focus:border-green-500"
                                  }`}
                                />
                                {errors.phone && (
                                  <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
                                )}
                            </div>

                            {/* 🆕 Поле повідомлення */}
                            <div>
                                <label className="text-sm mb-1 block text-gray-300">{t("form_message")}</label>
                                <textarea
                                  name="message"
                                  value={form.message}
                                  onChange={handleChange}
                                  placeholder={t("placeholder_email")}
                                  rows={3}
                                  required
                                  className={`w-full bg-[#1a1a1c] border rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none transition-all duration-200 ${
                                    errors.message
                                      ? "border-red-500 focus:border-red-500"
                                      : "border-gray-700 focus:border-green-500"
                                  }`}
                                />
                                {errors.message && (
                                  <p className="text-red-400 text-xs mt-1">{errors.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="text-sm mb-1 block text-gray-300">{t("form_telegram")}</label>
                                <input
                                  type="text"
                                  name="telegram"
                                  value={form.telegram}
                                  onChange={handleChange}
                                  placeholder="@username"
                                  className="w-full bg-[#1a1a1c] border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 focus:outline-none focus:border-green-500"
                                />
                            </div>

                            <div className="flex items-start gap-2 text-sm mt-2">
                                <input
                                  type="checkbox"
                                  name="agree"
                                  checked={form.agree}
                                  onChange={handleChange}
                                  required
                                  className="mt-1 accent-green-500 cursor-pointer"
                                />
                                <label className="text-gray-400">
                                    {t("form_agree")}{" "}
                                    <span className="text-green-400 cursor-pointer hover:underline">
                                            {t("form_terms")}
                                        </span>
                                </label>
                            </div>

                            <button
                              type="submit"
                              disabled={!form.agree}
                              className="w-full mt-5 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50"
                            >
                                {t("form_submit")}
                            </button>
                        </form>
                    </div>
                </motion.div>
            </>
          )}
      </AnimatePresence>
    );
}
