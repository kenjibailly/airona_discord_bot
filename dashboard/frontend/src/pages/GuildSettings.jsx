import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import styles from "../styles/Dashboard.module.css";

export default function GuildSettings() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const [guilds, setGuilds] = useState([]);
  const [guild, setGuild] = useState(null);
  const [user, setUser] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    axios.get("/auth/session", { withCredentials: true })
      .then(res => {
        setUser(res.data.user);
        setGuilds(res.data.guilds || []);
        
        const foundGuild = res.data.guilds.find(g => g.id === guildId);
        
        if (foundGuild) {
          const MANAGE_GUILD = 0x20;
          const hasManagePermission = (parseInt(foundGuild.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
          
          if (hasManagePermission) {
            setGuild(foundGuild);
            setHasPermission(true);
          } else {
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

  const getGuildIconUrl = (guild) => {
    if (!guild || !guild.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  };

  if (!guild || !hasPermission) return <div>Loading...</div>;

  return (
    <div className={styles.container}>
      <Navbar user={user} guilds={guilds} selectedGuildId={guildId} />
      
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
        
        <p>Settings panel coming soon...</p>
      </div>
    </div>
  );
}