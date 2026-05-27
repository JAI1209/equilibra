import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiBookOpen, FiCalendar, FiSave } from "react-icons/fi";

const glassCard = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
};

const formatEntryDate = (date) => {
    if (!date) return "Today";

    return new Date(date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

function Journal() {
    const navigate = useNavigate();
    const [entryText, setEntryText] = useState("");
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const remainingCharacters = useMemo(() => 800 - entryText.length, [entryText]);

    const fetchEntries = useCallback(async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/");
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/journal", {
                headers: { Authorization: token },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not load journal entries");
            }

            setEntries(data.entries || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchEntries();
    }, [fetchEntries]);

    const handleSave = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/");
            return;
        }

        if (!entryText.trim()) {
            setError("Write a journal entry before saving.");
            setMessage("");
            return;
        }

        setIsSaving(true);
        setError("");
        setMessage("");

        try {
            const res = await fetch("http://localhost:5000/api/journal", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({ entry_text: entryText }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Could not save journal entry");
            }

            setEntries((current) => [data.entry, ...current].slice(0, 7));
            setEntryText("");
            setMessage("Journal entry saved.");
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSaving(false);
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
                                PERSONAL EARTH JOURNAL
                            </p>
                            <h1 className="mt-2 text-3xl font-bold tracking-widest text-white">Daily Earth Reflection</h1>
                            <p className="mt-3 max-w-2xl text-sm leading-6" style={{ color: "rgba(255,255,255,0.52)" }}>
                                What did I do for Earth today?
                            </p>
                        </div>
                        <div
                            className="grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white"
                            style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}
                        >
                            <FiBookOpen />
                        </div>
                    </div>
                </motion.header>

                <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1 }}
                        className="rounded-2xl p-7"
                        style={glassCard}
                    >
                        <label className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                            TODAY'S ENTRY
                        </label>
                        <textarea
                            value={entryText}
                            onChange={(event) => setEntryText(event.target.value.slice(0, 800))}
                            placeholder="What did I do for Earth today?"
                            className="mt-4 h-64 w-full resize-none rounded-xl p-4 text-sm leading-6 text-white outline-none"
                            style={{
                                background: "rgba(255,255,255,0.08)",
                                border: "1px solid rgba(255,255,255,0.14)",
                            }}
                        />

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.42)" }}>
                                {remainingCharacters} CHARACTERS LEFT
                            </p>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm tracking-widest text-white"
                                style={{
                                    background: isSaving ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.16)",
                                    border: "1px solid rgba(255,255,255,0.18)",
                                    cursor: isSaving ? "not-allowed" : "pointer",
                                }}
                            >
                                <FiSave />
                                {isSaving ? "SAVING..." : "SAVE ENTRY"}
                            </button>
                        </div>

                        {(message || error) && (
                            <p className="mt-4 text-sm" style={{ color: error ? "#ffd1dc" : "rgba(187,247,208,0.9)" }}>
                                {error || message}
                            </p>
                        )}
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2 }}
                        className="rounded-2xl p-7"
                        style={glassCard}
                    >
                        <div className="mb-5 flex items-center gap-3">
                            <FiCalendar className="text-xl text-white" />
                            <h2 className="text-lg font-bold tracking-widest text-white">LAST 7 ENTRIES</h2>
                        </div>

                        <div className="space-y-3">
                            {isLoading && (
                                <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                    Loading journal...
                                </div>
                            )}

                            {!isLoading && entries.length === 0 && (
                                <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                    No journal entries yet.
                                </div>
                            )}

                            {!isLoading &&
                                entries.map((entry, index) => (
                                    <motion.div
                                        key={entry.id}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="rounded-xl p-4"
                                        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                                    >
                                        <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.42)" }}>
                                            {formatEntryDate(entry.created_at)}
                                        </p>
                                        <p className="mt-2 text-sm leading-6 text-white">{entry.entry_text}</p>
                                    </motion.div>
                                ))}
                        </div>
                    </motion.section>
                </div>
            </div>
        </div>
    );
}

export default Journal;
