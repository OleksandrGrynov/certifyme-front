import { useTranslation } from "react-i18next";
import { Github, Mail, Globe } from "lucide-react";

export default function Footer() {
  const { i18n } = useTranslation();
  const tLabel = (ua, en) => (i18n.language === "ua" ? ua : en);
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-400 border-t border-gray-800 mt-0">
      {}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-green-400/40 via-green-500/70 to-green-400/40 blur-[1px]" />

      <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        {}
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-bold text-green-400">CertifyMe</h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            {tLabel(
              "Сертифікуй знання — розвивайся з нами!",
              "Certify your knowledge — grow with us!"
            )}
          </p>
        </div>

        {}
        <div className="text-center">
          <h3 className="text-green-400 font-semibold mb-1">
            {tLabel("Навігація", "Navigation")}
          </h3>
          <ul className="flex justify-center sm:justify-center gap-4 text-xs">
            <li>
              <a href="/" className="hover:text-green-400 transition">
                {tLabel("Головна", "Home")}
              </a>
            </li>
            <li>
              <a href="/tests" className="hover:text-green-400 transition">
                {tLabel("Тести", "Tests")}
              </a>
            </li>
            <li>
              <a href="/achievements" className="hover:text-green-400 transition">
                {tLabel("Досягнення", "Achievements")}
              </a>
            </li>
            <li>
              <a href="/profile" className="hover:text-green-400 transition">
                {tLabel("Профіль", "Profile")}
              </a>
            </li>
          </ul>
        </div>

        {}
        <div className="text-center sm:text-right">
          <h3 className="text-green-400 font-semibold mb-1">
            {tLabel("Зв’язок", "Contact")}
          </h3>
          <div className="flex justify-center sm:justify-end gap-4 text-gray-400 mt-1">
            <a
              href="https://github.com/OleksandrGrynov"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition"
            >
              <Github size={18} />
            </a>
            <a
              href="mailto:certifyme.project@gmail.com"
              className="hover:text-green-400 transition"
            >
              <Mail size={18} />
            </a>
            <a
              href="https://www.certifyme.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-green-400 transition"
            >
              <Globe size={18} />
            </a>
          </div>
        </div>
      </div>

      {}
      <div className="border-t border-gray-800/60 py-3 text-center text-xs text-gray-500 bg-gray-950/40 backdrop-blur-sm">
        <p>
          © {year} <span className="text-green-400 font-semibold">CertifyMe</span> —{" "}
          {tLabel("Усі права захищено", "All rights reserved")}
        </p>
      </div>
    </footer>
  );
}
