import { lazy, Suspense } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Legal from "./pages/Legal";

const AIAssistant = lazy(() => import("./pages/AIAssistant"));
const PhoneCamera = lazy(() => import("./pages/PhoneCamera"));

function LoadingPage() {
  return <div className="flex min-h-[55vh] items-center justify-center text-sm font-semibold text-[#5f7772]">Loading DermaCare...</div>;
}

function App() {
  const location = useLocation();
  const phoneCameraMode = location.pathname === "/phone-camera";

  if (phoneCameraMode) {
    return <Suspense fallback={<LoadingPage />}><Routes><Route path="/phone-camera" element={<PhoneCamera />} /></Routes></Suspense>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed navbar */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1 pt-[73px]">
        <Suspense fallback={<LoadingPage />}><Routes>
          <Route path="/" element={<Home />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/assistant" element={<AIAssistant />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
          <Route path="/phone-camera" element={<PhoneCamera />} />
        </Routes></Suspense>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
