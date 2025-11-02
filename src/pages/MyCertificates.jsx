import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AuthModal from "../components/AuthModal";
import toast from "react-hot-toast";

export default function MyCertificates() {
  const { i18n } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState({});
  const [showAuth, setShowAuth] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setIsGuest(true);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/api/tests/user/certificates", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) setCerts(data.certificates || []);
      } catch (err) {
        console.error("❌ Error loading certificates:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const ensureCertificateAvailable = async (certId, timeoutMs = 15000) => {
    const token = localStorage.getItem("token");
    const fileUrl = `http://localhost:5000/certificates/certificate_${certId}.pdf`;
    const regenUrl = `http://localhost:5000/api/certificates/${certId}`;

    try {
      const firstTry = await fetch(fileUrl, { method: "GET" });
      if (firstTry.ok) return fileUrl;

      if (firstTry.status === 404) {
        console.warn(`🧾 Сертифікат ${certId} не знайдено — генеруємо...`);
        await fetch(regenUrl, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
      }

      const start = Date.now();
      while (Date.now() - start < timeoutMs) {
        const check = await fetch(fileUrl, { method: "HEAD" });
        if (check.ok) return fileUrl;
        await new Promise((r) => setTimeout(r, 1000));
      }
      throw new Error(
        tLabel("Сертифікат не з’явився після генерації.", "Certificate not generated in time."),
      );
    } catch (err) {
      console.error("❌ ensureCertificateAvailable:", err);
      throw err;
    }
  };

  const downloadCertificate = async (certId) => {
    setDownloading((prev) => ({ ...prev, [certId]: true }));

    try {
      const url = await ensureCertificateAvailable(certId);
      const res = await fetch(url);
      if (!res.ok)
        throw new Error(
          tLabel(`Помилка завантаження (${res.status})`, `Download error (${res.status})`),
        );

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `certificate_${certId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      toast.error(
        err.message ||
          tLabel("Помилка при завантаженні сертифіката", "Error downloading certificate"),
      );
    } finally {
      setDownloading((prev) => {
        const copy = { ...prev };
        delete copy[certId];
        return copy;
      });
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-white bg-gradient-to-br from-gray-950 via-gray-900 to-black">
        {tLabel("Завантаження...", "Loading...")}
      </div>
    );

  if (isGuest)
    return (
      <section className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        <h1 className="text-3xl font-bold mb-4 text-gray-300">
          {tLabel(
            "Увійдіть, щоб переглянути сертифікати 🔒",
            "Sign in to view your certificates 🔒",
          )}
        </h1>
        <button
          onClick={() => setShowAuth(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          {tLabel("Зареєструватися", "Sign up")}
        </button>

        {}
        {showAuth && <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />}
      </section>
    );

  if (!certs.length)
    return (
      <section className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white">
        <h1 className="text-3xl font-bold mb-4 text-gray-300">
          {tLabel("У вас ще немає сертифікатів 😔", "You have no certificates yet 😔")}
        </h1>
        <a
          href="/tests"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
        >
          {tLabel("Перейти до тестів", "Go to tests")}
        </a>
      </section>
    );

  return (
    <section className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-10 text-green-400">
          {tLabel("Мої сертифікати", "My Certificates")}
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
              <div className="w-full h-28 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg mb-3 flex items-center justify-center">
                <span className="text-sm text-gray-300 uppercase tracking-wider">
                  {tLabel("Сертифікат", "Certificate")}
                </span>
              </div>

              <h2 className="text-xl font-semibold text-green-400 mb-2">
                {i18n.language === "ua"
                  ? cert.course_ua || cert.course
                  : cert.course_en || cert.course}
              </h2>
              <p className="text-gray-400 text-sm mb-3">ID: {cert.cert_id}</p>
              <p className="text-gray-300 text-sm">
                📅 {tLabel("Виданий", "Issued")}:{" "}
                {new Date(cert.issued).toLocaleDateString(
                  i18n.language === "ua" ? "uk-UA" : "en-US",
                )}
              </p>
              <p className="text-gray-300 text-sm">
                ⏳ {tLabel("Діє до", "Valid until")}:{" "}
                {new Date(cert.expires).toLocaleDateString(
                  i18n.language === "ua" ? "uk-UA" : "en-US",
                )}
              </p>
              <p className="text-gray-300 text-sm mb-4">
                {tLabel("Результат", "Result")}: {cert.percent}%
              </p>

              <div className="flex gap-3 mt-auto">
                <a
                  href={`http://localhost:5173/verify/${cert.cert_id}`}
                  className="flex-1 bg-green-600 hover:bg-green-700 px-3 py-2 text-center rounded-md text-sm font-semibold transition"
                >
                  {tLabel("Перевірити", "Verify")}
                </a>

                <button
                  onClick={() => downloadCertificate(cert.cert_id)}
                  disabled={!!downloading[cert.cert_id]}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm transition text-white disabled:opacity-60"
                >
                  {downloading[cert.cert_id]
                    ? tLabel("Завантаження...", "Downloading...")
                    : tLabel("Завантажити", "Download")}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
