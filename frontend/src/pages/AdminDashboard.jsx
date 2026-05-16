import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import { CATEGORY_ICONS } from "../components/categoryIcons";

export default function AdminDashboard({ onViewComplaint }) {
  const { token, user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [s, c, d, u] = await Promise.all([
          api(
            user?.role==="dept_admin"
            ? "/complaints"
            : "/admin/dashboard",
            "GET",
            null,
            token
          ),
          api("/complaints", "GET", null, token),
          api("/departments", "GET", null, token),
          user?.role==="admin"
 ? api("/admin/users","GET",null,token)
 : Promise.resolve({users:[]}),
        ]);
        if(user?.role==="dept_admin"){
          setStats({
            totalComplaints:c.complaints?.length || 0,
            pending:c.complaints?.filter(x=>x.status==="pending").length || 0,
            assigned:c.complaints?.filter(x=>x.status==="assigned").length || 0,
            inProgress:c.complaints?.filter(x=>x.status==="in-progress").length || 0,
            resolved:c.complaints?.filter(x=>x.status==="resolved").length || 0,
            rejected:c.complaints?.filter(x=>x.status==="rejected").length || 0,
            totalUsers:0,
            totalStaff:0
          });
        }else{
          setStats(s.stats);
        }
        setComplaints(c.complaints || []);
        setDepartments(d.departments || []);
        setUsers(u.users || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [token, user]);

  const filtered = complaints
    .filter(c => filter === "all" || c.status === filter)
    .filter(c =>
      !search ||
      c.title?.toLowerCase().includes(search.toLowerCase()) ||
      c.complaintId?.includes(search)
    );

  const catData = Object.entries(
    complaints.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  if (loading) return (
    <div style={s.page}>
      <Navbar title="Admin Dashboard" />
      <div style={s.loading}>Loading dashboard...</div>
    </div>
  );

  return (
    <div style={s.page}>
      <Navbar title="Admin Dashboard" />
      <div style={s.content}>

        {/* Header */}
        <div style={s.header}>
          <div>
            <h1 style={s.pageTitle}>Command Centre</h1>
            <p style={s.pageSub}>Municipal Complaint Management Overview</p>
          </div>
          <div style={s.liveTag}>🟢 LIVE</div>
        </div>

        {/* Stats Grid */}
        {stats && (
          <div style={s.statsGrid}>
            {[
              { label:"Total",       value:stats.totalComplaints, icon:"📋", color:"#818cf8", bg:"rgba(129,140,248,0.08)" },
              { label:"Pending",     value:stats.pending,         icon:"⏳", color:"#fbbf24", bg:"rgba(251,191,36,0.08)" },
              { label:"In Progress", value:stats.inProgress,      icon:"⚙️", color:"#60a5fa", bg:"rgba(96,165,250,0.08)" },
              { label:"Resolved",    value:stats.resolved,        icon:"✅", color:"#4ade80", bg:"rgba(74,222,128,0.08)" },
              { label:"Assigned",    value:stats.assigned,        icon:"👤", color:"#c084fc", bg:"rgba(192,132,252,0.08)" },
              { label:"Rejected",    value:stats.rejected,        icon:"❌", color:"#f87171", bg:"rgba(248,113,113,0.08)" },
              { label:"Citizens",    value:stats.totalUsers,      icon:"🏘️", color:"#34d399", bg:"rgba(52,211,153,0.08)" },
              { label:"Staff",       value:stats.totalStaff,      icon:"👷", color:"#fb923c", bg:"rgba(251,146,60,0.08)" },
            ].map(x => (
              <div key={x.label} style={{ ...s.statCard, background: x.bg, borderColor: x.color + "22" }}>
                <div style={s.statTop}>
                  <span style={{ fontSize:"22px" }}>{x.icon}</span>
                  <span style={{ ...s.statVal, color: x.color }}>{x.value}</span>
                </div>
                <div style={s.statLabel}>{x.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
<div style={s.tabs}>
{[
 ...(user?.role==="admin"
   ? [
      ["overview","📊 Overview"],
      ["complaints","📋 Complaints"],
      ["departments","🏛️ Departments"],
      ["admins","👤 Admins"]
     ]
   : [
      ["overview","📊 Overview"],
      ["complaints","📋 Complaints"]
     ])
].map(([t,l]) => (
<button
 key={t}
 style={{...s.tab,...(tab===t ? s.tabActive : {})}}
 onClick={()=>setTab(t)}
>
 {l}
</button>
))}
</div>

        {/* Overview Tab */}
        {tab === "overview" && (
          <div style={s.overview}>
            <div style={s.oCard}>
              <h3 style={s.oTitle}>📊 Complaints by Category</h3>
              {catData.map(([cat, count]) => (
                <div key={cat} style={s.catRow}>
                  <span style={s.catName}>{CATEGORY_ICONS[cat]} {cat.replace("_", " ")}</span>
                  <div style={s.barWrap}>
                    <div style={{ ...s.bar, width: `${Math.min(100, (count / complaints.length) * 100)}%` }} />
                  </div>
                  <span style={s.catCount}>{count}</span>
                </div>
              ))}
            </div>
            <div style={s.oCard}>
              <h3 style={s.oTitle}>⚡ Recent Activity</h3>
              {complaints.slice(0, 6).map(c => (
                <div key={c._id} style={s.recentRow} onClick={() => onViewComplaint(c._id)}>
                  <span style={{ fontSize:"20px", width:"32px", textAlign:"center" }}>
                    {CATEGORY_ICONS[c.category]}
                  </span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ color:"rgba(255,255,255,0.8)", fontSize:"13px", marginBottom:"2px" }}>
                      {c.title?.substring(0, 45)}
                    </div>
                    <div style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", fontFamily:"monospace" }}>
                      {c.complaintId} · {c.citizen?.name}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Complaints Tab */}
        {tab === "complaints" && (
          <div>
            <div style={s.toolbar}>
              <input
                style={s.search}
                placeholder="🔍 Search by title or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div style={{ display:"flex", gap:"6px", flexWrap:"wrap" }}>
                {["all","pending","assigned","in-progress","resolved","rejected"].map(f => (
                  <button
                    key={f}
                    style={{ ...s.filterBtn, ...(filter === f ? s.filterActive : {}) }}
                    onClick={() => setFilter(f)}
                  >
                    {f === "all" ? "All" : f}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.table}>
              <div style={s.thead}>
                <span>ID</span>
                <span>Title</span>
                <span>Citizen</span>
                <span>Category</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Date</span>
              </div>
              {filtered.map(c => (
                <div key={c._id} style={s.trow} onClick={() => onViewComplaint(c._id)}>
                  <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"11px", fontFamily:"monospace" }}>
                    {c.complaintId}
                  </span>
                  <span style={{ color:"rgba(255,255,255,0.85)", fontSize:"13px" }}>
                    {c.title?.substring(0, 35)}{c.title?.length > 35 ? "..." : ""}
                  </span>
                  <span style={s.cell}>{c.citizen?.name || "—"}</span>
                  <span style={s.cell}>{CATEGORY_ICONS[c.category]} {c.category?.replace("_", " ")}</span>
                  <span style={s.cell}><PriorityBadge priority={c.priority} /></span>
                  <span style={s.cell}><StatusBadge status={c.status} /></span>
                  <span style={s.cell}>{new Date(c.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign:"center", padding:"40px", color:"rgba(255,255,255,0.2)" }}>
                  No complaints match this filter
                </div>
              )}
            </div>
          </div>
        )}

        {/* Departments Tab */}
        {tab === "departments" && (
          <div style={s.deptGrid}>
            {departments.map(d => (
              <div key={d._id} style={s.deptCard}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>🏛️</div>
                <h3 style={{ color:"#fff", fontSize:"16px", fontWeight:"600", margin:"0 0 8px" }}>{d.name}</h3>
                <p style={{ color:"rgba(255,255,255,0.3)", fontSize:"12px", margin:"0 0 16px" }}>{d.contactEmail}</p>
                <span style={{ background:"rgba(251,191,36,0.1)", color:"#fbbf24", padding:"4px 12px", borderRadius:"12px", fontSize:"11px", fontFamily:"monospace" }}>
                  {complaints.filter(c => c.department?._id === d._id || c.department === d._id).length} complaints
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Admins Tab */}
{tab === "admins" && user?.role === "admin" && (
  <div style={s.table}>

    <div style={{
display:"grid",
gridTemplateColumns:"1fr 1.5fr 1fr 1.5fr 1fr",
gap:"12px",
padding:"12px 20px",
background:"rgba(255,255,255,0.04)"
}}>
      <span>Name</span>
      <span>Email</span>
      <span>Role</span>
      <span>Department</span>
      <span>Status</span>
    </div>

    {users
      .filter(u => u.role === "dept_admin")
      .map(u => (
        <div
 key={u._id}
 style={{
 display:"grid",
 gridTemplateColumns:"1fr 1.5fr 1fr 1.5fr 1fr",
 gap:"12px",
 padding:"14px 20px",
 borderTop:"1px solid rgba(255,255,255,0.04)"
}}
>
          <span style={s.cell}>{u.name}</span>
          <span style={s.cell}>{u.email}</span>
          <span style={s.cell}>{u.role}</span>
          <span style={s.cell}>
            {u.department?.name || "Not Assigned"}
          </span>
          <span style={s.cell}>
            {u.isActive ? "🟢 Active" : "🔴 Inactive"}
          </span>
        </div>
      ))
    }

  </div>
)}

      </div>
    </div>
  );
}

const s = {
  page:        { minHeight:"100vh", background:"#0a0a0f", fontFamily:"Georgia,serif" },
  loading:     { textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"120px 0", fontSize:"16px" },
  content:     { maxWidth:"1200px", margin:"0 auto", padding:"40px 24px" },
  header:      { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"40px" },
  pageTitle:   { fontSize:"36px", fontWeight:"700", color:"#fff", margin:"0 0 8px" },
  pageSub:     { color:"rgba(255,255,255,0.35)", fontSize:"14px", margin:0, fontStyle:"italic" },
  liveTag:     { background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80", padding:"6px 16px", borderRadius:"20px", fontSize:"12px", fontFamily:"monospace", letterSpacing:"2px" },
  statsGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", marginBottom:"36px" },
  statCard:    { border:"1px solid", borderRadius:"12px", padding:"20px" },
  statTop:     { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"10px" },
  statVal:     { fontSize:"32px", fontWeight:"700" },
  statLabel:   { color:"rgba(255,255,255,0.4)", fontSize:"11px", textTransform:"uppercase", letterSpacing:"1px", fontFamily:"monospace" },
  tabs:        { display:"flex", gap:"8px", marginBottom:"28px" },
  tab:         { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", padding:"10px 22px", borderRadius:"8px", cursor:"pointer", fontSize:"13px" },
  tabActive:   { background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#fbbf24" },
  overview:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"20px" },
  oCard:       { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"24px" },
  oTitle:      { color:"#fff", fontSize:"15px", fontWeight:"600", margin:"0 0 20px" },
  catRow:      { display:"flex", alignItems:"center", gap:"12px", marginBottom:"12px" },
  catName:     { color:"rgba(255,255,255,0.6)", fontSize:"12px", width:"160px", flexShrink:0, textTransform:"capitalize" },
  barWrap:     { flex:1, background:"rgba(255,255,255,0.05)", borderRadius:"4px", height:"6px", overflow:"hidden" },
  bar:         { height:"100%", background:"linear-gradient(90deg,#fbbf24,#f59e0b)", borderRadius:"4px" },
  catCount:    { color:"rgba(255,255,255,0.4)", fontSize:"12px", width:"30px", textAlign:"right", fontFamily:"monospace" },
  recentRow:   { display:"flex", alignItems:"center", gap:"12px", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", cursor:"pointer" },
  toolbar:     { display:"flex", gap:"16px", marginBottom:"20px", flexWrap:"wrap", alignItems:"center" },
  search:      { flex:1, minWidth:"220px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"10px 16px", color:"#fff", fontSize:"13px", outline:"none" },
  filterBtn:   { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.4)", padding:"8px 14px", borderRadius:"6px", cursor:"pointer", fontSize:"12px" },
  filterActive:{ background:"rgba(251,191,36,0.1)", border:"1px solid rgba(251,191,36,0.3)", color:"#fbbf24" },
  table:       { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", overflow:"hidden" },
  thead:       { display:"grid", gridTemplateColumns:"110px 1fr 130px 140px 90px 130px 100px", gap:"12px", padding:"12px 20px", background:"rgba(255,255,255,0.04)", color:"rgba(255,255,255,0.3)", fontSize:"10px", textTransform:"uppercase", letterSpacing:"1.5px", fontFamily:"monospace" },
  trow:        { display:"grid", gridTemplateColumns:"110px 1fr 130px 140px 90px 130px 100px", gap:"12px", padding:"14px 20px", borderTop:"1px solid rgba(255,255,255,0.04)", cursor:"pointer", alignItems:"center" },
  cell:        { color:"rgba(255,255,255,0.6)", fontSize:"12px", textTransform:"capitalize" },
  deptGrid:    { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"16px" },
  deptCard:    { background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"28px", textAlign:"center" },
};