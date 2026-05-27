import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Dashboard from "./pages/Dashboard";
import ShockMoment from "./pages/ShockMoment";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Rankings from "./pages/Rankings";
import Journal from "./pages/Journal";
import TeamMissions from "./pages/TeamMissions";
import Feed from "./pages/Feed";
import './App.css';

function LoginPage() {
  const [showIntro, setShowIntro] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        if (localStorage.getItem("equilibra_visited")) {
          navigate("/dashboard");
        } else {
          localStorage.setItem("equilibra_visited", "true");
          navigate("/shock");
        }
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  if (showIntro) {
    return (
      <div className="intro-container">
        <img src="/intro.png" alt="Equilibra" className="intro-logo" />
        <div className="intro-title">EQUILIBRA</div>
        <div className="intro-tagline">INFINITY BALANCES INFINITY</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-10 rounded-2xl glass-card"
      >
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 mx-auto mb-4" />
          <h1 className="text-white text-2xl tracking-widest"
            style={{ fontFamily: "var(--font-heading)", fontWeight: 600 }}>
            EQUILIBRA
          </h1>
          <p className="text-xs tracking-widest mt-1" style={{ color: "rgba(255,200,200,0.7)" }}>
            INFINITY BALANCES INFINITY
          </p>
        </div>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm mb-3 outline-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            fontFamily: "var(--font-body)"
          }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-lg text-sm mb-5 outline-none"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "white",
            fontFamily: "var(--font-body)"
          }}
        />
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-lg text-white text-sm tracking-widest transition-all duration-300"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            cursor: "pointer"
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}
        >
          LOGIN
        </button>

        {message && (
          <p className="text-center text-sm mt-4" style={{ color: "#ffaabb" }}>
            {message}
          </p>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
          New warrior? <span
            className="cursor-pointer"
            onClick={() => navigate("/register")}
            style={{ color: "rgba(255,200,200,0.7)" }}>
            Register
          </span>
        </p>
      </motion.div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/rankings" element={<Rankings />} />
        <Route path="/journal" element={<Journal />} />
        <Route path="/team-missions" element={<TeamMissions />} />
        <Route path="/shock" element={<ShockMoment />} />
        <Route path="/register" element={<Register />} />
        <Route path="/feed" element={<Feed />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;