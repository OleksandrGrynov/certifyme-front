import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import AuthModal from "./AuthModal";

export default function ProtectedRoute({ children, requiredRole = "user" }) {
  const [showAuth, setShowAuth] = useState(false);
  const [checked, setChecked] = useState(false);
  const [isValidUser, setIsValidUser] = useState(false);
  const toastShownRef = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token || token.split(".").length !== 3) {
      if (!toastShownRef.current) {
        toast.error("Будь ласка, зареєструйтеся або увійдіть, щоб переглянути цю сторінку 💚", {
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid #22c55e",
          },
        });
        toastShownRef.current = true;
      }
      setShowAuth(true);
      setChecked(true);
      return;
    }

    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

      if (requiredRole === "admin" && payload.role !== "admin") {
        if (!toastShownRef.current) {
          toast.error("У вас немає доступу до цієї сторінки 🚫", {
            style: {
              background: "#111",
              color: "#fff",
              border: "1px solid #ef4444",
            },
          });
          toastShownRef.current = true;
        }
        setChecked(true);
        setIsValidUser(false);
        return;
      }

      setIsValidUser(true);
    } catch {
      if (!toastShownRef.current) {
        toast.error("Будь ласка, увійдіть знову 💚", {
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid #22c55e",
          },
        });
        toastShownRef.current = true;
      }
      setShowAuth(true);
    } finally {
      setChecked(true);
    }
  }, [requiredRole]);

  const handleModalClose = () => {
    setShowAuth(false);
    navigate("/");
  };

  if (!checked)
    return (
      <div className="flex justify-center items-center h-screen text-gray-400">Завантаження...</div>
    );

  if (!isValidUser) {
    return (
      <>
        <Toaster position="top-center" />
        {showAuth && <AuthModal isOpen={showAuth} onClose={handleModalClose} />}
      </>
    );
  }

  return children;
}
