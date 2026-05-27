import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiAward, FiMapPin, FiTrendingUp } from "react-icons/fi";

const glassCard = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
};

const rankAccent = (rank) => {
    if (rank === 1) return "rgba(253,230,138,0.22)";
    if (rank === 2) return "rgba(226,232,240,0.18)";
    if (rank === 3) return "rgba(251,146,60,0.18)";
    return "rgba(255,255,255,0.08)";
};

function Rankings() {
    const navigate = useNavigate();
    const [rankings, setRankings] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchRankings = async () => {
            try {
                const res = await fetch("http://localhost:5000/api/rankings");
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Could not load rankings");
                }

                setRankings(data.rankings || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRankings();
    }, []);

    return (
        <div className="min-h-screen px-6 py-8" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-heading)" }}>
            <div className="mx-auto max-w-6xl">
                <div className="mb-8 flex items-center justify-between">
                    <button
                        onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm tracking-widest text-white"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                    >
                        <FiArrowLeft />
                        DASHBOARD
                    </button>
                    <img src="/logo.png" alt="Equilibra" className="h-10 w-10" />
                </div>

                <motion.header
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="mb-6 rounded-2xl p-7"
                    style={glassCard}
                >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                                GLOBAL RANKING
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-widest text-white">Top Warriors</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "rgba(255,255,255,0.52)" }}>
                                The ten highest Warriorship Scores across Equilibra.
                            </p>
                        </div>
                        <div
                            className="grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white"
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}
                        >
                            <FiTrendingUp />
                        </div>
                    </div>
                </motion.header>

                {error && (
                    <div className="mb-6 rounded-lg p-4 text-sm text-white" style={glassCard}>
                        {error}
                    </div>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.1 }}
                    className="rounded-2xl p-5"
                    style={glassCard}
                >
                    <div className="hidden grid-cols-[80px_1fr_1fr_150px_190px] gap-4 px-4 pb-3 text-xs tracking-widest md:grid" style={{ color: "rgba(255,255,255,0.45)" }}>
                        <span>RANK</span>
                        <span>WARRIOR</span>
                        <span>LOCATION</span>
                        <span>SCORE</span>
                        <span>LEVEL</span>
                    </div>

                    <div className="space-y-3">
                        {isLoading && (
                            <div className="rounded-xl p-5 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                Loading rankings...
                            </div>
                        )}

                        {!isLoading && rankings.length === 0 && (
                            <div className="rounded-xl p-5 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                No warriors ranked yet.
                            </div>
                        )}

                        {!isLoading &&
                            rankings.map((warrior, index) => (
                                <motion.div
                                    key={`${warrior.rank}-${warrior.username}`}
                                    initial={{ opacity: 0, x: -14 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="grid gap-4 rounded-xl p-4 md:grid-cols-[80px_1fr_1fr_150px_190px] md:items-center"
                                    style={{
                                        background: rankAccent(warrior.rank),
                                        border: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="grid h-10 w-10 place-items-center rounded-xl text-lg font-bold text-white"
                                            style={{ background: "rgba(0,0,0,0.18)", border: "1px solid rgba(255,255,255,0.12)" }}
                                        >
                                            {warrior.rank}
                                        </span>
                                        <span className="text-xs tracking-widest md:hidden" style={{ color: "rgba(255,255,255,0.48)" }}>
                                            RANK
                                        </span>
                                    </div>

                                    <div>
                                        <p className="font-bold tracking-wider text-white">{warrior.username}</p>
                                        <p className="mt-1 text-xs tracking-widest md:hidden" style={{ color: "rgba(255,255,255,0.42)" }}>
                                            WARRIOR
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
                                        <FiMapPin />
                                        {warrior.location}
                                    </div>

                                    <div>
                                        <p className="text-2xl font-bold text-white">{warrior.score}</p>
                                        <p className="text-xs tracking-widest md:hidden" style={{ color: "rgba(255,255,255,0.42)" }}>
                                            SCORE
                                        </p>
                                    </div>

                                    <div
                                        className="flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs tracking-widest text-white"
                                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.12)" }}
                                    >
                                        <FiAward className="text-amber-200" />
                                        {warrior.warrior_level}
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

export default Rankings;
