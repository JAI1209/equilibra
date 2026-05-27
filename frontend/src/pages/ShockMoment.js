import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const getWeatherCondition = (code) => {
  if (code === 0) return "clear sky";
  if ([1, 2, 3].includes(code)) return "cloud cover";
  if ([45, 48].includes(code)) return "fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([95, 96, 99].includes(code)) return "storm activity";
  return "unstable weather";
};

const getShockStatement = (temperature, condition) => {
  if (temperature === null) {
    return "Your local climate signal is loading. The Earth is already speaking in real numbers.";
  }

  const roundedTemp = Math.round(temperature);

  if (temperature >= 40) {
    return `It is ${roundedTemp}\u00b0C where you are. At this heat, outdoor work, soil moisture, and vulnerable lives are under direct stress.`;
  }

  if (temperature >= 32) {
    return `It is ${roundedTemp}\u00b0C around you with ${condition}. This is the kind of heat that quietly drains water, energy, and attention.`;
  }

  if (temperature <= 5) {
    return `It is ${roundedTemp}\u00b0C around you with ${condition}. Climate pressure is not only heat; it is instability, extremes, and fragile seasons.`;
  }

  return `It is ${roundedTemp}\u00b0C around you with ${condition}. Today's climate is personal because it is already at your doorstep.`;
};

function EarthGlobeBackground() {
  return (
    <motion.svg
      className="pointer-events-none absolute inset-0 m-auto h-[680px] w-[680px] max-w-[95vw] opacity-25"
      viewBox="0 0 600 600"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 0.25, scale: 1, rotate: 360 }}
      transition={{ opacity: { duration: 1.2 }, scale: { duration: 1.2 }, rotate: { duration: 80, repeat: Infinity, ease: "linear" } }}
      aria-hidden="true"
    >
      <circle cx="300" cy="300" r="214" fill="rgba(255,255,255,0.035)" stroke="rgba(255,255,255,0.28)" strokeWidth="2" />
      <ellipse cx="300" cy="300" rx="214" ry="78" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
      <ellipse cx="300" cy="300" rx="120" ry="214" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <ellipse cx="300" cy="300" rx="214" ry="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
      <path
        d="M215 187 C245 160 300 167 320 203 C341 241 289 248 276 284 C263 319 308 345 282 379 C254 416 188 389 179 337 C169 281 170 226 215 187Z"
        fill="rgba(52,211,153,0.28)"
      />
      <path
        d="M355 174 C410 185 449 235 436 286 C426 326 374 318 361 355 C348 393 393 415 362 448 C331 480 267 447 275 400 C285 342 336 333 324 286 C313 240 323 188 355 174Z"
        fill="rgba(253,230,138,0.18)"
      />
      <path
        d="M211 424 C239 445 288 464 326 456 C353 451 360 485 330 499 C282 521 214 492 184 454 C166 431 185 405 211 424Z"
        fill="rgba(52,211,153,0.2)"
      />
    </motion.svg>
  );
}

function ShockMoment() {
  const navigate = useNavigate();
  const [climate, setClimate] = useState({
    temperature: null,
    condition: "local weather",
    coordinates: "",
    status: "loading",
    error: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchClimate = async ({ latitude, longitude }) => {
      const params = new URLSearchParams({
        latitude: String(latitude),
        longitude: String(longitude),
        current: "temperature_2m,weather_code",
        timezone: "auto",
      });

      const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.reason || "Could not load climate data");
      }

      if (!isMounted) return;

      setClimate({
        temperature: data.current?.temperature_2m ?? null,
        condition: getWeatherCondition(data.current?.weather_code),
        coordinates: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
        status: "ready",
        error: "",
      });
    };

    if (!navigator.geolocation) {
      setClimate((current) => ({
        ...current,
        status: "error",
        error: "Geolocation is not available in this browser.",
      }));
      return () => {
        isMounted = false;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchClimate(position.coords).catch((err) => {
          if (!isMounted) return;
          setClimate((current) => ({ ...current, status: "error", error: err.message }));
        });
      },
      () => {
        if (!isMounted) return;
        setClimate((current) => ({
          ...current,
          status: "error",
          error: "Allow location access to see your local climate signal.",
        }));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );

    return () => {
      isMounted = false;
    };
  }, []);

  const shockStatement = useMemo(
    () => getShockStatement(climate.temperature, climate.condition),
    [climate.temperature, climate.condition]
  );

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-6" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-heading)" }}>
      <EarthGlobeBackground />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="relative z-10 max-w-3xl text-center p-10 rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.055)",
          border: "1px solid rgba(255,255,255,0.14)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xs tracking-widest mb-5"
          style={{ color: "rgba(255,200,200,0.75)", fontFamily: "Rajdhani, sans-serif" }}
        >
          YOUR CLIMATE SIGNAL
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.45 }}
          className="text-white text-3xl md:text-4xl mb-6"
          style={{ fontFamily: "Rajdhani, sans-serif", lineHeight: 1.35 }}
        >
          {shockStatement}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.1 }}
          className="grid gap-4 my-10 md:grid-cols-3"
        >
          {[
            {
              value: climate.temperature === null ? "--" : `${Math.round(climate.temperature)}\u00b0C`,
              label: "Current temperature",
            },
            {
              value: climate.status === "ready" ? climate.condition : "checking",
              label: "Weather condition",
            },
            {
              value: climate.coordinates || "near you",
              label: "Location signal",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl"
              style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "Rajdhani, sans-serif" }}>
                {stat.value}
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {climate.status === "error" && (
          <p className="mb-6 text-sm" style={{ color: "#ffd1dc", fontFamily: "Inter, sans-serif" }}>
            {climate.error}
          </p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.6 }}
          className="text-lg mb-10"
          style={{ color: "rgba(255,200,200,0.8)", fontFamily: "Inter, sans-serif" }}
        >
          Do you want to do something about it?
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.9 }}
          className="flex flex-col gap-4 justify-center sm:flex-row"
        >
          <button
            onClick={() => navigate("/dashboard")}
            className="px-8 py-3 rounded-lg text-white tracking-widest text-sm"
            style={{
              background: "rgba(255,255,255,0.16)",
              border: "1px solid rgba(255,255,255,0.3)",
              fontFamily: "Rajdhani, sans-serif",
              cursor: "pointer",
            }}
          >
            YES - TAKE ME TO ACTION
          </button>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3 rounded-lg tracking-widest text-sm"
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.38)",
              fontFamily: "Rajdhani, sans-serif",
              cursor: "pointer",
            }}
          >
            NOT NOW
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default ShockMoment;
