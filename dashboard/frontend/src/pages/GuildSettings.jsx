import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function GuildSettings() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const [guild, setGuild] = useState(null);
  const [user, setUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    axios.get("/auth/session", { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
        const foundGuild = res.data.guilds.find(g => g.id === guildId);
        
        if (foundGuild) {
          // Check MANAGE_GUILD permission
          const MANAGE_GUILD = 0x20;
          const hasManagePermission = (parseInt(foundGuild.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
          
          if (hasManagePermission) {
            setGuild(foundGuild);
            setHasPermission(true);
          } else {
            // User doesn't have permission
            alert("You don't have permission to manage this server");
            navigate("/dashboard");
          }
        } else {
          navigate("/dashboard");
        }
      })
      .catch(err => {
        console.error(err);
        navigate("/");
      });
  }, [guildId, navigate]);

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

  const getGuildIconUrl = (guild) => {
    if (!guild || !guild.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  };

  if (!guild || !hasPermission) return <div>Loading...</div>;

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
          <Link to="/dashboard" style={{ textDecoration: "none", color: "inherit" }}>
            <h2>Discord Dashboard</h2>
          </Link>
          <span>→ {guild.name}</span>
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
        <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "2rem" }}>
          {getGuildIconUrl(guild) && (
            <img 
              src={getGuildIconUrl(guild)} 
              alt={guild.name}
              style={{ 
                width: "64px", 
                height: "64px", 
                borderRadius: "50%" 
              }}
            />
          )}
          <h1>{guild.name} Settings</h1>
        </div>
        
        <p>Guild ID: {guild.id}</p>
        <p>Settings panel coming soon...</p>
      </div>
    </div>
  );
}