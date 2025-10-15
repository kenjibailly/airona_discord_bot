import { useEffect, useState } from "react";
import axios from "axios";
import GuildSelector from "../components/GuildSelector";

export default function Dashboard() {
  const [guilds, setGuilds] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get("/auth/session", { withCredentials: true })
      .then(res => {
        setGuilds(res.data.guilds || []);
        setUser(res.data.user);
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Dashboard</h1>
        <div>
          {user && <span>Welcome, {user.username}!</span>}
          <button onClick={handleLogout} style={{ marginLeft: "10px" }}>
            Logout
          </button>
        </div>
      </div>
      <GuildSelector guilds={guilds} />
    </div>
  );
}