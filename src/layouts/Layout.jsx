import Header from "../components/Header";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import PromoSubscriptionWidget from "../components/PromoSubscriptionWidget.jsx";
export default function Layout() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Global toast container */}
            <Toaster
                position="bottom-center"
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
                    },
                    success: { iconTheme: { primary: "#22c55e", secondary: "#1e293b" } },
                    error: { iconTheme: { primary: "#ef4444", secondary: "#1e293b" } },
                }}
            />
            <Header />
            <main className="flex-grow">
                <Outlet />
              <PromoSubscriptionWidget />
            </main>
            <Footer />
        </div>
    );
}
