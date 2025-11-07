import React from "react";
import { useTranslation } from "react-i18next";

export default function PasswordStrengthBar({ password = "" }) {
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "ua";

  const rules = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_\-+=<>?{}[\]~.,]/.test(password),
  };

  const score = Object.values(rules).filter(Boolean).length;

  const getStrength = () => {
    switch (score) {
      case 0:
      case 1:
        return {
          label: lang === "ua" ? "Слабкий" : "Weak",
          color: "bg-red-600",
          width: "w-1/3",
        };
      case 2:
      case 3:
        return {
          label: lang === "ua" ? "Середній" : "Medium",
          color: "bg-yellow-500",
          width: "w-2/3",
        };
      case 4:
        return {
          label: lang === "ua" ? "Сильний" : "Strong",
          color: "bg-green-500",
          width: "w-full",
        };
      default:
        return { label: "", color: "", width: "" };
    }
  };

  const { label, color, width } = getStrength();

  return (
    <div className="mt-2">
      <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 rounded-full ${color} ${width}`}
        ></div>
      </div>
      {password && (
        <p
          className={`text-sm mt-1 ${
            score <= 1
              ? "text-red-400"
              : score === 2 || score === 3
                ? "text-yellow-400"
                : "text-green-400"
          }`}
        >
          {label}
        </p>
      )}
    </div>
  );
}
