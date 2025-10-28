import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MyCertificates() {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:5000/api/tests/user/certificates", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                if (data.success) setCerts(data.certificates);
            } catch (err) {
                console.error("❌ error loading certs:", err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading)
        return (
            <div className="flex justify-center items-center h-screen text-white bg-gradient-to-br from-gray-950 via-gray-900 to-black">
                Завантаження...
            </div>
        );

    if (!certs.length)
        return (
            <section className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
                <h1 className="text-3xl font-bold mb-4 text-gray-300">У вас ще немає сертифікатів 😔</h1>
                <a
                    href="/tests"
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                >
                    Перейти до тестів
                </a>
            </section>
        );

    return (
        <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-6 py-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold text-center mb-10 text-green-400">
                    Мої сертифікати
                </h1>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {certs.map((cert, i) => (
                        <motion.div
                            key={cert.cert_id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-green-500/10 transition"
                        >
                            <h2 className="text-xl font-semibold text-green-400 mb-2">
                                {cert.course}
                            </h2>
                            <p className="text-gray-400 text-sm mb-3">ID: {cert.cert_id}</p>
                            <p className="text-gray-300 text-sm">
                                📅 Виданий: {new Date(cert.issued).toLocaleDateString("uk-UA")}
                            </p>
                            <p className="text-gray-300 text-sm">
                                ⏳ Діє до: {new Date(cert.expires).toLocaleDateString("uk-UA")}
                            </p>
                            <p className="text-gray-300 text-sm mb-4">🎯 Результат: {cert.percent}%</p>

                            <div className="flex gap-3">
                                <a
                                    href={`http://localhost:5173/verify/${cert.cert_id}`}
                                    className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 text-center rounded-md text-sm font-semibold transition"
                                >
                                    Перевірити
                                </a>
                                <a
                                    href={`http://localhost:5000/certificates/certificate_${cert.cert_id}.pdf`}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 text-center rounded-md text-sm transition"
                                    download
                                >
                                    Завантажити
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
