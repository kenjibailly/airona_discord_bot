import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function Dashboard() {
  const [guilds, setGuilds] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedGuild, setSelectedGuild] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/auth/session", { withCredentials: true })
      .then(res => {
        setGuilds(res.data.guilds || []);
        setUser(res.data.user);
      })
      .catch(err => {
        console.error(err);
        navigate("/"); // Redirect to login if not authenticated
      });
  }, [navigate]);

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar) {
      const extension = user.avatar.startsWith('a_') ? 'gif' : 'png';
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${(parseInt(user.id) >> 22) % 6}.png`;
  };

  const handleGuildChange = (e) => {
    const guildId = e.target.value;
    setSelectedGuild(guildId);
    if (guildId) {
      navigate(`/guild/${guildId}`);
    }
  };

  return (
    <div>
      <nav style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        padding: "1rem",
        borderBottom: "1px solid #ccc"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h2>Discord Dashboard</h2>
          {guilds.length > 0 && (
            <select 
              value={selectedGuild} 
              onChange={handleGuildChange}
              style={{ padding: "5px 10px", fontSize: "14px" }}
            >
              <option value="">Select a server...</option>
              {guilds.map(guild => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {user && (
            <>
              <img 
                src={getAvatarUrl(user)} 
                alt={user.global_name}
                style={{ 
                  width: "32px", 
                  height: "32px", 
                  borderRadius: "50%" 
                }}
              />
              <span>{user.global_name}</span>
            </>
          )}
          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div style={{ padding: "2rem" }}>
        <h1>Welcome to your Dashboard!</h1>
        {guilds.length > 0 ? (
          <p>Select a server from the dropdown to configure its settings.</p>
        ) : (
          <div>
            <p>No servers available to manage.</p>
            <p>To manage a server, you need:</p>
            <ul>
              <li>The bot must be in the server</li>
              <li>You must have "Manage Server" permissions</li>
            </ul>
            <p>
            <a 
              href={`https://discord.com/api/oauth2/authorize?client_id=${import.meta.env.VITE_DISCORD_CLIENT_ID}&permissions=8&scope=bot`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Click here to invite the bot to your server
            </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}