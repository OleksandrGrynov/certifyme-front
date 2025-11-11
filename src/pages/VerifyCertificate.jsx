import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { API_URL } from "../lib/apiClient";

export default function VerifyCertificate() {
  const { t, i18n } = useTranslation();
  const { cert_id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCert = async () => {
      try {
        
        const res = await fetch(
          `${API_URL}/api/certificates/verify/${cert_id}`,
          {
            headers: { "Accept-Language": i18n.language },
          }
        );

        const data = await res.json();
        setCert(data);
      } catch (err) {
        console.error(" verify fetch error:", err);
        setCert({ success: false });
      } finally {
        setLoading(false);
      }
    };
    loadCert();
  }, [cert_id, i18n.language]);


  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white text-lg">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, repeatType: "reverse", duration: 1 }}
        >
          {tLabel("Завантаження...", "Loading...")}
        </motion.div>
      </div>
    );

  if (!cert?.success)
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col justify-center items-center h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6"
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl"
        >
          <h1 className="text-4xl text-red-500 font-bold mb-4">
             {tLabel("Сертифікат не знайдено", "Certificate not found")}
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            {tLabel(
              "Можливо, він недійсний або був видалений із системи CertifyMe.",
              "It may be invalid or removed from the CertifyMe system.",
            )}
          </p>
          <a
            href="/"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
          >
            {tLabel("На головну", "Go to homepage")}
          </a>
        </motion.div>

        <footer className="mt-8 text-gray-500 text-sm">
          CertifyMe © 2025 | {tLabel("Верифікація сертифіката", "Certificate Verification")}
        </footer>
      </motion.section>
    );

  const isValid = cert.valid;
  const color = isValid ? "text-green-400" : "text-red-400";

  return (
    <section className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-6">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl"
      >
        <h1 className={`text-3xl font-bold mb-3 ${color}`}>
          {isValid
            ? tLabel("Сертифікат дійсний", "Certificate is valid")
            : tLabel("⚠️ Сертифікат прострочений", "⚠️ Certificate expired")}
        </h1>
        <p className="text-gray-400 mb-6">
          {tLabel("ID сертифіката", "Certificate ID")}: {cert.id}
        </p>

        <div className="text-left space-y-3 bg-gray-800/40 rounded-xl p-5 border border-gray-700/60">
          <p>
            <span className="text-gray-400">👤 {tLabel("Власник", "Owner")}:</span>{" "}
            <span className="text-white font-semibold">{cert.name}</span>
          </p>
          <p>
            <span className="text-gray-400">📘 {tLabel("Курс", "Course")}:</span>{" "}
            <span className="text-green-400 font-medium">{cert.course}</span>
          </p>
          <p>
            <span className="text-gray-400">📅 {tLabel("Виданий", "Issued on")}:</span>{" "}
            <span className="text-white">{cert.issued}</span>
          </p>
          <p>
            <span className="text-gray-400">⏳ {tLabel("Діє до", "Valid until")}:</span>{" "}
            <span className="text-white">{cert.expires}</span>
          </p>
          <p>
            <span className="text-gray-400">🎯 {tLabel("Результат", "Result")}:</span>{" "}
            <span className="text-white font-medium">{cert.percent}%</span>
          </p>
          <p>
            <span className="text-gray-400">📄 {tLabel("Статус", "Status")}:</span>{" "}
            <span className={isValid ? "text-green-400" : "text-red-400"}>
              {tLabel(cert.status, cert.status)}
            </span>
          </p>
        </div>

        <div className="mt-8">
          <a
            href="/"
            className="bg-green-600 hover:bg-green-700 px-6 py-3 rounded-lg font-semibold transition"
          >
            {tLabel("На головну", "Go to homepage")}
          </a>
        </div>
      </motion.div>

      <footer className="mt-10 text-gray-500 text-sm">
        CertifyMe © 2025 | {tLabel("Верифікація сертифіката", "Certificate Verification")}
      </footer>
    </section>
  );
}
