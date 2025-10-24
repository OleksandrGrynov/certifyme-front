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

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Layout />}>
                    <Route index element={<HomePage />} />
                    <Route path="tests" element={<TestsPage />} />
                    <Route path="tests/:id" element={<TestPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="achievements" element={<AchievementsPage />} />

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
            </Routes>
        </BrowserRouter>
    );
}

export default App;
