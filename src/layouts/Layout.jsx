import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PromoSubscriptionWidget from "../components/PromoSubscriptionWidget.jsx";
import AchievementListener from "../components/AchievementListener.jsx";
import ContactModal from "../components/ContactModal.jsx";
import AuthModal from "../components/AuthModal.jsx";

export default function Layout() {
  
  const [showModal, setShowModal] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  const handleLoginSuccess = () => {
    localStorage.setItem("isAuthenticated", "true");
    setShowAuth(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#111827",
            color: "#f9fafb",
            border: "1px solid #374151",
            padding: "12px 16px",
            borderRadius: "12px",
            fontSize: "15px",
            transform: "scale(1)",
            transition: "all 0.3s ease",
            zIndex: 999999,
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
        }}
      />

      <AchievementListener />

      {}
      <Header
        onShowContact={() => setShowModal(true)}
        onShowAuth={() => setShowAuth(true)}
      />

      <main className="flex-grow pt-[40px]">
        <Outlet />
        <PromoSubscriptionWidget />
      </main>

      <Footer />

      {}
      <ContactModal isOpen={showModal} onClose={() => setShowModal(false)} />
      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
