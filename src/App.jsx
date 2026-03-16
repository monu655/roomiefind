import { useState, useEffect, useCallback, useMemo } from "react";
import { auth, provider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { ref, push, onValue, remove } from "firebase/database";

const AREAS = ["Andheri", "Bandra", "Dadar", "Borivali", "Thane", "Navi Mumbai", "Powai", "Malad", "Goregaon", "Kurla"];
const OCCUPATIONS = ["Software Engineer", "Student", "Designer", "MBA Student", "Freelancer", "Doctor", "Teacher", "Marketing"];
const PREFERENCES = ["Non-smoker", "Vegetarian", "Early riser", "Night owl", "Pet friendly", "No pets", "Work from home", "Gym-goer", "Quiet lifestyle", "Social/Outgoing"];

const MOCK_LISTINGS = [
  { id: "mock1", name: "Priya Sharma", age: 24, gender: "Female", area: "Andheri", budget: 12000, occupation: "Software Engineer", preferences: ["Non-smoker", "Early riser", "Vegetarian"], bio: "Working at a startup in Andheri West. Looking for a clean, responsible flatmate.", avatar: "PS", lookingFor: "Female", roomType: "Shared", verified: true, isMock: true },
  { id: "mock2", name: "Rahul Mehta", age: 27, gender: "Male", area: "Powai", budget: 18000, occupation: "MBA Student", preferences: ["No pets", "Social/Outgoing", "Non-smoker"], bio: "IIT Bombay MBA student. Very clean, respectful of shared spaces.", avatar: "RM", lookingFor: "Any", roomType: "Private", verified: true, isMock: true },
  { id: "mock3", name: "Aarav Joshi", age: 22, gender: "Male", area: "Bandra", budget: 15000, occupation: "Designer", preferences: ["Pet friendly", "Night owl", "Work from home"], bio: "Freelance UI designer working remotely. I have a small cat named Pixel.", avatar: "AJ", lookingFor: "Any", roomType: "Shared", verified: false, isMock: true },
  { id: "mock4", name: "Sneha Kulkarni", age: 26, gender: "Female", area: "Dadar", budget: 10000, occupation: "Teacher", preferences: ["Vegetarian", "Non-smoker", "Quiet lifestyle"], bio: "School teacher. Very homely person. Need a mature, responsible flatmate only.", avatar: "SK", lookingFor: "Female", roomType: "Shared", verified: true, isMock: true },
  { id: "mock5", name: "Vikram Nair", age: 29, gender: "Male", area: "Thane", budget: 9000, occupation: "Software Engineer", preferences: ["Gym-goer", "Early riser", "Non-smoker"], bio: "Backend developer at TCS. Gym every morning 6am. Very disciplined and tidy.", avatar: "VN", lookingFor: "Male", roomType: "Shared", verified: true, isMock: true },
  { id: "mock6", name: "Divya Iyer", age: 28, gender: "Female", area: "Borivali", budget: 8500, occupation: "Doctor", preferences: ["Non-smoker", "Quiet lifestyle", "Vegetarian"], bio: "Resident doctor at a nearby hospital. Need someone understanding of my schedule.", avatar: "DI", lookingFor: "Female", roomType: "Shared", verified: true, isMock: true },
];

function GoogleLoginScreen({ onLogin, loading }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "20px", background: "linear-gradient(135deg, #f5a623, #e8572a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", margin: "0 auto 24px" }}>🏠</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "42px", fontWeight: "900", margin: "0 0 8px", background: "linear-gradient(135deg, #f5f0e8 0%, #f5a623 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>RoomieFind</h1>
        <p style={{ color: "#666", fontSize: "16px", margin: "0 0 48px" }}>Mumbai ka #1 flatmate finder</p>
        <button onClick={onLogin} disabled={loading} style={{ display: "flex", alignItems: "center", gap: "12px", background: "#fff", border: "none", borderRadius: "14px", padding: "14px 28px", cursor: "pointer", fontSize: "15px", fontWeight: "600", color: "#333", margin: "0 auto", opacity: loading ? 0.7 : 1 }}>
          <img src="https://www.google.com/favicon.ico" width="20" height="20" alt="Google" />
          {loading ? "Signing in..." : "Continue with Google"}
        </button>
        <p style={{ color: "#444", fontSize: "12px", marginTop: "24px" }}>Free · No credit card · Mumbai only</p>
      </div>
    </div>
  );
}

function ProfileCard({ profile, onConnect, onSave, isSaved, currentUser, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const isOwner = currentUser && profile.userId === currentUser.uid;
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,200,100,0.15)", borderRadius: "20px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", transition: "all 0.3s ease", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.border = "1px solid rgba(255,200,100,0.5)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 20px 40px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.border = "1px solid rgba(255,200,100,0.15)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
        <div style={{ width: 56, height: 56, borderRadius: "16px", background: "linear-gradient(135deg, #f5a623, #e8572a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: "#fff", flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {profile.photoURL ? <img src={profile.photoURL} style={{ width: 56, height: 56, objectFit: "cover" }} alt="" /> : profile.avatar}
          {profile.verified && <div style={{ position: "absolute", bottom: -4, right: -4, width: 18, height: 18, background: "#22c55e", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", border: "2px solid #0f0f14" }}>✓</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: "17px", color: "#f5f0e8" }}>{profile.name}</h3>
            <span style={{ fontSize: "12px", color: "#888", background: "rgba(255,255,255,0.06)", padding: "2px 8px", borderRadius: "20px" }}>{profile.age}y</span>
            <span style={{ fontSize: "11px", color: profile.gender === "Female" ? "#f9a8d4" : "#93c5fd", background: profile.gender === "Female" ? "rgba(249,168,212,0.1)" : "rgba(147,197,253,0.1)", padding: "2px 8px", borderRadius: "20px" }}>{profile.gender}</span>
            {isOwner && <span style={{ fontSize: "11px", color: "#f5a623", background: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "20px" }}>Your listing</span>}
          </div>
          <div style={{ fontSize: "13px", color: "#f5a623", marginTop: "4px" }}>📍 {profile.area}, Mumbai</div>
          <div style={{ fontSize: "12px", color: "#888", marginTop: "2px" }}>💼 {profile.occupation}</div>
        </div>
        <div style={{ display: "flex", gap: "6px" }}>
          {isOwner && <button onClick={() => onDelete(profile.id)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "6px 8px", cursor: "pointer", color: "#ef4444", fontSize: "13px" }}>🗑</button>}
          <button onClick={(e) => { e.stopPropagation(); onSave(profile.id); }} style={{ background: isSaved ? "rgba(245,166,35,0.2)" : "transparent", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "10px", padding: "6px 8px", cursor: "pointer", color: isSaved ? "#f5a623" : "#666", fontSize: "16px" }}>{isSaved ? "♥" : "♡"}</button>
        </div>
      </div>
      <div style={{ display: "flex", gap: "12px" }}>
        {[["Budget", `₹${profile.budget.toLocaleString()}`, "/month"], ["Room", profile.roomType, ""], ["Looking for", profile.lookingFor, ""]].map(([label, val, sub]) => (
          <div key={label} style={{ flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: "12px", padding: "10px 14px", textAlign: "center" }}>
            <div style={{ fontSize: "11px", color: "#666", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: label === "Budget" ? "16px" : "14px", fontWeight: "700", color: label === "Budget" ? "#f5a623" : "#c4b5a0" }}>{val}</div>
            {sub && <div style={{ fontSize: "10px", color: "#555" }}>{sub}</div>}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {profile.preferences && profile.preferences.map(p => (<span key={p} style={{ fontSize: "11px", color: "#c4b5a0", background: "rgba(196,181,160,0.08)", border: "1px solid rgba(196,181,160,0.15)", padding: "3px 10px", borderRadius: "20px" }}>{p}</span>))}
      </div>
      {expanded && <div style={{ fontSize: "13px", color: "#aaa", lineHeight: "1.6", background: "rgba(255,255,255,0.03)", borderRadius: "12px", padding: "12px", borderLeft: "3px solid rgba(245,166,35,0.4)" }}>"{profile.bio}"</div>}
      <div style={{ display: "flex", gap: "10px" }}>
        <button onClick={() => setExpanded(!expanded)} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px", color: "#888", cursor: "pointer", fontSize: "13px" }}>{expanded ? "▲ Less" : "▼ Read bio"}</button>
        <button onClick={() => onConnect(profile)} style={{ flex: 2, background: "linear-gradient(135deg, #f5a623, #e8572a)", border: "none", borderRadius: "12px", padding: "10px 20px", color: "#fff", cursor: "pointer", fontWeight: "600", fontSize: "13px" }}>Connect →</button>
      </div>
    </div>
  );
}

function AddListingModal({ onClose, onAdd, currentUser }) {
  const [form, setForm] = useState({ name: currentUser?.displayName || "", age: "", gender: "Male", area: "Andheri", budget: "", occupation: "", preferences: [], bio: "", lookingFor: "Any", roomType: "Shared" });
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const togglePref = (p) => setForm(prev => ({ ...prev, preferences: prev.preferences.includes(p) ? prev.preferences.filter(x => x !== p) : prev.preferences.length < 4 ? [...prev.preferences, p] : prev.preferences }));
  const handleSubmit = async () => {
    if (!form.name || !form.age || !form.budget) return;
    setLoading(true);
    await onAdd({ ...form, age: parseInt(form.age), budget: parseInt(form.budget), avatar: form.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(), verified: true, userId: currentUser.uid, photoURL: currentUser.photoURL || null, createdAt: Date.now() });
    setLoading(false);
    onClose();
  };
  const inputStyle = { width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "12px 16px", color: "#f5f0e8", fontSize: "14px", boxSizing: "border-box", outline: "none", fontFamily: "'DM Sans', sans-serif" };
  const labelStyle = { fontSize: "12px", color: "#888", marginBottom: "6px", display: "block", letterSpacing: "0.5px", textTransform: "uppercase" };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#1a1820", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "500px", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
          <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#f5f0e8", fontSize: "22px" }}>Post Your Listing</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#888", width: 36, height: 36, borderRadius: "10px", cursor: "pointer", fontSize: "16px" }}>✕</button>
        </div>
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>{[1,2,3].map(s => <div key={s} style={{ flex: 1, height: 4, borderRadius: "2px", background: step >= s ? "linear-gradient(90deg, #f5a623, #e8572a)" : "rgba(255,255,255,0.1)" }} />)}</div>
        {step === 1 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>Your Name *</label><input style={inputStyle} placeholder="Monu Gautam" value={form.name} onChange={e => update("name", e.target.value)} /></div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Age *</label><input style={inputStyle} type="number" placeholder="24" value={form.age} onChange={e => update("age", e.target.value)} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Gender</label><select style={{ ...inputStyle, cursor: "pointer" }} value={form.gender} onChange={e => update("gender", e.target.value)}><option>Male</option><option>Female</option><option>Non-binary</option></select></div>
          </div>
          <div><label style={labelStyle}>Occupation</label><select style={{ ...inputStyle, cursor: "pointer" }} value={form.occupation} onChange={e => update("occupation", e.target.value)}><option value="">Select...</option>{OCCUPATIONS.map(o => <option key={o}>{o}</option>)}</select></div>
        </div>}
        {step === 2 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>Preferred Area</label><select style={{ ...inputStyle, cursor: "pointer" }} value={form.area} onChange={e => update("area", e.target.value)}>{AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Budget (₹/month) *</label><input style={inputStyle} type="number" placeholder="12000" value={form.budget} onChange={e => update("budget", e.target.value)} /></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Room Type</label><select style={{ ...inputStyle, cursor: "pointer" }} value={form.roomType} onChange={e => update("roomType", e.target.value)}><option>Shared</option><option>Private</option></select></div>
          </div>
          <div><label style={labelStyle}>Looking for</label><select style={{ ...inputStyle, cursor: "pointer" }} value={form.lookingFor} onChange={e => update("lookingFor", e.target.value)}><option>Any</option><option>Male</option><option>Female</option></select></div>
        </div>}
        {step === 3 && <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div><label style={labelStyle}>Preferences (max 4)</label><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{PREFERENCES.map(p => <button key={p} onClick={() => togglePref(p)} style={{ padding: "7px 14px", borderRadius: "20px", cursor: "pointer", fontSize: "12px", background: form.preferences.includes(p) ? "linear-gradient(135deg, #f5a623, #e8572a)" : "rgba(255,255,255,0.06)", border: form.preferences.includes(p) ? "none" : "1px solid rgba(255,255,255,0.1)", color: form.preferences.includes(p) ? "#fff" : "#aaa" }}>{p}</button>)}</div></div>
          <div><label style={labelStyle}>About you</label><textarea style={{ ...inputStyle, height: "100px", resize: "vertical" }} placeholder="Tell potential flatmates about yourself..." value={form.bio} onChange={e => update("bio", e.target.value)} /></div>
        </div>}
        <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
          {step > 1 && <button onClick={() => setStep(s => s-1)} style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "13px", color: "#aaa", cursor: "pointer", fontSize: "14px" }}>← Back</button>}
          <button onClick={step < 3 ? () => setStep(s => s+1) : handleSubmit} disabled={loading} style={{ flex: 2, background: "linear-gradient(135deg, #f5a623, #e8572a)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "14px" }}>{loading ? "Saving..." : step < 3 ? "Next →" : "🏠 Post Listing"}</button>
        </div>
      </div>
    </div>
  );
}

function ConnectModal({ profile, onClose }) {
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState(`Hi ${profile.name}! I came across your listing on RoomieFind and I think we could be great flatmates. I'm also looking in ${profile.area}. Would love to connect!`);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
      <div style={{ background: "#1a1820", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "24px", padding: "32px", width: "100%", maxWidth: "440px" }}>
        {!sent ? <>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
            <div style={{ width: 52, height: 52, borderRadius: "14px", background: "linear-gradient(135deg, #f5a623, #e8572a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", fontWeight: "700", color: "#fff" }}>{profile.avatar}</div>
            <div><h3 style={{ margin: 0, fontFamily: "'Playfair Display', serif", color: "#f5f0e8" }}>Connect with {profile.name}</h3><div style={{ fontSize: "13px", color: "#888" }}>📍 {profile.area} · ₹{profile.budget.toLocaleString()}/mo</div></div>
          </div>
          <textarea value={msg} onChange={e => setMsg(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "14px", padding: "16px", color: "#f5f0e8", fontSize: "14px", height: "130px", resize: "none", boxSizing: "border-box", outline: "none", lineHeight: "1.6", fontFamily: "'DM Sans', sans-serif" }} />
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "13px", color: "#888", cursor: "pointer" }}>Cancel</button>
            <button onClick={() => setSent(true)} style={{ flex: 2, background: "linear-gradient(135deg, #f5a623, #e8572a)", border: "none", borderRadius: "12px", padding: "13px", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "14px" }}>Send Request ✈️</button>
          </div>
        </> : <div style={{ textAlign: "center", padding: "20px 0" }}>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
          <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f5f0e8", fontSize: "22px", margin: "0 0 10px" }}>Request Sent!</h3>
          <p style={{ color: "#888", fontSize: "14px", margin: "0 0 24px" }}>Sent to <strong style={{ color: "#f5a623" }}>{profile.name}</strong>!</p>
          <button onClick={onClose} style={{ background: "linear-gradient(135deg, #f5a623, #e8572a)", border: "none", borderRadius: "12px", padding: "13px 32px", color: "#fff", fontWeight: "700", cursor: "pointer" }}>Back to Listings</button>
        </div>}
      </div>
    </div>
  );
}

export default function RoomieFind() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [dbListings, setDbListings] = useState([]);
  const [saved, setSaved] = useState([]);
  const [filters, setFilters] = useState({ area: "All", gender: "All", maxBudget: 25000, occupation: "All", roomType: "All", minAge: 18, maxAge: 40 });
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [connectProfile, setConnectProfile] = useState(null);
  const [activeTab, setActiveTab] = useState("browse");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    const listingsRef = ref(db, "listings");
    const unsub = onValue(listingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setDbListings(Object.entries(data).map(([id, val]) => ({ ...val, id })));
      else setDbListings([]);
    });
    return unsub;
  }, []);

  const allListings = useMemo(() => [...MOCK_LISTINGS, ...dbListings], [dbListings]);
  const handleLogin = async () => { setLoginLoading(true); try { await signInWithPopup(auth, provider); } catch(e) { console.error(e); } setLoginLoading(false); };
  const handleLogout = () => signOut(auth);
  const handleAdd = async (newListing) => { await push(ref(db, "listings"), newListing); };
  const handleDelete = async (id) => { if (id.startsWith("mock")) return; await remove(ref(db, `listings/${id}`)); };
  const toggleSave = useCallback((id) => { setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); }, []);

  const filtered = useMemo(() => {
    let res = allListings.filter(p => {
      return (filters.area === "All" || p.area === filters.area) &&
        (filters.gender === "All" || p.gender === filters.gender) &&
        p.budget <= filters.maxBudget &&
        (filters.occupation === "All" || p.occupation === filters.occupation) &&
        (filters.roomType === "All" || p.roomType === filters.roomType) &&
        p.age >= filters.minAge && p.age <= filters.maxAge &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase()) || p.occupation.toLowerCase().includes(search.toLowerCase()));
    });
    if (sortBy === "budget_low") res = [...res].sort((a, b) => a.budget - b.budget);
    if (sortBy === "budget_high") res = [...res].sort((a, b) => b.budget - a.budget);
    return res;
  }, [allListings, filters, search, sortBy]);

  const savedListings = useMemo(() => allListings.filter(l => saved.includes(l.id)), [allListings, saved]);
  const displayListings = activeTab === "saved" ? savedListings : filtered;

  if (authLoading) return <div style={{ minHeight: "100vh", background: "#0f0f14", display: "flex", alignItems: "center", justifyContent: "center", color: "#f5a623", fontSize: "18px" }}>Loading...</div>;
  if (!user) return <GoogleLoginScreen onLogin={handleLogin} loading={loginLoading} />;

  return (
    <div style={{ minHeight: "100vh", background: "#0f0f14", fontFamily: "'DM Sans', sans-serif", color: "#f5f0e8" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(245,166,35,0.3); border-radius: 3px; }
        input::placeholder { color: #555; }
        textarea::placeholder { color: #555; }
        select option { background: #1a1820; color: #f5f0e8; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .card-anim { animation: fadeIn 0.4s ease forwards; }
      `}</style>

      <header style={{ padding: "0 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,15,20,0.9)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: "66px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", background: "linear-gradient(135deg, #f5a623, #e8572a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px" }}>🏠</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: "700", color: "#f5f0e8" }}>RoomieFind</span>
            <span style={{ fontSize: "11px", color: "#f5a623", background: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: "10px" }}>Mumbai</span>
          </div>
          <nav style={{ display: "flex", gap: "4px" }}>
            {[["browse", "🔍 Browse"], ["saved", `♥ Saved${saved.length ? ` (${saved.length})` : ""}`]].map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ background: activeTab === tab ? "rgba(245,166,35,0.15)" : "transparent", border: activeTab === tab ? "1px solid rgba(245,166,35,0.3)" : "1px solid transparent", borderRadius: "10px", padding: "8px 16px", color: activeTab === tab ? "#f5a623" : "#888", cursor: "pointer", fontSize: "13px", fontWeight: "500" }}>{label}</button>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {user.photoURL && <img src={user.photoURL} style={{ width: 30, height: 30, borderRadius: "50%" }} alt="" />}
              <span style={{ fontSize: "13px", color: "#888" }}>{user.displayName?.split(" ")[0]}</span>
            </div>
            <button onClick={() => setShowAdd(true)} style={{ background: "linear-gradient(135deg, #f5a623, #e8572a)", border: "none", borderRadius: "12px", padding: "10px 20px", color: "#fff", cursor: "pointer", fontWeight: "700", fontSize: "13px" }}>+ Post Listing</button>
            <button onClick={handleLogout} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", color: "#666", cursor: "pointer", fontSize: "12px" }}>Logout</button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {activeTab === "browse" && <>
          <div style={{ marginBottom: "36px" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: "900", margin: "0 0 8px", background: "linear-gradient(135deg, #f5f0e8 0%, #f5a623 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Find Your Perfect Roomie</h1>
            <p style={{ color: "#666", fontSize: "15px", margin: 0 }}>{allListings.length} listings across Mumbai · Real people, real homes</p>
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍  Search by name, area, occupation..." style={{ flex: "1 1 220px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 16px", color: "#f5f0e8", fontSize: "14px", outline: "none" }} />
              <select value={filters.area} onChange={e => setFilters(p => ({ ...p, area: e.target.value }))} style={{ flex: "0 1 140px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", color: "#f5f0e8", fontSize: "13px", cursor: "pointer", outline: "none" }}>
                <option value="All">📍 All Areas</option>{AREAS.map(a => <option key={a}>{a}</option>)}
              </select>
              <select value={filters.gender} onChange={e => setFilters(p => ({ ...p, gender: e.target.value }))} style={{ flex: "0 1 130px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", color: "#f5f0e8", fontSize: "13px", cursor: "pointer", outline: "none" }}>
                <option value="All">👤 Any Gender</option><option>Male</option><option>Female</option>
              </select>
              <select value={filters.occupation} onChange={e => setFilters(p => ({ ...p, occupation: e.target.value }))} style={{ flex: "0 1 160px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", color: "#f5f0e8", fontSize: "13px", cursor: "pointer", outline: "none" }}>
                <option value="All">💼 All Jobs</option>{OCCUPATIONS.map(o => <option key={o}>{o}</option>)}
              </select>
              <select value={filters.roomType} onChange={e => setFilters(p => ({ ...p, roomType: e.target.value }))} style={{ flex: "0 1 130px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", color: "#f5f0e8", fontSize: "13px", cursor: "pointer", outline: "none" }}>
                <option value="All">🏠 Any Room</option><option value="Shared">Shared</option><option value="Private">Private</option>
              </select>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ flex: "0 1 150px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "11px 14px", color: "#f5f0e8", fontSize: "13px", cursor: "pointer", outline: "none" }}>
                <option value="newest">↕ Newest</option><option value="budget_low">💸 Budget: Low→High</option><option value="budget_high">💰 Budget: High→Low</option>
              </select>
            </div>
            <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>Max Budget:</span>
              <input type="range" min={5000} max={30000} step={500} value={filters.maxBudget} onChange={e => setFilters(p => ({ ...p, maxBudget: parseInt(e.target.value) }))} style={{ flex: 1, accentColor: "#f5a623" }} />
              <span style={{ fontSize: "13px", color: "#f5a623", fontWeight: "600", minWidth: "80px" }}>₹{filters.maxBudget.toLocaleString()}</span>
            </div>
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "16px" }}>
              <span style={{ fontSize: "12px", color: "#666", whiteSpace: "nowrap" }}>Age Range:</span>
              <input type="range" min={18} max={50} step={1} value={filters.minAge} onChange={e => setFilters(p => ({ ...p, minAge: parseInt(e.target.value) }))} style={{ flex: 1, accentColor: "#f5a623" }} />
              <span style={{ fontSize: "13px", color: "#f5a623", fontWeight: "600", whiteSpace: "nowrap", minWidth: "100px" }}>{filters.minAge}y — {filters.maxAge}y</span>
              <input type="range" min={18} max={50} step={1} value={filters.maxAge} onChange={e => setFilters(p => ({ ...p, maxAge: parseInt(e.target.value) }))} style={{ flex: 1, accentColor: "#f5a623" }} />
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ fontSize: "14px", color: "#666" }}>Showing <span style={{ color: "#f5a623", fontWeight: "600" }}>{filtered.length}</span> results</span>
            {(filters.area !== "All" || filters.gender !== "All" || filters.occupation !== "All" || filters.roomType !== "All" || search) && <button onClick={() => { setFilters({ area: "All", gender: "All", maxBudget: 25000, occupation: "All", roomType: "All", minAge: 18, maxAge: 40 }); setSearch(""); }} style={{ background: "transparent", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "8px", padding: "5px 12px", color: "#f5a623", cursor: "pointer", fontSize: "12px" }}>Clear all ✕</button>}
          </div>
        </>}

        {activeTab === "saved" && <div style={{ marginBottom: "28px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "26px", margin: "0 0 8px" }}>Saved Listings</h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>{saved.length} listings saved</p>
        </div>}

        {displayListings.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
            {displayListings.map((profile, i) => (
              <div key={profile.id} className="card-anim" style={{ animationDelay: `${i * 0.06}s` }}>
                <ProfileCard profile={profile} onConnect={setConnectProfile} onSave={toggleSave} isSaved={saved.includes(profile.id)} currentUser={user} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>{activeTab === "saved" ? "♡" : "🔍"}</div>
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f5f0e8", fontSize: "22px", margin: "0 0 8px" }}>{activeTab === "saved" ? "No saved listings yet" : "No matches found"}</h3>
            <p style={{ color: "#666", fontSize: "14px" }}>{activeTab === "saved" ? "Heart a listing to save it for later" : "Try adjusting your filters"}</p>
          </div>
        )}
      </main>

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", marginTop: "40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: "32px", flexWrap: "wrap", justifyContent: "center" }}>
          {[["🏠", allListings.length, "Listings"], ["✓", allListings.filter(l => l.verified).length, "Verified"], ["📍", AREAS.length, "Areas"], ["♥", saved.length, "Saved"]].map(([icon, count, label]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontFamily: "'Playfair Display', serif", fontWeight: "700", color: "#f5a623" }}>{icon} {count}</div>
              <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {showAdd && <AddListingModal onClose={() => setShowAdd(false)} onAdd={handleAdd} currentUser={user} />}
      {connectProfile && <ConnectModal profile={connectProfile} onClose={() => setConnectProfile(null)} />}
    </div>
  );
}