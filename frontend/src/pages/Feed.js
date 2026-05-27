import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FiImage, FiSend } from "react-icons/fi";

function Feed() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [description, setDescription] = useState("");
  const [pillar, setPillar] = useState("EARTH");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/posts", {
        headers: { authorization: token }
      });
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageFile(file);
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handlePost = async () => {
    if (!description && !imagePreview) return;
    try {
      const res = await fetch("http://localhost:5000/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authorization: token
        },
        body: JSON.stringify({
          description,
          pillar,
          image_url: imagePreview
        })
      });
      const data = await res.json();
      if (data.id) {
        setDescription("");
        setImageFile(null);
        setImagePreview("");
        fetchPosts();
      } else {
        setMessage(data.error);
      }
    } catch (err) {
      setMessage("Server error");
    }
  };

  const pillars = ["EARTH", "MIND", "CONNECT", "UNIVERSE", "ACTION"];

  return (
    <div className="min-h-screen p-8" style={{ background: "var(--bg-primary)", fontFamily: "var(--font-body)" }}>
      
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate("/dashboard")}
            className="px-4 py-2 rounded-lg text-xs tracking-widest"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "white", cursor: "pointer" }}>
            ← DASHBOARD
          </button>
          <h1 className="text-white text-xl tracking-widest" style={{ fontFamily: "var(--font-heading)" }}>
            WARRIOR FEED
          </h1>
        </div>

        {/* Create Post */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl mb-6 glass-card"
        >
          <p className="text-xs tracking-widest mb-4" style={{ color: "rgba(255,200,200,0.7)" }}>
            SHARE YOUR ACTION
          </p>

          {/* Pillar Select */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {pillars.map(p => (
              <button key={p} onClick={() => setPillar(p)}
                className="px-3 py-1 rounded-full text-xs tracking-widest transition-all"
                style={{
                  background: pillar === p ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${pillar === p ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                  color: "white",
                  cursor: "pointer"
                }}>
                {p}
              </button>
            ))}
          </div>

          {/* Image Upload */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            <FiImage />
            <span className="text-xs tracking-widest">ADD PHOTO</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </label>

          {imagePreview && (
            <img src={imagePreview} alt="preview" className="w-full rounded-xl mb-4 object-cover" style={{ maxHeight: "200px" }} />
          )}

          <textarea
            placeholder="What did you do today for Earth?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-lg text-sm outline-none resize-none"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              fontFamily: "var(--font-body)"
            }}
          />

          <button onClick={handlePost}
            className="mt-4 flex items-center gap-2 px-6 py-2 rounded-lg text-white text-sm tracking-widest"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer"
            }}>
            <FiSend /> POST
          </button>

          {message && <p className="mt-2 text-xs" style={{ color: "#ffaabb" }}>{message}</p>}
        </motion.div>

        {/* Posts Feed */}
        {posts.length === 0 ? (
          <div className="text-center py-12" style={{ color: "rgba(255,255,255,0.3)" }}>
            <p className="text-sm tracking-widest">NO POSTS YET — BE THE FIRST WARRIOR</p>
          </div>
        ) : (
          posts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl mb-4 glass-card"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ background: "rgba(255,255,255,0.15)" }}>
                  {post.username?.[0]?.toUpperCase() || "W"}
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{post.username || "Warrior"}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="ml-auto px-3 py-1 rounded-full text-xs"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
                  {post.pillar}
                </span>
              </div>

              {post.image_url && (
                <img src={post.image_url} alt="post" className="w-full rounded-xl mb-4 object-cover" style={{ maxHeight: "300px" }} />
              )}

              {post.description && (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.8)" }}>{post.description}</p>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

export default Feed;