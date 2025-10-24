import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, requiredRole = "user" }) {
    const token = localStorage.getItem("token");

    if (!token || token.split(".").length !== 3) {
        return <Navigate to="/" replace />;
    }

    try {
        const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
        const payload = JSON.parse(atob(base64));

        // 🔸 якщо потрібен адмін, а роль не admin → редірект
        if (requiredRole === "admin" && payload.role !== "admin") {
            return <Navigate to="/" replace />;
        }

        return children;
    } catch {
        return <Navigate to="/" replace />;
    }
}
