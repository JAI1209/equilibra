import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiPlus, FiUsers } from "react-icons/fi";

const glassCard = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
};

const pillarOptions = ["Earth", "Mind", "Connect", "Universe", "Action"];

function TeamMissions() {
    const navigate = useNavigate();
    const [teamMissions, setTeamMissions] = useState([]);
    const [form, setForm] = useState({
        title: "",
        description: "",
        pillar: "Earth",
        max_members: 4,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [joiningId, setJoiningId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const canCreate = useMemo(
        () => form.title.trim() && form.description.trim() && Number(form.max_members) >= 2 && Number(form.max_members) <= 10,
        [form]
    );

    const getToken = useCallback(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/");
            return null;
        }

        return token;
    }, [navigate]);

    const fetchTeamMissions = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const res = await fetch("http://localhost:5000/api/team-missions", {
                headers: { Authorization: token },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not load team missions");
            }

            setTeamMissions(data.team_missions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchTeamMissions();
    }, [fetchTeamMissions]);

    const updateForm = (field, value) => {
        setForm((current) => ({ ...current, [field]: value }));
    };

    const handleCreateMission = async () => {
        const token = getToken();
        if (!token || !canCreate) return;

        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("http://localhost:5000/api/team-missions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({
                    title: form.title,
                    description: form.description,
                    pillar: form.pillar,
                    max_members: Number(form.max_members),
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not create team mission");
            }

            setTeamMissions((current) => [data.team_mission, ...current]);
            setForm({ title: "", description: "", pillar: "Earth", max_members: 4 });
            setMessage("Team mission created.");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleJoinMission = async (missionId) => {
        const token = getToken();
        if (!token) return;

        setJoiningId(missionId);
        setError("");
        setMessage("");

        try {
            const res = await fetch(`http://localhost:5000/api/team-missions/${missionId}/join`, {
                method: "POST",
                headers: { Authorization: token },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not join team mission");
            }

            setTeamMissions((current) =>
                current.map((mission) => (mission.id === missionId ? data.team_mission : mission))
            );
            setMessage("Joined team mission.");
        } catch (err) {
            setError(err.message);
        } finally {
            setJoiningId(null);
        }
    };

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
                                TEAM MISSIONS
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-widest text-white">Collective Earth Action</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "rgba(255,255,255,0.52)" }}>
                                Create an open mission, gather a small team, and move the pillar forward together.
                            </p>
                        </div>
                        <div
                            className="grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white"
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}
                        >
                            <FiUsers />
                        </div>
                    </div>
                </motion.header>

                <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1 }}
                        className="rounded-2xl p-7"
                        style={glassCard}
                    >
                        <h2 className="mb-5 text-lg font-bold tracking-widest text-white">CREATE TEAM MISSION</h2>

                        <div className="space-y-4">
                            <input
                                value={form.title}
                                onChange={(event) => updateForm("title", event.target.value)}
                                placeholder="Mission title"
                                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                            />

                            <textarea
                                value={form.description}
                                onChange={(event) => updateForm("description", event.target.value)}
                                placeholder="Mission description"
                                className="h-32 w-full resize-none rounded-lg px-4 py-3 text-sm leading-6 text-white outline-none"
                                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)" }}
                            />

                            <select
                                value={form.pillar}
                                onChange={(event) => updateForm("pillar", event.target.value)}
                                className="w-full rounded-lg px-4 py-3 text-sm text-white outline-none"
                                style={{ background: "#810B38", border: "1px solid rgba(255,255,255,0.14)" }}
                            >
                                {pillarOptions.map((pillar) => (
                                    <option key={pillar} value={pillar}>
                                        {pillar}
                                    </option>
                                ))}
                            </select>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.5)" }}>
                                        MAX MEMBERS
                                    </label>
                                    <span className="text-white">{form.max_members}</span>
                                </div>
                                <input
                                    type="range"
                                    min="2"
                                    max="10"
                                    value={form.max_members}
                                    onChange={(event) => updateForm("max_members", event.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>

                        {(message || error) && (
                            <p className="mt-4 text-sm" style={{ color: error ? "#ffd1dc" : "rgba(187,247,208,0.9)" }}>
                                {error || message}
                            </p>
                        )}

                        <button
                            onClick={handleCreateMission}
                            disabled={!canCreate || isSaving}
                            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm tracking-widest text-white"
                            style={{
                                background: canCreate && !isSaving ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.18)",
                                cursor: canCreate && !isSaving ? "pointer" : "not-allowed",
                            }}
                        >
                            <FiPlus />
                            {isSaving ? "CREATING..." : "CREATE MISSION"}
                        </button>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2 }}
                        className="rounded-2xl p-7"
                        style={glassCard}
                    >
                        <h2 className="mb-5 text-lg font-bold tracking-widest text-white">ACTIVE TEAM MISSIONS</h2>

                        <div className="space-y-4">
                            {isLoading && (
                                <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                    Loading team missions...
                                </div>
                            )}

                            {!isLoading && teamMissions.length === 0 && (
                                <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                    No active team missions yet.
                                </div>
                            )}

                            {!isLoading &&
                                teamMissions.map((mission, index) => (
                                    <motion.div
                                        key={mission.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="rounded-xl p-5"
                                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                                    >
                                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                            <div>
                                                <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                                                    {mission.pillar}
                                                </p>
                                                <h3 className="mt-1 text-xl font-bold tracking-wider text-white">{mission.title}</h3>
                                                <p className="mt-2 text-sm leading-6" style={{ color: "rgba(255,255,255,0.52)" }}>
                                                    {mission.description}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => handleJoinMission(mission.id)}
                                                disabled={mission.is_member || mission.status !== "open" || joiningId === mission.id}
                                                className="rounded-lg px-4 py-2 text-xs tracking-widest text-white"
                                                style={{
                                                    background: mission.is_member ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.14)",
                                                    border: "1px solid rgba(255,255,255,0.16)",
                                                    cursor: mission.is_member || mission.status !== "open" ? "default" : "pointer",
                                                }}
                                            >
                                                {mission.is_member ? "JOINED" : joiningId === mission.id ? "JOINING..." : "JOIN"}
                                            </button>
                                        </div>

                                        <div className="mt-5">
                                            <div className="mb-2 flex items-center justify-between text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.48)" }}>
                                                <span>
                                                    {mission.member_count}/{mission.max_members} MEMBERS
                                                </span>
                                                <span>{mission.progress}%</span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.24)" }}>
                                                <motion.div
                                                    className="h-full rounded-full"
                                                    style={{ background: "linear-gradient(90deg, #FDE68A, #34D399)" }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${mission.progress}%` }}
                                                    transition={{ duration: 0.65, ease: "easeOut" }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}

export default TeamMissions;
