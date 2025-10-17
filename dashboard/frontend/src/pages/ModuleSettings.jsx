import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WelcomeSettings from "../components/modules/WelcomeSettings";
import useAuth from "../hooks/useAuth";
import styles from "../styles/Dashboard.module.css";

export default function ModuleSettings() {
  const { guildId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, guilds, loading } = useAuth();

  // Render different settings component based on moduleId
  const renderModuleSettings = () => {
    switch(moduleId) {
      case "welcome":
        return <WelcomeSettings guildId={guildId} />;
      
      case "moderation":
        return (
          <div>
            <p>Moderation settings coming soon...</p>
          </div>
        );
      
      case "leveling":
        return (
          <div>
            <p>Leveling settings coming soon...</p>
          </div>
        );
      
      default:
        return (
          <div>
            <p>Unknown module: {moduleId}</p>
          </div>
        );
    }
  };

  // Get module title
  const getModuleTitle = () => {
    const titles = {
      welcome: "Welcome Messages",
      moderation: "Auto Moderation",
      leveling: "Leveling System"
    };
    return titles[moduleId] || moduleId;
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Navbar user={user} guilds={guilds} selectedGuildId={guildId} />
     
      <div style={{ padding: "2rem" }}>
        <button 
          className={styles.button} 
          onClick={() => navigate(`/guild/${guildId}`)} 
          style={{ marginBottom: "1rem" }}
        >
          ← Back to Guild Settings
        </button>
       
        <h1 style={{ marginBottom: "2rem" }}>{getModuleTitle()} Settings</h1>
       
        {renderModuleSettings()}
      </div>
    </div>
  );
}