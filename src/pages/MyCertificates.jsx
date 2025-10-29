import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function MyCertificates() {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState({});

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

    // Helper: request backend to (re)generate certificate and wait until PDF becomes available
    const triggerAndWaitForCertificate = async (certId, timeoutMs = 12000) => {
        const token = localStorage.getItem("token");
        const generateUrl = `http://localhost:5000/api/tests/user/certificates/generate`;
        const fileUrl = `http://localhost:5000/certificates/certificate_${certId}.pdf`;

        try {
            // Try to ask backend to (re)generate the PDF; ignore non-2xx but log it
            await fetch(generateUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token ? `Bearer ${token}` : "",
                },
                body: JSON.stringify({ cert_id: certId }),
            });
        } catch (err) {
            // generation request failed — we'll still attempt polling, backend may create file asynchronously
            console.warn("Generation request failed:", err);
        }

        const start = Date.now();
        const interval = 1000;
        // Poll until available or timeout
        while (Date.now() - start < timeoutMs) {
            try {
                const headRes = await fetch(fileUrl, {
                    method: "GET", // HEAD may be blocked on some servers; use GET but don't consume body if success
                    headers: {
                        Authorization: token ? `Bearer ${token}` : "",
                        Range: "bytes=0-0", // ask for first byte to reduce data transferred
                    },
                });

                if (headRes.ok) return true;
                if (headRes.status === 401) {
                    // Unauthorized while polling
                    throw new Error("unauthorized");
                }
            } catch (err) {
                // ignore transient errors and continue polling
                console.warn("Polling error:", err);
            }

            await new Promise((r) => setTimeout(r, interval));
        }

        return false;
    };

    // updated downloadCertificate: handles 401, 404 by attempting generation + retry
    const downloadCertificate = async (certId) => {
        setDownloading((s) => ({ ...s, [certId]: true }));
        const token = localStorage.getItem("token");
        const fileUrl = `http://localhost:5000/certificates/certificate_${certId}.pdf`;

        try {
            let res = await fetch(fileUrl, {
                headers: {
                    Authorization: token ? `Bearer ${token}` : "",
                },
            });

            if (res.status === 401) {
                alert("Unauthorized. Please log in to download the certificate.");
                // optional: redirect to login page
                // window.location.href = "/login";
                return;
            }

            if (res.status === 404) {
                // Try to ask backend to (re)generate the certificate and poll for availability
                alert("Certificate not found on server. Requesting generation and retrying download...");
                const available = await triggerAndWaitForCertificate(certId);
                if (!available) {
                    alert("Certificate still not available after retry. Contact support or try again later.");
                    return;
                }

                // If available now, fetch again
                res = await fetch(fileUrl, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : "",
                    },
                });

                if (!res.ok) {
                    throw new Error(`Download failed with status ${res.status}`);
                }
            }

            if (!res.ok) {
                throw new Error(`Download failed with status ${res.status}`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `certificate_${certId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error("Download error:", err);
            if (err.message === "unauthorized") {
                alert("Unauthorized while checking certificate. Please log in.");
            } else {
                alert(err.message || "Error downloading certificate");
            }
        } finally {
            setDownloading((s) => {
                const copy = { ...s };
                delete copy[certId];
                return copy;
            });
        }
    };

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
                            className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-green-500/10 transition flex flex-col h-full"
                        >
                            {/* Uniform non-photo header so all cards are identical */}
                            <div className="w-full h-28 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg mb-3 flex items-center justify-center">
                                <span className="text-sm text-gray-300 uppercase tracking-wider">
                                    Сертифікат
                                </span>
                            </div>

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
                            <p className="text-gray-300 text-sm mb-4">Результат: {cert.percent}%</p>

                            <div className="flex gap-3 mt-auto">
                                <a
                                    href={`http://localhost:5173/verify/${cert.cert_id}`}
                                    className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 text-center rounded-md text-sm font-semibold transition"
                                >
                                    Перевірити
                                </a>

                                <button
                                    onClick={() => downloadCertificate(cert.cert_id)}
                                    disabled={!!downloading[cert.cert_id]}
                                    className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm transition text-white disabled:opacity-60"
                                >
                                    {downloading[cert.cert_id] ? "Завантаження..." : "Завантажити"}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
