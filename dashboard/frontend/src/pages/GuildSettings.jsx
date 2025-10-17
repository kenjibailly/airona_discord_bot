import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import ModuleCard from "../components/ModuleCard";
import useAuth from "../hooks/useAuth";
import styles from "../styles/Dashboard.module.css";

export default function GuildSettings() {
  const { guildId } = useParams();
  const navigate = useNavigate();
  const { user, guilds, loading } = useAuth();
  const [guild, setGuild] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(true);

  useEffect(() => {
    if (!loading && guilds.length > 0) {
      const foundGuild = guilds.find(g => g.id === guildId);
     
      if (foundGuild) {
        const MANAGE_GUILD = 0x20;
        const hasManagePermission = (parseInt(foundGuild.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
       
        if (hasManagePermission) {
          setGuild(foundGuild);
          setHasPermission(true);
          
          // Fetch modules from backend
          fetchModules();
        } else {
          alert("You don't have permission to manage this server");
          navigate("/dashboard");
        }
      } else {
        navigate("/dashboard");
      }
    }
  }, [guildId, guilds, loading, navigate]);

  const fetchModules = async () => {
    try {
      const response = await axios.get(`/guilds/${guildId}/modules`, {
        withCredentials: true
      });
      setModules(response.data.modules);
      setModulesLoading(false);
    } catch (err) {
      console.error("Failed to fetch modules:", err);
      setModulesLoading(false);
    }
  };

  const handleModuleToggle = async (moduleId, newState) => {
    try {
      await axios.post(`/guilds/${guildId}/modules/${moduleId}/toggle`, {
        enabled: newState
      }, { withCredentials: true });
     
      console.log(`Module ${moduleId} toggled to ${newState}`);
     
      // Update local state
      setModules(modules.map(m =>
        m.id === moduleId ? { ...m, enabled: newState } : m
      ));
    } catch (err) {
      console.error("Failed to toggle module:", err);
      throw err;
    }
  };

  const getGuildIconUrl = (guild) => {
    if (!guild || !guild.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  };

  if (loading || !guild || !hasPermission) {
    return <div>Loading...</div>;
  }

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
       
        <h2 style={{ marginBottom: "1rem" }}>Modules</h2>
        
        {modulesLoading ? (
          <div>Loading modules...</div>
        ) : (
          <div>
            {modules.map(module => (
              <ModuleCard
                key={module.id}
                moduleId={module.id}
                title={module.title}
                description={module.description}
                enabled={module.enabled}
                onToggle={(newState) => handleModuleToggle(module.id, newState)}
                guildId={guildId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}