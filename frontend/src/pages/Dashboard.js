import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GiEarthAmerica } from "react-icons/gi";
import { BiBrain } from "react-icons/bi";
import { AiOutlineHeart } from "react-icons/ai";
import { BsStars, BsLightningCharge } from "react-icons/bs";
import { FiRss, FiUsers, FiAward, FiBell, FiBookOpen, FiCheck, FiCloud, FiImage, FiMapPin, FiUpload, FiUser, FiX } from "react-icons/fi";

const dailyMission = {
    id: 1,
    title: "Plant a tree today",
    description: "Go outside and plant one tree in your area. Take a photo as proof.",
    pillar: "EARTH",
    difficulty: "EASY",
    points: 10,
};

const getWeatherCondition = (code) => {
    if (code === 0) return "Clear sky";
    if ([1, 2, 3].includes(code)) return "Partly cloudy";
    if ([45, 48].includes(code)) return "Fog";
    if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
    if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
    if ([95, 96, 99].includes(code)) return "Thunderstorm";
    return "Weather shifting";
};

function AnimatedTemperature({ value }) {
    const motionValue = useMotionValue(0);
    const rounded = useTransform(motionValue, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(motionValue, value ?? 0, {
            duration: 0.9,
            ease: "easeOut",
        });

        return controls.stop;
    }, [motionValue, value]);

    return <motion.span>{rounded}</motion.span>;
}

function Dashboard() {
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [proofFile, setProofFile] = useState(null);
    const [proofPreview, setProofPreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [completionError, setCompletionError] = useState("");
    const [isComplete, setIsComplete] = useState(false);
    const [warriorshipScore, setWarriorshipScore] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [climate, setClimate] = useState({
        temperature: null,
        condition: "",
        locationLabel: "Using your location",
        status: "loading",
        error: "",
    });

    const canSubmit = useMemo(() => proofFile && !isSubmitting, [proofFile, isSubmitting]);
    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.is_read).length,
        [notifications]
    );

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const loadNotifications = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/notifications", {
                    headers: { Authorization: token },
                });
                const data = await res.json();

                if (res.ok) {
                    setNotifications(data.notifications || []);
                }
            } catch {
                setNotifications([]);
            }
        };

        loadNotifications();
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadClimate = async ({ latitude, longitude }) => {
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
                locationLabel: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
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
                loadClimate(position.coords).catch((err) => {
                    if (!isMounted) return;
                    setClimate((current) => ({ ...current, status: "error", error: err.message }));
                });
            },
            () => {
                if (!isMounted) return;
                setClimate((current) => ({
                    ...current,
                    status: "error",
                    error: "Allow location access to view local climate data.",
                }));
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
        );

        return () => {
            isMounted = false;
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/");
    };

    const handleNotificationClick = async (notificationId) => {
        const token = localStorage.getItem("token");

        setNotifications((current) =>
            current.map((notification) =>
                notification.id === notificationId ? { ...notification, is_read: true } : notification
            )
        );

        if (!token) return;

        try {
            await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
                method: "PATCH",
                headers: { Authorization: token },
            });
        } catch {
            // Optimistic read state is enough for this lightweight bell.
        }
    };

    const resetModal = () => {
        setProofFile(null);
        setProofPreview("");
        setCompletionError("");
        setIsComplete(false);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        resetModal();
    };

    const handleProofChange = (event) => {
        const file = event.target.files?.[0];
        setCompletionError("");

        if (!file) {
            setProofFile(null);
            setProofPreview("");
            return;
        }

        if (!file.type.startsWith("image/")) {
            setCompletionError("Please upload a photo proof.");
            setProofFile(null);
            setProofPreview("");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProofFile(file);
            setProofPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    const handleCompleteMission = async () => {
        if (!canSubmit) return;

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/");
            return;
        }

        setIsSubmitting(true);
        setCompletionError("");

        try {
            const res = await fetch("http://localhost:5000/api/missions/complete", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({
                    missionId: dailyMission.id,
                    proof: {
                        fileName: proofFile.name,
                        mimeType: proofFile.type,
                        dataUrl: proofPreview,
                    },
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Could not complete mission");
            }

            setWarriorshipScore(data.warriorshipScore ?? warriorshipScore + dailyMission.points);
            setIsComplete(true);
        } catch (err) {
            setCompletionError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-heading)" }}>
            <div
                className="w-64 min-h-screen p-6 flex flex-col gap-4"
                style={{ background: "rgba(0,0,0,0.3)", borderRight: "1px solid rgba(255,255,255,0.1)" }}
            >
                <div className="text-center mb-6">
                    <img src="/logo.png" alt="Logo" className="w-10 mx-auto mb-2" />
                    <h2 className="text-white text-sm tracking-widest">EQUILIBRA</h2>
                </div>

                {[
                    { icon: <GiEarthAmerica />, label: "EARTH" },
                    { icon: <BiBrain />, label: "MIND" },
                    { icon: <AiOutlineHeart />, label: "CONNECT" },
                    { icon: <BsStars />, label: "UNIVERSE" },
                    { icon: <BsLightningCharge />, label: "ACTION" },
                    { icon: <FiUser />, label: "PROFILE", path: "/profile" },
                    { icon: <FiAward />, label: "RANKINGS", path: "/rankings" },
                    { icon: <FiBookOpen />, label: "JOURNAL", path: "/journal" },
                    { icon: <FiUsers />, label: "TEAM MISSIONS", path: "/team-missions" },
                    { icon: <FiRss />, label: "FEED", path: "/feed" },
                ].map((item, i) => (
                    <div
                        key={item.label}
                        onClick={() => item.path && navigate(item.path)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-all duration-300"
                        style={{
                            background: i === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                        }}
                    >
                        <span className="text-white">{item.icon}</span>
                        <span className="text-white text-sm tracking-widest">{item.label}</span>
                    </div>
                ))}

                <div className="mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full py-2 rounded-lg text-xs tracking-widest"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            color: "rgba(255,255,255,0.4)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            cursor: "pointer",
                        }}
                    >
                        LOGOUT
                    </button>
                </div>
            </div>

            <div className="flex-1 p-8">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-white text-2xl tracking-widest">EARTH PILLAR</h1>
                        <p className="text-xs tracking-widest mt-1" style={{ color: "rgba(255,200,200,0.7)" }}>
                            AWARENESS - LAYER 1
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
                                className="relative grid h-11 w-11 place-items-center rounded-lg text-white"
                                aria-label="Notifications"
                                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                            >
                                <FiBell />
                                {unreadCount > 0 && (
                                    <span
                                        className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-bold text-white"
                                        style={{ background: "#ef4444" }}
                                    >
                                        {unreadCount}
                                    </span>
                                )}
                            </button>

                            <AnimatePresence>
                                {isNotificationsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                        className="absolute right-0 z-40 mt-3 w-80 rounded-xl p-3"
                                        style={{
                                            background: "rgba(129,11,56,0.98)",
                                            border: "1px solid rgba(255,255,255,0.16)",
                                            boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                                            backdropFilter: "blur(16px)",
                                        }}
                                    >
                                        <p className="px-2 pb-2 text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                                            NOTIFICATIONS
                                        </p>
                                        <div className="space-y-2">
                                            {notifications.length === 0 && (
                                                <div className="rounded-lg p-3 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.52)" }}>
                                                    No notifications yet.
                                                </div>
                                            )}

                                            {notifications.map((notification) => (
                                                <button
                                                    key={notification.id}
                                                    onClick={() => handleNotificationClick(notification.id)}
                                                    className="w-full rounded-lg p-3 text-left text-sm text-white"
                                                    style={{
                                                        background: notification.is_read ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.12)",
                                                        border: "1px solid rgba(255,255,255,0.08)",
                                                        color: notification.is_read ? "rgba(255,255,255,0.52)" : "white",
                                                    }}
                                                >
                                                    {notification.message}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        <div
                            className="flex items-center gap-3 px-4 py-2 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
                        >
                            <span className="text-emerald-200">+</span>
                            <span className="text-white text-sm">Earth Seedling - Level 1</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="col-span-2 p-6 rounded-2xl"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <p className="text-xs tracking-widest mb-4" style={{ color: "rgba(255,200,200,0.7)" }}>
                            TODAY'S MISSION
                        </p>
                        <h2 className="text-white text-xl mb-2">{dailyMission.title}</h2>
                        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
                            {dailyMission.description}
                        </p>
                        <div className="flex gap-3">
                            {[dailyMission.pillar, dailyMission.difficulty, `+${dailyMission.points} PTS`].map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full text-xs"
                                    style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-6 px-6 py-2 rounded-lg text-white text-sm tracking-widest"
                            style={{
                                background: "rgba(255,255,255,0.15)",
                                border: "1px solid rgba(255,255,255,0.2)",
                                cursor: "pointer",
                            }}
                        >
                            COMPLETE MISSION
                        </button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="p-6 rounded-2xl text-center"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <p className="text-xs tracking-widest mb-4" style={{ color: "rgba(255,200,200,0.7)" }}>
                            WARRIORSHIP SCORE
                        </p>
                        <motion.div
                            key={warriorshipScore}
                            initial={{ scale: 0.85, opacity: 0.7 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 18 }}
                            className="text-5xl font-bold text-white mb-2"
                        >
                            {warriorshipScore}
                        </motion.div>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                            Complete missions to earn points
                        </p>
                        <div className="mt-4 text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                            <div>Earth Impact - 40%</div>
                            <div>Effort - 30%</div>
                            <div>Consistency - 30%</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="col-span-3 p-6 rounded-2xl"
                        style={{
                            background: "rgba(255,255,255,0.05)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                            <div>
                                <div className="mb-3 flex items-center gap-3">
                                    <div
                                        className="grid h-11 w-11 place-items-center rounded-xl text-xl text-white"
                                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.14)" }}
                                    >
                                        <FiCloud />
                                    </div>
                                    <div>
                                        <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                                            LOCAL CLIMATE
                                        </p>
                                        <div className="mt-1 flex items-center gap-2 text-xs" style={{ color: "rgba(255,255,255,0.42)" }}>
                                            <FiMapPin />
                                            <span>{climate.locationLabel}</span>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm" style={{ color: "rgba(255,255,255,0.52)" }}>
                                    {climate.status === "loading" && "Requesting location and climate data..."}
                                    {climate.status === "ready" && climate.condition}
                                    {climate.status === "error" && climate.error}
                                </p>
                            </div>

                            <div className="text-left md:text-right">
                                <div className="text-5xl font-bold text-white">
                                    {climate.temperature === null ? (
                                        "--"
                                    ) : (
                                        <>
                                            <AnimatedTemperature value={climate.temperature} />
                                            <span className="text-3xl">°C</span>
                                        </>
                                    )}
                                </div>
                                <p className="mt-2 text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.42)" }}>
                                    OPEN-METEO LIVE FORECAST
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center px-4"
                        style={{ background: "rgba(12, 2, 8, 0.72)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 18, scale: 0.96 }}
                            transition={{ type: "spring", stiffness: 220, damping: 22 }}
                            className="w-full max-w-md rounded-2xl p-6"
                            style={{
                                background: "rgba(129,11,56,0.96)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                            }}
                        >
                            {!isComplete ? (
                                <>
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-xs tracking-widest mb-2" style={{ color: "rgba(255,200,200,0.72)" }}>
                                                PHOTO PROOF
                                            </p>
                                            <h3 className="text-white text-xl tracking-wider">Complete Mission</h3>
                                        </div>
                                        <button
                                            onClick={closeModal}
                                            className="grid h-9 w-9 place-items-center rounded-lg text-white"
                                            aria-label="Close mission proof modal"
                                            style={{
                                                background: "rgba(255,255,255,0.08)",
                                                border: "1px solid rgba(255,255,255,0.12)",
                                            }}
                                        >
                                            <FiX />
                                        </button>
                                    </div>

                                    <label
                                        className="mt-6 flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center"
                                        style={{ borderColor: "rgba(255,255,255,0.22)", background: "rgba(255,255,255,0.06)" }}
                                    >
                                        {proofPreview ? (
                                            <img src={proofPreview} alt="Mission proof preview" className="h-48 w-full rounded-lg object-cover" />
                                        ) : (
                                            <>
                                                <FiImage className="mb-3 text-4xl text-white" />
                                                <span className="text-white text-sm tracking-widest">UPLOAD PHOTO</span>
                                                <span className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.46)" }}>
                                                    JPG, PNG, or any image file
                                                </span>
                                            </>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                                    </label>

                                    {completionError && (
                                        <p className="mt-4 text-sm" style={{ color: "#ffd1dc" }}>
                                            {completionError}
                                        </p>
                                    )}

                                    <button
                                        onClick={handleCompleteMission}
                                        disabled={!canSubmit}
                                        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm tracking-widest text-white transition-all"
                                        style={{
                                            background: canSubmit ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.08)",
                                            border: "1px solid rgba(255,255,255,0.18)",
                                            cursor: canSubmit ? "pointer" : "not-allowed",
                                        }}
                                    >
                                        <FiUpload />
                                        {isSubmitting ? "SUBMITTING..." : "SUBMIT PROOF"}
                                    </button>
                                </>
                            ) : (
                                <motion.div className="py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <motion.div
                                        className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full text-4xl text-white"
                                        style={{ background: "rgba(34,197,94,0.26)", border: "1px solid rgba(187,247,208,0.5)" }}
                                        initial={{ scale: 0.2, rotate: -40 }}
                                        animate={{ scale: [0.2, 1.14, 1], rotate: 0 }}
                                        transition={{ duration: 0.7, ease: "easeOut" }}
                                    >
                                        <FiCheck />
                                    </motion.div>
                                    <motion.h3
                                        className="text-2xl font-bold tracking-widest text-white"
                                        initial={{ y: 12, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.15 }}
                                    >
                                        MISSION COMPLETE
                                    </motion.h3>
                                    <motion.p
                                        className="mt-3 text-lg text-white"
                                        initial={{ y: 12, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        transition={{ delay: 0.25 }}
                                    >
                                        +10 points added to Warriorship Score
                                    </motion.p>
                                    <button
                                        onClick={closeModal}
                                        className="mt-7 rounded-lg px-6 py-2 text-sm tracking-widest text-white"
                                        style={{ background: "rgba(255,255,255,0.16)", border: "1px solid rgba(255,255,255,0.18)" }}
                                    >
                                        DONE
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Dashboard;
