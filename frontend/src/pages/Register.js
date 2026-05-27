import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import '../App.css';

function Register() {
  const [form, setForm] = useState({ username: "", email: "", password: "", location: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("equilibra_visited", "true");
        navigate("/shock");
      } else if (data.user) {
        localStorage.setItem("equilibra_visited", "true");
        navigate("/shock");
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--bg-primary)", fontFamily: "var(--font-heading)" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md p-10 rounded-2xl glass-card"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.15)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Logo" className="w-16 mx-auto mb-4" />
          <h1 className="text-white text-2xl tracking-widest"
            style={{ fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
            JOIN EQUILIBRA
          </h1>
          <p className="text-xs tracking-widest mt-1" style={{ color: "rgba(255,200,200,0.7)" }}>
            BEGIN YOUR WARRIOR JOURNEY
          </p>
        </div>

        {["username", "email", "password", "location"].map((field, i) => (
          <input
            key={i}
            type={field === "password" ? "password" : "text"}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={form[field]}
            onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            className="w-full px-4 py-3 rounded-lg text-sm mb-3 outline-none"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "white",
              fontFamily: "Inter, sans-serif"
            }}
          />
        ))}

        <button
          onClick={handleRegister}
          className="w-full py-3 rounded-lg text-white text-sm tracking-widest mt-2"
          style={{
            background: "rgba(255,255,255,0.15)",
            border: "1px solid rgba(255,255,255,0.2)",
            fontFamily: "Rajdhani, sans-serif",
            fontWeight: 600,
            cursor: "pointer"
          }}
          onMouseEnter={e => e.target.style.background = "rgba(255,255,255,0.25)"}
          onMouseLeave={e => e.target.style.background = "rgba(255,255,255,0.15)"}
        >
          BECOME A WARRIOR
        </button>

        {message && (
          <p className="text-center text-sm mt-4" style={{ color: "#ffaabb" }}>{message}</p>
        )}

        <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.3)" }}>
          Already a warrior?{" "}
          <span className="cursor-pointer" onClick={() => navigate("/")}
            style={{ color: "rgba(255,200,200,0.7)" }}>
            Login
          </span>
        </p>
      </motion.div>
    </div>
  );
}

export default Register;
