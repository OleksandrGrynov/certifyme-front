import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import TestsPage from "./pages/TestsPage";
import AdminPage from "./pages/AdminPage";
import AdminTestsPage from "./pages/AdminTestsPage";
import TestPage from "./pages/TestPage";
import AchievementsPage from "./pages/AchievementsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailVerifyPage from "./pages/EmailVerifyPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCertificate from "./pages/VerifyCertificate";
import MyCertificates from "./pages/MyCertificates";
import AdminEditTestPage from "./pages/AdminEditTestPage";


function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="tests" element={<TestsPage />} />
                    <Route path="tests/:id" element={<TestPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="/verify/:cert_id" element={<VerifyCertificate />} />
                    <Route path="achievements" element={<AchievementsPage />} />
                    <Route path="verify/:token" element={<EmailVerifyPage />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password/:token" element={<ResetPassword />} />
                    <Route path="my-certificates" element={<MyCertificates />} />


                    {/* 🧱 Адмін маршрути — тільки через ProtectedRoute */}
                    <Route
                        path="admin"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="admin/tests"
                        element={
                            <ProtectedRoute requiredRole="admin">
                                <AdminTestsPage />
                            </ProtectedRoute>
                        }
                    />
                </Route>
                <Route
                    path="admin/tests/:id"
                    element={
                        <ProtectedRoute requiredRole="admin">
                            <AdminEditTestPage />
                        </ProtectedRoute>
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}

export default App;
