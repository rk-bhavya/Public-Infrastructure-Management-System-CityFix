import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../utils/api";

export default function Register({ onLogin }) {
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({ name:"", email:"", password:"", phone:"", address:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const set = k => e => setForm({...form,[k]:e.target.value});

  const handleSubmit = async () => {
    setLoading(true); setError("");
    try { const data = await api("/auth/register","POST",form); login(data.user,data.token); }
    catch(e) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.back} onClick={onLogin}>← Back to Login</button>
        <div style={s.top}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>🏙️</div>
          <h2 style={s.title}>Join CityFix</h2>
          <p style={s.sub}>Create your citizen account</p>
        </div>
        {error && <div style={s.error}>{error}</div>}
        <div style={s.grid}>
          {[["name","Full Name","text","fname lname"],["email","Email","email","you@gmail.com"],["password","Password","password","Min. 6 chars"],["phone","Phone","tel","10 digit no"]].map(([k,l,t,p])=>(
            <div key={k} style={s.field}>
              <label style={s.label}>{l}</label>
              <input style={s.input} type={t} placeholder={p} value={form[k]} onChange={set(k)} />
            </div>
          ))}
        </div>
        <div style={s.field}>
          <label style={s.label}>Address</label>
          <textarea style={s.textarea} rows={2} placeholder="Your full address..." value={form.address} onChange={set("address")} />
        </div>
        <button style={{...s.btn,opacity:loading?0.7:1}} onClick={handleSubmit} disabled={loading}>
          {loading?"Creating Account...":"Create Account →"}
        </button>
        <p style={s.hint}>Already have an account? <span style={s.link} onClick={onLogin}>Sign In</span></p>
      </div>
    </div>
  );
}

const s = {
  page:     { minHeight:"100vh", background:"#0a0a0f", display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 20px", fontFamily:"Georgia,serif" },
  card:     { width:"100%", maxWidth:"520px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:"16px", padding:"40px" },
  back:     { background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"13px", padding:0, marginBottom:"24px" },
  top:      { textAlign:"center", marginBottom:"32px" },
  title:    { fontSize:"28px", fontWeight:"700", color:"#fff", margin:"0 0 8px" },
  sub:      { color:"rgba(255,255,255,0.4)", fontSize:"14px", margin:0 },
  error:    { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5", padding:"12px 16px", borderRadius:"8px", fontSize:"14px", marginBottom:"20px" },
  grid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"16px", marginBottom:"16px" },
  field:    { marginBottom:"16px" },
  label:    { display:"block", color:"rgba(255,255,255,0.5)", fontSize:"11px", letterSpacing:"1px", textTransform:"uppercase", marginBottom:"8px", fontFamily:"monospace" },
  input:    { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none", boxSizing:"border-box" },
  textarea: { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"12px 14px", color:"#fff", fontSize:"14px", outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit" },
  btn:      { width:"100%", background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#0a0a0f", border:"none", borderRadius:"8px", padding:"16px", fontSize:"15px", fontWeight:"700", cursor:"pointer" },
  hint:     { textAlign:"center", color:"rgba(255,255,255,0.3)", fontSize:"13px", marginTop:"20px" },
  link:     { color:"#fbbf24", cursor:"pointer" },
};