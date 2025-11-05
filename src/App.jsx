import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import HomePage from "./pages/HomePage";
import ProfilePage from "./pages/ProfilePage";
import TestsPage from "./pages/TestsPage";
import AdminPage from "./pages/AdminPage";
import AdminTestsPage from "./pages/AdminTestsPage";
import TestPage from "./pages/TestPage";
import AchievementsPage from "./pages/AchievementsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import EmailVerifyPage from "./pages/EmailVerifyPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyCertificate from "./pages/VerifyCertificate";
import MyCertificates from "./pages/MyCertificates";
import AdminEditTestPage from "./pages/AdminEditTestPage";
import TestDetailsPage from "./pages/TestDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import AdminCreateTestPage from "./pages/AdminCreateTestPage.jsx";
import AdminSMSPage from "./pages/AdminSMSPage";
import TestResultDetails from "./pages/TestResultDetails.jsx";
import GlobalLoader from "./components/GlobalLoader";

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🌀 loader зникає, коли сторінка повністю прогрузилась
    const onReady = () => setLoading(false);
    if (document.readyState === "complete") onReady();
    else window.addEventListener("load", onReady);
    return () => window.removeEventListener("load", onReady);
  }, []);

  if (loading) return <GlobalLoader />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:id" element={<TestPage />} />
          <Route path="tests/:id/details" element={<TestDetailsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="/verify/:cert_id" element={<VerifyCertificate />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route
            path="analytics"
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          <Route path="verify/:token" element={<EmailVerifyPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="my-certificates" element={<MyCertificates />} />
          <Route path="/checkout/:id" element={<CheckoutPage />} />
          <Route path="/tests/:id/result" element={<TestResultDetails />} />

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
          path="admin/tests/:id/edit"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminEditTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/tests/create"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminCreateTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/sms"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminSMSPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
export { App };
