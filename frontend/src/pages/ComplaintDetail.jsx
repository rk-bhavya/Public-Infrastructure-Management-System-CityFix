import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { api } from "../utils/api";
import Navbar from "../components/Navbar";
import { StatusBadge, PriorityBadge } from "../components/StatusBadge";
import { CATEGORY_ICONS } from "../components/categoryIcons";

const STATUSES = ["pending","assigned","in-progress","resolved","rejected","closed"];

export default function ComplaintDetail({ complaintId, onBack }) {
  const { token, user } = useContext(AuthContext);
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusForm, setStatusForm] = useState({ status:"", comment:"" });
  const [assignForm, setAssignForm] = useState({ departmentId:"", dueDate:"" });
  const [feedback, setFeedback] = useState({ rating:5, comment:"" });
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState("");
  const [panel, setPanel] = useState(null);

  useEffect(() => {
    const loadComplaint = async () => {
      try {
        const d = await api(`/complaints/${complaintId}`, "GET", null, token);
        setComplaint(d.complaint);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const loadDepts = async () => {
      try {
        const d = await api("/departments", "GET", null, token);
        setDepartments(d.departments || []);
      } catch {
        // departments failed to load silently
      }
    };

    loadComplaint();
    if (user?.role === "admin" || user?.role === "staff") loadDepts();
  }, [complaintId, token, user?.role]);

  const updateStatus = async () => {
    if (!statusForm.status) return;
    setUpdating(true);
    try {
      await api(`/complaints/${complaintId}/status`, "PUT", statusForm, token);
      setMsg("✅ Status updated successfully!");
      setPanel(null);
      const d = await api(`/complaints/${complaintId}`, "GET", null, token);
      setComplaint(d.complaint);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const assignComplaint = async () => {
    if (!assignForm.departmentId) return;
    setUpdating(true);
    try {
      await api(`/complaints/${complaintId}/assign`, "PUT", assignForm, token);
      setMsg("✅ Complaint assigned!");
      setPanel(null);
      const d = await api(`/complaints/${complaintId}`, "GET", null, token);
      setComplaint(d.complaint);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const submitFeedback = async () => {
    setUpdating(true);
    try {
      await api(`/complaints/${complaintId}/feedback`, "POST", feedback, token);
      setMsg("✅ Feedback submitted! Thank you.");
      const d = await api(`/complaints/${complaintId}`, "GET", null, token);
      setComplaint(d.complaint);
    } catch (err) {
      setMsg("❌ " + err.message);
    } finally {
      setUpdating(false);
    }
  };
  const deleteComplaint = async () => {
  if (!window.confirm("Are you sure you want to delete this complaint?")) return;

  setUpdating(true);
  try {
    await api(`/complaints/${complaintId}`, "DELETE", null, token);
    setMsg("✅ Complaint deleted successfully");
    onBack(); // go back to dashboard
  } catch (err) {
    setMsg("❌ " + err.message);
  } finally {
    setUpdating(false);
  }
};

  if (loading) return (
    <div style={s.page}>
      <Navbar title="Complaint Details" />
      <div style={s.loading}>Loading complaint...</div>
    </div>
  );

  if (!complaint) return (
    <div style={s.page}>
      <Navbar title="Complaint Details" />
      <div style={s.loading}>Complaint not found.</div>
    </div>
  );

  const isAdmin =
  user?.role === "admin" ||
  user?.role === "staff" ||
  user?.role === "dept_admin";
  const isCitizen = user?.role === "citizen";

  return (
    <div style={s.page}>
      <Navbar title="Complaint Details" />
      <div style={s.content}>
        <button style={s.back} onClick={onBack}>← Back</button>

        {/* Message Banner */}
        {msg && (
          <div style={{ ...s.msg, ...(msg.startsWith("✅") ? s.msgOk : s.msgErr) }}>
            {msg}
            <button style={s.msgX} onClick={() => setMsg("")}>×</button>
          </div>
        )}

        {/* Header */}
        <div style={s.header}>
          <div style={{ display:"flex", gap:"20px", alignItems:"flex-start" }}>
            <div style={s.catBig}>{CATEGORY_ICONS[complaint.category]}</div>
            <div>
              <div style={s.cid}>{complaint.complaintId}</div>
              <h1 style={s.title}>{complaint.title}</h1>
              <div style={s.badgeRow}>
                <StatusBadge status={complaint.status} />
                <PriorityBadge priority={complaint.priority} />
                <span style={{ color:"rgba(255,255,255,0.3)", fontSize:"12px" }}>
                  Filed {new Date(complaint.createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={s.grid}>

          {/* Left Column */}
          <div style={s.leftCol}>

            {/* Description */}
            <div style={s.section}>
              <h3 style={s.sTitle}>📝 Description</h3>
              <p style={{ color:"rgba(255,255,255,0.65)", fontSize:"15px", lineHeight:1.8, margin:0 }}>
                {complaint.description}
              </p>
            </div>

            {/* Location */}
            <div style={s.section}>
              <h3 style={s.sTitle}>📍 Location</h3>
              {[
                ["Address", complaint.location?.address],
                ["Ward",    complaint.location?.ward],
                ["PIN",     complaint.location?.pincode],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={s.locRow}>
                  <span style={s.locKey}>{k}</span>
                  <span style={s.locVal}>{v}</span>
                </div>
              ))}
            </div>

            {/* Timeline */}
            <div style={s.section}>
              <h3 style={s.sTitle}>🕐 Status Timeline</h3>
              <div style={{ paddingLeft:"20px" }}>
                {complaint.statusHistory?.map((h, i) => (
                  <div key={i} style={{ position:"relative", paddingBottom:"20px" }}>
                    <div style={{ position:"absolute", left:"-20px", top:"6px", width:"10px", height:"10px", borderRadius:"50%", background:"#fbbf24", border:"2px solid #0a0a0f" }} />
                    {i < complaint.statusHistory.length - 1 && (
                      <div style={{ position:"absolute", left:"-16px", top:"16px", width:"2px", height:"calc(100% - 4px)", background:"rgba(255,255,255,0.08)" }} />
                    )}
                    <div style={{ paddingLeft:"8px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"12px", marginBottom:"6px", flexWrap:"wrap" }}>
                        <StatusBadge status={h.status} />
                        <span style={{ color:"rgba(255,255,255,0.25)", fontSize:"11px", fontFamily:"monospace" }}>
                          {new Date(h.changedAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
                        </span>
                      </div>
                      {h.comment && (
                        <p style={{ color:"rgba(255,255,255,0.5)", fontSize:"13px", margin:"4px 0" }}>{h.comment}</p>
                      )}
                      {h.changedBy && (
                        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:"11px", margin:0, fontStyle:"italic" }}>
                          by {h.changedBy?.name || "System"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Citizen Feedback Form */}
            {isCitizen && complaint.status === "resolved" && !complaint.feedback?.rating && (
              <div style={s.section}>
                <h3 style={s.sTitle}>⭐ Rate This Resolution</h3>
                <div style={{ display:"flex", gap:"8px", marginBottom:"16px" }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button
                      key={r}
                      style={{ background:"none", border:"none", fontSize:"32px", cursor:"pointer", color: feedback.rating >= r ? "#fbbf24" : "rgba(255,255,255,0.15)", padding:0 }}
                      onClick={() => setFeedback({ ...feedback, rating: r })}
                    >★</button>
                  ))}
                </div>
                <textarea
                  style={s.textarea}
                  rows={3}
                  placeholder="Share your experience..."
                  value={feedback.comment}
                  onChange={e => setFeedback({ ...feedback, comment: e.target.value })}
                />
                <button style={s.actionBtn} onClick={submitFeedback} disabled={updating}>
                  {updating ? "Submitting..." : "Submit Feedback"}
                </button>
              </div>
            )}

            {/* Feedback display */}
            {complaint.feedback?.rating && (
              <div style={s.section}>
                <h3 style={s.sTitle}>⭐ Citizen Feedback</h3>
                <div style={{ color:"#fbbf24", fontSize:"24px", marginBottom:"8px" }}>
                  {"★".repeat(complaint.feedback.rating)}{"☆".repeat(5 - complaint.feedback.rating)}
                </div>
                {complaint.feedback.comment && (
                  <p style={{ color:"rgba(255,255,255,0.6)", fontSize:"14px", fontStyle:"italic" }}>
                    {complaint.feedback.comment}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div style={s.rightCol}>

            {/* Info Card */}
            <div style={s.infoCard}>
              <h3 style={s.iTitle}>📋 Details</h3>
              {[
                ["Citizen",    complaint.citizen?.name],
                ["Email",      complaint.citizen?.email],
                ["Phone",      complaint.citizen?.phone || "—"],
                ["Category",   `${CATEGORY_ICONS[complaint.category]} ${complaint.category?.replace("_", " ")}`],
                complaint.department  ? ["Department",  complaint.department?.name]  : null,
                complaint.assignedTo  ? ["Assigned To", complaint.assignedTo?.name]  : null,
                complaint.dueDate     ? ["Due Date",    new Date(complaint.dueDate).toLocaleDateString("en-IN")]    : null,
                complaint.resolvedAt  ? ["Resolved",    new Date(complaint.resolvedAt).toLocaleDateString("en-IN")] : null,
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={s.iRow}>
                  <span style={s.iKey}>{k}</span>
                  <span style={s.iVal}>{v}</span>
                </div>
              ))}
            </div>
            {isCitizen && complaint.status === "pending" && (
  <button
    style={s.deleteBtn}
    onClick={deleteComplaint}
    disabled={updating}
  >
    🗑️ Delete Complaint
  </button>
)}

            {/* Admin Actions */}
            {isAdmin && (
              <div style={s.actCard}>
                <h3 style={s.iTitle}>⚡ Admin Actions</h3>

                {user?.role==="dept_admin" && (
<>
  {/* Update Status */}
  <button
    style={s.toggle}
    onClick={() => setPanel(panel === "status" ? null : "status")}
  >
    {panel === "status" ? "▼" : "►"} Update Status
  </button>

  {panel === "status" && (
    <div style={s.panelBox}>
      <select
        style={s.select}
        value={statusForm.status}
        onChange={e =>
          setStatusForm({
            ...statusForm,
            status: e.target.value
          })
        }
      >
        <option value="">Select status...</option>
        {STATUSES.map(st => (
          <option key={st} value={st}>
            {st}
          </option>
        ))}
      </select>

      <textarea
        style={s.textarea}
        rows={2}
        placeholder="Add a comment..."
        value={statusForm.comment}
        onChange={e =>
          setStatusForm({
            ...statusForm,
            comment: e.target.value
          })
        }
      />

      <button
        style={s.actionBtn}
        onClick={updateStatus}
        disabled={!statusForm.status || updating}
      >
        {updating ? "Updating..." : "Update Status"}
      </button>

    </div>
  )}
</>
)}

                {/* Assign Department */}
                {user?.role==="admin" && (
<>
  {/* Assign Department */}
  <button style={s.toggle} onClick={() => setPanel(panel === "assign" ? null : "assign")}>
    {panel === "assign" ? "▼" : "►"} Assign Department
  </button>

  {panel === "assign" && (
    <div style={s.panelBox}>
      <select
        style={s.select}
        value={assignForm.departmentId}
        onChange={e => setAssignForm({ ...assignForm, departmentId: e.target.value })}
      >
        <option value="">Select department...</option>
        {departments.map(d=>(
          <option key={d._id} value={d._id}>
            {d.name}
          </option>
        ))}
      </select>

      <input
        style={{ ...s.select, marginBottom:"12px" }}
        type="date"
        value={assignForm.dueDate}
        onChange={e=>setAssignForm({...assignForm,dueDate:e.target.value})}
      />

      <button
        style={s.actionBtn}
        onClick={assignComplaint}
        disabled={!assignForm.departmentId || updating}
      >
        {updating ? "Assigning..." : "Assign Now"}
      </button>
    </div>
  )}
</>
)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:     { minHeight:"100vh", background:"#0a0a0f", fontFamily:"Georgia,serif" },
  loading:  { textAlign:"center", color:"rgba(255,255,255,0.3)", padding:"120px", fontSize:"16px" },
  content:  { maxWidth:"1100px", margin:"0 auto", padding:"32px 24px" },
  back:     { background:"none", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:"13px", marginBottom:"24px", padding:0 },
  msg:      { padding:"12px 20px", borderRadius:"8px", marginBottom:"20px", fontSize:"14px", display:"flex", justifyContent:"space-between", alignItems:"center" },
  msgOk:    { background:"rgba(74,222,128,0.1)", border:"1px solid rgba(74,222,128,0.3)", color:"#4ade80" },
  msgErr:   { background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.3)", color:"#fca5a5" },
  msgX:     { background:"none", border:"none", color:"inherit", cursor:"pointer", fontSize:"18px" },
  header:   { marginBottom:"36px" },
  catBig:   { width:"64px", height:"64px", background:"rgba(255,255,255,0.05)", borderRadius:"14px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", flexShrink:0 },
  cid:      { color:"rgba(255,255,255,0.3)", fontSize:"12px", fontFamily:"monospace", letterSpacing:"2px", marginBottom:"6px" },
  title:    { fontSize:"26px", fontWeight:"700", color:"#fff", margin:"0 0 12px", lineHeight:1.3 },
  badgeRow: { display:"flex", gap:"10px", alignItems:"center", flexWrap:"wrap" },
  grid:     { display:"grid", gridTemplateColumns:"1fr 320px", gap:"24px", alignItems:"start" },
  leftCol:  { display:"flex", flexDirection:"column", gap:"20px" },
  rightCol: { display:"flex", flexDirection:"column", gap:"16px" },
  section:  { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"24px" },
  sTitle:   { color:"rgba(255,255,255,0.7)", fontSize:"13px", fontWeight:"600", margin:"0 0 16px", textTransform:"uppercase", letterSpacing:"1px", fontFamily:"monospace" },
  locRow:   { display:"flex", gap:"16px", marginBottom:"10px" },
  locKey:   { color:"rgba(255,255,255,0.3)", fontSize:"12px", width:"80px", flexShrink:0, fontFamily:"monospace" },
  locVal:   { color:"rgba(255,255,255,0.7)", fontSize:"14px" },
  textarea: { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"12px", color:"#fff", fontSize:"14px", outline:"none", boxSizing:"border-box", resize:"vertical", fontFamily:"inherit", marginBottom:"12px" },
  actionBtn:{ background:"linear-gradient(135deg,#fbbf24,#f59e0b)", color:"#0a0a0f", border:"none", borderRadius:"8px", padding:"12px 20px", fontSize:"13px", fontWeight:"700", cursor:"pointer", width:"100%" },
  infoCard: { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:"12px", padding:"20px" },
  iTitle:   { color:"rgba(255,255,255,0.6)", fontSize:"12px", fontWeight:"600", margin:"0 0 16px", textTransform:"uppercase", letterSpacing:"1px", fontFamily:"monospace" },
  iRow:     { display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" },
  iKey:     { color:"rgba(255,255,255,0.3)", fontSize:"12px" },
  iVal:     { color:"rgba(255,255,255,0.7)", fontSize:"12px", textAlign:"right", textTransform:"capitalize", maxWidth:"160px" },
  actCard:  { background:"rgba(255,255,255,0.02)", border:"1px solid rgba(251,191,36,0.15)", borderRadius:"12px", padding:"20px" },
  toggle:   { width:"100%", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.6)", borderRadius:"8px", padding:"11px 14px", cursor:"pointer", fontSize:"13px", textAlign:"left", marginBottom:"8px" },
  panelBox: { background:"rgba(255,255,255,0.03)", borderRadius:"8px", padding:"16px", marginBottom:"8px" },
  select:   { width:"100%", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"8px", padding:"11px 12px", color:"#fff", fontSize:"13px", outline:"none", marginBottom:"12px", boxSizing:"border-box" },
  deleteBtn: {
  background: "rgba(239,68,68,0.1)",
  border: "1px solid rgba(239,68,68,0.4)",
  color: "#f87171",
  borderRadius: "8px",
  padding: "12px",
  fontSize: "13px",
  fontWeight: "600",
  cursor: "pointer",
  width: "100%",
},
};

