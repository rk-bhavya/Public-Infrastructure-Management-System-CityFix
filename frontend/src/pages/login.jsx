import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../utils/api";

export default function Login({ onRegister }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try {
      const data = await api("/auth/login", "POST", form);
      login(data.user, data.token);
    } catch(e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.leftInner}>
          <div style={s.badge}>MUNICIPAL SERVICES</div>
          <h1 style={s.hero}>City<span style={s.heroAccent}>Fix</span></h1>
          <p style={s.tagline}>A Public Infrastructure Management System</p>
          <div style={s.statsRow}>
            {[["Report your issues"],["Resolve & review complaints"],["Receive faster response"]].map(([n,l])=>(
              <div key={l} style={s.stat}>
                <span style={s.statNum}>{n}</span>
                <span style={s.statLabel}>{l}</span>
              </div>
            ))}
          </div>
          <div style={s.circle1}/><div style={s.circle2}/>
        </div>
      </div>
      <div style={s.right}>
        <div style={s.card}>
          <div style={s.cardTop}>
            <div style={{fontSize:"48px",marginBottom:"12px"}}>🏛️</div>
            <h2 style={s.cardTitle}>Welcome</h2>
            <p style={s.cardSub}>Sign in to the citizen portal</p>
          </div>
          {error && <div style={s.error}>{error}</div>}
          {[["email","Email Address","email","you@example.com"],["password","Password","password","••••••••"]].map(([k,l,t,p])=>(
            <div key={k} style={s.field}>
              <label style={s.label}>{l}</label>
              <input style={s.input} type={t} placeholder={p}
                value={form[k]} onChange={e=>setForm({...form,[k]:e.target.value})}
                onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>
          ))}
          <button style={{...s.btn,opacity:loading?0.7:1}} onClick={handleSubmit} disabled={loading}>
            {loading?"Signing in...":"Sign In →"}
          </button>
          <div style={s.divider}><span style={s.dividerText}>or</span></div>
          <button style={s.btnOutline} onClick={onRegister}>Create New Account</button>
          <p style={s.hint}>Use your credentials to report a public issue.</p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { display:"flex", minHeight:"100vh", fontFamily:"Georgia,serif", background:"#0a0a0f" },
  left:        { flex:1, background:"linear-gradient(135deg,#0d1b2a,#1a2744 50%,#0d1b2a)", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden", padding:"40px" },
  leftInner:   { position:"relative", zIndex:2 },
  badge:       { display:"inline-block", background:"rgba(251,191,36,0.15)", border:"1px solid rgba(251,191,36,0.4)", color:"#fbbf24", padding:"6px 16px", borderRadius:"20px", fontSize:"11px", letterSpacing:"2px", fontFamily:"monospace", marginBottom:"24px" },
  hero:        { fontSize:"80px", fontWeight:"900", color:"#fff", margin:"0 0 16px", lineHeight:1, letterSpacing:"-2px" },
  heroAccent:  { color:"#fbbf24" },
  tagline:     { fontSize:"18px", color:"rgba(255,255,255,0.6)", lineHeight:1.7, marginBottom:"48px", fontStyle:"italic" },
  statsRow:    { display:"flex", gap:"32px" },
  stat:        { display:"flex", flexDirection:"column" },
  statNum:     { fontSize:"28px", fontWeight:"700", color:"#fbbf24" },
  statLabel:   { fontSize:"11px", color:"rgba(255,255,255,0.5)", letterSpacing:"1px", textTransform:"uppercase", marginTop:"4px" },
  circle1:     { position:"absolute", width:"400px", height:"400px", borderRadius:"50%", border:"1px solid rgba(251,191,36,0.08)", top:"-100px", right:"-150px", pointerEvents:"none" },
  circle2:     { position:"absolute", width:"600px", height:"600px", borderRadius:"50%", border:"1px solid rgba(251,191,36,0.04)", bottom:"-200px", left:"-200px", pointerEvents:"none" },
  right:       { flex:1, display:"flex", alignItems:"center", justifyContent:"center", padding:"40px", background:"#0a0a0f" },
  card:        { width:"100%", maxWidth:"420px" },
  cardTop:     { marginBottom:"32px", textAlign:"center" },
  cardTitle:   { fontSize:"28px", fontWeight:"700", color:"#fff", margin:"0 0 8px" },
  cardSub:     { color:"rgba(255,255,255,0.4)", fontSize:"14px", margin:0 },
  error:       { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5", padding:"12px 16px", borderRadius:"8px", fontSize:"14px", marginBottom:"20px" },
  field:       { marginBottom:"20px" },
  label:       { display:"block", color:"rgba(255,255,255,0.6)", fontSize:"12px", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px", fontFamily:"monospace" },
  input:       { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"14px 16px", color:"#fff", fontSize:"15px", outline:"none", boxSizing:"border-box" },
  btn:         { width:"100%", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#0a0a0f", border:"none", borderRadius:"8px", padding:"16px", fontSize:"15px", fontWeight:"700", cursor:"pointer", letterSpacing:"1px", marginTop:"8px" },
  divider:     { textAlign:"center", margin:"20px 0", borderTop:"1px solid rgba(255,255,255,0.08)" },
  dividerText: { background:"#0a0a0f", padding:"0 12px", color:"rgba(255,255,255,0.3)", fontSize:"12px", position:"relative", top:"-10px" },
  btnOutline:  { width:"100%", background:"transparent", border:"1px solid rgba(255,255,255,0.15)", borderRadius:"8px", padding:"14px", fontSize:"15px", color:"rgba(255,255,255,0.7)", cursor:"pointer" },
  hint:        { textAlign:"center", color:"rgba(255,255,255,0.25)", fontSize:"12px", marginTop:"24px" },
};