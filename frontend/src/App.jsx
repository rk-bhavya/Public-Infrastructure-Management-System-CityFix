import { useState } from "react";
import Login from "./pages/Login";
import Register from "./pages/register";
import CitizenDashboard from "./pages/CitizenDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import FileComplaint from "./pages/FileComplaint";
import ComplaintDetail from "./pages/ComplaintDetail";
import { AuthContext } from "./context/AuthContext";

function getInitialState() {
  try {
    const savedToken = localStorage.getItem("cf_token");
    const savedUser  = localStorage.getItem("cf_user");

    if (
      savedToken &&
      savedUser &&
      savedToken !== "undefined" &&
      savedUser !== "undefined" &&
      savedToken !== "null" &&
      savedUser !== "null"
    ) {
      const parsedUser = JSON.parse(savedUser);

      if (parsedUser && parsedUser.role) {
        return {
          user: parsedUser,
          token: savedToken,

          // UPDATED HERE
          page:
            parsedUser.role === "admin" ||
            parsedUser.role === "staff" ||
            parsedUser.role === "dept_admin"
              ? "admin"
              : "citizen",
        };
      }
    }
  } catch {
  } finally {
    const t = localStorage.getItem("cf_token");
    const u = localStorage.getItem("cf_user");

    if (!t || t === "undefined" || t === "null")
      localStorage.removeItem("cf_token");

    if (!u || u === "undefined" || u === "null")
      localStorage.removeItem("cf_user");
  }

  return {
    user: null,
    token: null,
    page: "login",
  };
}

export default function App() {

  const initial = getInitialState();

  const [user,setUser] = useState(initial.user);
  const [token,setToken] = useState(initial.token);
  const [page,setPage] = useState(initial.page);
  const [selectedComplaintId,setSelectedComplaintId] = useState(null);

  const login = (userData,userToken) => {

    if (!userData || !userToken) return;

    setUser(userData);
    setToken(userToken);

    localStorage.setItem("cf_token",userToken);
    localStorage.setItem("cf_user",JSON.stringify(userData));

    // UPDATED HERE
    setPage(
      userData.role === "admin" ||
      userData.role === "staff" ||
      userData.role === "dept_admin"
        ? "admin"
        : "citizen"
    );
  };

  const logout = () => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("cf_token");
    localStorage.removeItem("cf_user");

    setPage("login");
  };

  const navigate = (p,id=null)=>{
    setPage(p);
    if(id) setSelectedComplaintId(id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        navigate
      }}
    >
      <div style={{minHeight:"100vh",background:"#0a0a0f"}}>

        {page==="login" &&
          <Login onRegister={()=>setPage("register")} />
        }

        {page==="register" &&
          <Register onLogin={()=>setPage("login")} />
        }

        {page==="citizen" && (
          <CitizenDashboard
            onViewComplaint={(id)=>navigate("detail",id)}
            onFileComplaint={()=>navigate("file")}
          />
        )}

        {page==="admin" && (
          <AdminDashboard
            onViewComplaint={(id)=>navigate("detail",id)}
          />
        )}

        {page==="file" && (
          <FileComplaint
            onBack={()=>navigate("citizen")}
            onSuccess={()=>navigate("citizen")}
          />
        )}

        {page==="detail" && (
          <ComplaintDetail
            complaintId={selectedComplaintId}
            onBack={()=>navigate(
              user?.role==="admin" ||
              user?.role==="staff" ||
              user?.role==="dept_admin"
                ? "admin"
                : "citizen"
            )}
          />
        )}

      </div>
    </AuthContext.Provider>
  );
}