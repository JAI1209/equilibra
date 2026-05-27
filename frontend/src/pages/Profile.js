import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiActivity, FiArrowLeft, FiAward, FiMapPin, FiTarget, FiUser, FiEdit2, FiSave, FiX } from "react-icons/fi";

const defaultProfile = {
    user: { username: "Warrior", location: "Unknown", bio: "", avatar_url: "" },
    warriorLevel: "Awakening Warrior",
    warriorshipScore: 0,
    nextLevelScore: 10,
    progressToNextLevel: 0,
    totalMissionsCompleted: 0,
    recentActivity: [],
};

const getNextLevelScore = (score) => {
    if (score >= 250) return 500;
    if (score >= 100) return 250;
    if (score >= 50) return 100;
    if (score >= 10) return 50;
    return 10;
};

const getLevelMinScore = (score) => {
    if (score >= 250) return 250;
    if (score >= 100) return 100;
    if (score >= 50) return 50;
    if (score >= 10) return 10;
    return 0;
};

const normalizeProfile = (data) => {
    if (data.user) return data;
    const score = data.warriorship_score || 0;
    const nextLevelScore = getNextLevelScore(score);
    const minLevelScore = getLevelMinScore(score);
    const progressRange = nextLevelScore - minLevelScore;
    return {
        user: {
            username: data.username || "Warrior",
            email: data.email || "",
            location: data.location || "Unknown",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
        },
        warriorLevel: data.warrior_level || "Awakening Warrior",
        warriorshipScore: score,
        nextLevelScore,
        progressToNextLevel: Math.min(100, Math.round(((score - minLevelScore) / progressRange) * 100)),
        totalMissionsCompleted: data.missions_completed_count || 0,
        recentActivity: [],
    };
};

const glassCard = {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.14)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
};

function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(defaultProfile);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editBio, setEditBio] = useState("");
    const [editLocation, setEditLocation] = useState("");
    const [avatarPreview, setAvatarPreview] = useState("");
    const [saveMessage, setSaveMessage] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        const fetchProfile = async () => {
            if (!token) { navigate("/"); return; }
            try {
                const res = await fetch("http://localhost:5000/api/users/profile", {
                    headers: { Authorization: token },
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.error || "Could not load profile");
                const normalized = normalizeProfile(data);
                setProfile(normalized);
                setEditBio(normalized.user.bio || "");
                setEditLocation(normalized.user.location || "");
                setAvatarPreview(normalized.user.avatar_url || "");
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchProfile();
    }, [navigate, token]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        try {
            const res = await fetch("http://localhost:5000/api/users/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                },
                body: JSON.stringify({
                    bio: editBio,
                    location: editLocation,
                    avatar_url: avatarPreview,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setProfile(prev => ({
                ...prev,
                user: { ...prev.user, bio: editBio, location: editLocation, avatar_url: avatarPreview }
            }));
            setSaveMessage("Profile updated!");
            setIsEditing(false);
            setTimeout(() => setSaveMessage(""), 3000);
        } catch (err) {
            setSaveMessage(err.message);
        }
    };

    const scoreProgress = useMemo(
        () => Math.max(0, Math.min(100, profile.progressToNextLevel || 0)),
        [profile.progressToNextLevel]
    );

    const formattedActivity = useMemo(
        () => profile.recentActivity.map((activity) => ({
            ...activity,
            completedAt: activity.completedAt
                ? new Date(activity.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                : "Recently",
        })),
        [profile.recentActivity]
    );

    return (
        <div className="min-h-screen px-6 py-8" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-heading)" }}>
            <div className="mx-auto max-w-6xl">

                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <button onClick={() => navigate("/dashboard")}
                        className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm tracking-widest text-white"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer" }}>
                        <FiArrowLeft /> DASHBOARD
                    </button>
                    <img src="/logo.png" alt="Equilibra" className="h-10 w-10" />
                </div>

                {error && (
                    <div className="mb-6 rounded-lg p-4 text-sm text-white" style={glassCard}>{error}</div>
                )}

                {saveMessage && (
                    <div className="mb-6 rounded-lg p-4 text-sm text-white" style={{ ...glassCard, borderColor: "rgba(52,211,153,0.4)" }}>
                        {saveMessage}
                    </div>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]"
                >
                    {/* Profile Card */}
                    <div className="rounded-2xl p-7" style={glassCard}>
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex items-start gap-5">

                                {/* Avatar */}
                                <div className="relative">
                                    <div className="grid h-20 w-20 place-items-center rounded-2xl overflow-hidden text-3xl text-white"
                                        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}>
                                        {avatarPreview
                                            ? <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                            : <FiUser />
                                        }
                                    </div>
                                    {isEditing && (
                                        <label className="absolute -bottom-2 -right-2 cursor-pointer grid h-7 w-7 place-items-center rounded-full text-white text-xs"
                                            style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}>
                                            📷
                                            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </label>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>
                                        EQUILIBRA PROFILE
                                    </p>
                                    <h1 className="mt-1 text-3xl font-bold tracking-widest text-white">
                                        {isLoading ? "Loading..." : profile.user.username}
                                    </h1>

                                    {/* Location */}
                                    {isEditing ? (
                                        <input
                                            value={editLocation}
                                            onChange={e => setEditLocation(e.target.value)}
                                            placeholder="Your city"
                                            className="mt-2 px-3 py-1 rounded-lg text-sm outline-none w-full"
                                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
                                        />
                                    ) : (
                                        <div className="mt-2 flex items-center gap-2 text-sm" style={{ color: "rgba(255,255,255,0.58)" }}>
                                            <FiMapPin /> {isLoading ? "Syncing..." : profile.user.location}
                                        </div>
                                    )}

                                    {/* Bio */}
                                    {isEditing ? (
                                        <textarea
                                            value={editBio}
                                            onChange={e => setEditBio(e.target.value)}
                                            placeholder="Your bio (max 150 chars)"
                                            maxLength={150}
                                            rows={2}
                                            className="mt-2 px-3 py-2 rounded-lg text-sm outline-none w-full resize-none"
                                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", color: "white" }}
                                        />
                                    ) : (
                                        profile.user.bio && (
                                            <p className="mt-2 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                                                {profile.user.bio}
                                            </p>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Edit / Save Buttons */}
                            <div className="flex gap-2">
                                {isEditing ? (
                                    <>
                                        <button onClick={handleSaveProfile}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs tracking-widest text-white"
                                            style={{ background: "rgba(52,211,153,0.2)", border: "1px solid rgba(52,211,153,0.4)", cursor: "pointer" }}>
                                            <FiSave /> SAVE
                                        </button>
                                        <button onClick={() => setIsEditing(false)}
                                            className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs tracking-widest text-white"
                                            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer" }}>
                                            <FiX /> CANCEL
                                        </button>
                                    </>
                                ) : (
                                    <button onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-1 px-3 py-2 rounded-lg text-xs tracking-widest text-white"
                                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer" }}>
                                        <FiEdit2 /> EDIT
                                    </button>
                                )}

                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.2, type: "spring", stiffness: 220, damping: 18 }}
                                    className="rounded-xl px-5 py-3 text-center"
                                    style={{ background: "rgba(255,255,255,0.11)", border: "1px solid rgba(255,255,255,0.18)" }}
                                >
                                    <FiAward className="mx-auto mb-2 text-2xl text-amber-200" />
                                    <p className="text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.56)" }}>WARRIOR LEVEL</p>
                                    <p className="text-sm font-bold tracking-widest text-white">{profile.warriorLevel}</p>
                                </motion.div>
                            </div>
                        </div>

                        {/* Score Progress */}
                        <div className="mt-8">
                            <div className="mb-3 flex items-end justify-between gap-4">
                                <div>
                                    <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>WARRIORSHIP SCORE</p>
                                    <motion.p key={profile.warriorshipScore} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                        className="text-5xl font-bold text-white">
                                        {profile.warriorshipScore}
                                    </motion.p>
                                </div>
                                <p className="pb-2 text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.48)" }}>
                                    NEXT: {profile.nextLevelScore}
                                </p>
                            </div>
                            <div className="h-4 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.22)" }}>
                                <motion.div className="h-full rounded-full"
                                    style={{ background: "linear-gradient(90deg, #FDE68A, #34D399)" }}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${scoreProgress}%` }}
                                    transition={{ duration: 0.9, ease: "easeOut" }}
                                />
                            </div>
                            <p className="mt-2 text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.42)" }}>
                                {scoreProgress}% TO NEXT LEVEL
                            </p>
                        </div>
                    </div>

                    {/* Missions Card */}
                    <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.1 }} className="rounded-2xl p-7" style={glassCard}>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs tracking-widest" style={{ color: "rgba(255,200,200,0.7)" }}>MISSIONS COMPLETED</p>
                                <motion.p key={profile.totalMissionsCompleted}
                                    initial={{ scale: 0.92, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                                    className="mt-3 text-6xl font-bold text-white">
                                    {profile.totalMissionsCompleted}
                                </motion.p>
                            </div>
                            <div className="grid h-16 w-16 place-items-center rounded-2xl text-3xl text-white"
                                style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.16)" }}>
                                <FiTarget />
                            </div>
                        </div>
                        <p className="mt-5 text-sm leading-6" style={{ color: "rgba(255,255,255,0.52)" }}>
                            Every proof-backed action strengthens your balance across impact, effort, and consistency.
                        </p>
                    </motion.div>
                </motion.section>

                {/* Recent Activity */}
                <motion.section initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.2 }} className="mt-6 rounded-2xl p-7" style={glassCard}>
                    <div className="mb-5 flex items-center gap-3">
                        <FiActivity className="text-xl text-white" />
                        <h2 className="text-lg font-bold tracking-widest text-white">RECENT ACTIVITY</h2>
                    </div>
                    <div className="space-y-3">
                        {isLoading && (
                            <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                Loading activity...
                            </div>
                        )}
                        {!isLoading && formattedActivity.length === 0 && (
                            <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.55)" }}>
                                No completed missions yet.
                            </div>
                        )}
                        {!isLoading && formattedActivity.map((activity, index) => (
                            <motion.div key={activity.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.06 }}
                                className="flex items-center justify-between gap-4 rounded-xl p-4"
                                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                                <div>
                                    <p className="font-semibold tracking-wider text-white">{activity.title}</p>
                                    <p className="mt-1 text-xs tracking-widest" style={{ color: "rgba(255,255,255,0.43)" }}>
                                        {activity.completedAt}
                                    </p>
                                </div>
                                <span className="rounded-full px-3 py-1 text-xs tracking-widest text-white"
                                    style={{ background: "rgba(52,211,153,0.18)" }}>
                                    +{activity.pointsAwarded} PTS
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.section>
            </div>
        </div>
    );
}

export default Profile;