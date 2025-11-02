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
import TestDetailsPage from "./pages/TestDetailsPage"; // new
import CheckoutPage from "./pages/CheckoutPage";
import AdminCreateTestPage from "./pages/AdminCreateTestPage.jsx";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="tests" element={<TestsPage />} />
          <Route path="tests/:id" element={<TestPage />} />
          <Route path="tests/:id/details" element={<TestDetailsPage />} /> {/* add this */}
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

      </Routes>
    </BrowserRouter>
  );
}

export default App;

// add a named export alongside default to avoid import mismatches
export { App };