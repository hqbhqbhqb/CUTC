import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";

import Home from "./pages/Home";
import Profile from "./pages/Profile";
import AIAssistant from "./pages/AIAssistant";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Legal from "./pages/Legal";

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Fixed navbar */}
      <Navbar />

      {/* Page content */}
      <main className="flex-1 pt-[73px]">
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/profile" element={<Profile />} />

          <Route path="/assistant" element={<AIAssistant />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />
          <Route path="/terms" element={<Legal type="terms" />} />
          <Route path="/privacy" element={<Legal type="privacy" />} />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default App;
