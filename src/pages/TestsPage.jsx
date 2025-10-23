import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function TestsPage() {
    const { i18n } = useTranslation();
    const [tests, setTests] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/api/tests")
            .then((res) => res.json())
            .then((data) => setTests(data.tests || []))
            .catch((err) => console.error("❌ Fetch tests error:", err));
    }, []);

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
            <h1 className="text-3xl font-bold text-center mb-8">Тести / Tests</h1>

            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
                {tests.map((test) => (
                    <motion.div
                        key={test.id}
                        className="bg-gray-800 rounded-xl p-4 shadow-lg hover:shadow-green-600/40 transition"
                        whileHover={{ scale: 1.03 }}
                    >
                        {test.image_url && (
                            <img
                                src={test.image_url}
                                alt={test.title_ua || "test image"}
                                className="w-full h-40 object-cover rounded-lg mb-3"
                            />
                        )}
                        <h2 className="text-xl font-semibold mb-2">
                            {i18n.language === "ua" ? test.title_ua : test.title_en}
                        </h2>
                        <p className="text-gray-400 text-sm mb-3">
                            {i18n.language === "ua"
                                ? test.description_ua
                                : test.description_en}
                        </p>

                        {/* ✅ Кнопка з переходом */}
                        <Link to={`/tests/${test.id}`}>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition">
                                {i18n.language === "ua" ? "Пройти тест" : "Take test"}
                            </button>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
