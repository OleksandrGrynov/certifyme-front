import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-black border-t border-gray-800 text-center py-8 text-gray-400">
      <p className="text-sm">
        © {new Date().getFullYear()}{" "}
        <span className="text-green-400 font-semibold">CertifyMe</span>. {t("footer_rights")}
      </p>
      <p className="text-xs mt-2 opacity-75">{t("footer_made_with_love")}</p>
    </footer>
  );
}
