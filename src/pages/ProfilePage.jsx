import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Save, Lock,Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import tToast from "../lib/tToast";
import { API_URL } from "../lib/apiClient";
import { validatePassword } from "../lib/validatePassword";
import PasswordStrengthBar from "../components/PasswordStrengthBar";

const successSound = new Audio("/success.mp3");
const errorSound = new Audio("/error.mp3");
const warningSound = new Audio("/warning.mp3");

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [passwordCheck, setPasswordCheck] = useState({
    isValid: false,
    rules: { length: false, upper: false, number: false, special: false },
  });

  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    joined: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [newData, setNewData] = useState({
    first_name: "",
    last_name: "",
    email: "",
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const token = localStorage.getItem("token");

  useEffect(() => {
    const isAuth = localStorage.getItem("isAuthenticated") === "true";
    if (!isAuth) {
      navigate("/");
      return;
    }

    fetch(`${API_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          const u = {
            first_name: data.user.first_name,
            last_name: data.user.last_name,
            email: data.user.email,
            joined: new Date(data.user.created_at).toLocaleDateString("uk-UA"),
          };
          setUser(u);
          setNewData({
            first_name: u.first_name,
            last_name: u.last_name,
            email: u.email,
          });
        }
      })
      .catch((err) => console.error(" Profile fetch error:", err));
  }, [navigate, token]);
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("token");
    
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("promoWidget_")) {
        localStorage.removeItem(key);
      }
    });

    navigate("/");
    window.location.reload();
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!newData.first_name || !newData.last_name || !newData.email) {
        warningSound.play();
        tToast.error("⚠️ Заповніть усі поля!", "⚠️ Please fill in all fields!");
        return;
      }

      const res = await fetch(`${API_URL}/api/users/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newData),
      });

      const data = await res.json();
      if (data.success) {
        setUser({
          first_name: data.user.first_name,
          last_name: data.user.last_name,
          email: data.user.email,
          joined: new Date(data.user.created_at).toLocaleDateString("uk-UA"),
        });
        setIsEditing(false);
        successSound.play();
        tToast.success("Дані успішно оновлено", "Data updated successfully");
      } else {
        errorSound.play();
        tToast.error(" " + data.message, " " + (data.message || "Update error"));
      }
    } catch (err) {
      console.error("Помилка при оновленні:", err);
      errorSound.play();
      tToast.error(" Помилка при оновленні", " Update error");
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwords.new !== passwords.confirm) {
      errorSound.play();
      toast.error(t("passwords_not_match") || " Новий пароль не співпадає з підтвердженням");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/users/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword: passwords.old,
          newPassword: passwords.new,
        }),
      });

      const data = await res.json();
      if (data.success) {
        successSound.play();
        tToast.success(
          "Пароль успішно змінено!",
          "Password changed!",
        );
        setPasswords({ old: "", new: "", confirm: "" });
        setShowPasswordForm(false);
      } else {
        errorSound.play();
        tToast.error(" " + (data.message || "Помилка зміни пароля"), " " + (data.message || "Password change error"));
      }
    } catch (err) {
      console.error(err);
      errorSound.play();
      tToast.error(" Помилка сервера при зміні пароля", " Server error while changing password");
    }
  };

  const handleForgotPassword = async () => {
    try {
      const res = await fetch(`${API_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await res.json();
      if (data.success) {
        successSound.play();
        tToast.success(
          "📩 Ми надіслали лист із інструкцією для зміни пароля!",
          "📩 We've sent instructions to change your password!",
        );
      } else {
        errorSound.play();
        tToast.error(" " + (data.message || "Помилка при надсиланні листа"), " " + (data.message || "Failed to send email"));
      }
    } catch (err) {
      console.error(err);
      errorSound.play();
      tToast.error(" Не вдалося надіслати лист", " Failed to send email");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-200 flex items-center justify-center px-4 py-10">
      <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-700 animate-fadeIn">
        <div className="flex justify-center mb-4">
          <div className="bg-green-700/30 rounded-full p-4 animate-pulse">
            <User size={48} className="text-green-400" />
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3 mb-4">
            <input
              type="text"
              value={newData.first_name}
              onChange={(e) => setNewData({ ...newData, first_name: e.target.value })}
              placeholder={t("form_first_name") || "Ім'я"}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            <input
              type="text"
              value={newData.last_name}
              onChange={(e) => setNewData({ ...newData, last_name: e.target.value })}
              placeholder={t("form_last_name") || "Прізвище"}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            <input
              type="email"
              value={newData.email}
              onChange={(e) => setNewData({ ...newData, email: e.target.value })}
              placeholder={t("form_email")}
              className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-600"
            />

            <button
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              <Save size={18} />
              <span>{t("save_changes")}</span>
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-2">
              {user.first_name} {user.last_name}
            </h2>
            <p className="text-gray-400 mb-4">{user.email}</p>
            <div className="border-t border-gray-700 pt-4 mt-4 text-sm text-gray-500">
              <p>
                {t("member_since")} <span className="text-gray-300">{user.joined}</span>
              </p>
            </div>
          </>
        )}

        {!isEditing && (
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={() => setIsEditing(true)}
              className="w-full bg-green-600 hover:bg-green-700 transition text-white py-2 rounded-lg"
            >
              {t("edit_profile")}
            </button>

            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              <Lock size={18} />
              <span>{t("change_password")}</span>
            </button>

            <button
              onClick={handleForgotPassword}
              className="w-full bg-indigo-600 hover:bg-indigo-700 transition text-white py-2 rounded-lg"
            >
              🔐 {t("recover_via_email", "Відновити пароль через пошту")}
            </button>

          </div>
        )}

        {showPasswordForm && (
          <form
            onSubmit={handlePasswordChange}
            className="mt-6 text-left space-y-3 border-t border-gray-700 pt-4"
          >
            {}
            <div className="relative">
              <input
                type={showPasswords.old ? "text" : "password"}
                placeholder={t("old_password") || "Старий пароль"}
                value={passwords.old}
                onChange={(e) => setPasswords({ ...passwords, old: e.target.value })}
                className="w-full bg-gray-800 rounded-lg px-3 pr-10 py-2 focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((p) => ({ ...p, old: !p.old }))
                }
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
              >
                {showPasswords.old ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {}
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                placeholder={t("new_password") || "Новий пароль"}
                value={passwords.new}
                onChange={(e) => {
                  const value = e.target.value;
                  setPasswords({ ...passwords, new: value });
                  setPasswordCheck(validatePassword(value));
                }}
                className="w-full bg-gray-800 rounded-lg px-3 pr-10 py-2 focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((p) => ({ ...p, new: !p.new }))
                }
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <PasswordStrengthBar password={passwords.new} />
            </div>

            {}
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder={t("confirm_password") || "Підтвердьте пароль"}
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                className="w-full bg-gray-800 rounded-lg px-3 pr-10 py-2 focus:ring-2 focus:ring-blue-600"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))
                }
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-200"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={!passwordCheck.isValid}
              className={`w-full transition text-white py-2 rounded-lg ${
                passwordCheck.isValid
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 cursor-not-allowed"
              }`}
            >
              {t("confirm") || "Підтвердити"}
            </button>
          </form>
        )}


        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg transition flex items-center justify-center space-x-2"
        >
          <LogOut size={18} />
          <span>{t("logout")}</span>
        </button>
      </div>
    </div>
  );
}
