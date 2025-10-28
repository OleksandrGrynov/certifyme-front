import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function ResetPassword() {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirm) {
            setMessage("❌ Паролі не співпадають");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("http://localhost:5000/api/users/reset-password", {
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
            setMessage("❌ Помилка сервера");
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
                <h2 className="text-2xl font-bold text-center mb-4 text-green-400">🔁 Новий пароль</h2>
                <p className="text-sm text-gray-400 text-center mb-6">
                    Введіть новий пароль для свого акаунта.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Новий пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full bg-gray-800 text-white rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-600"
                        />
                    </div>
                    <div className="relative">
                        <Lock size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Підтвердження пароля"
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
                        {loading ? "Збереження..." : "Зберегти пароль"}
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
