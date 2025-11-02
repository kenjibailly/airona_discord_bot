import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import WelcomeSettings from "../components/modules/WelcomeSettings";
import AutoRoleSettings from "../components/modules/AutoRoleSettings";
import ReactionRolesSettings from "../components/modules/ReactionRolesSettings";
import WorldBossSettings from "../components/modules/WorldBossSettings";
import EventsSettings from "../components/modules/EventsSettings";
import useAuth from "../hooks/useAuth";
import styles from "../styles/Dashboard.module.css";
import RaidSettings from "../components/modules/RaidSettings";
import GoodbyeSettings from "../components/modules/GoodbyeSettings";

export default function ModuleSettings() {
  const { guildId, moduleId } = useParams();
  const navigate = useNavigate();
  const { user, guilds, loading } = useAuth();

  const renderModuleSettings = () => {
    switch (moduleId) {
      case "welcome":
        return <WelcomeSettings guildId={guildId} />;

      case "goodbye":
        return <GoodbyeSettings guildId={guildId} />;

      case "autorole":
        return <AutoRoleSettings guildId={guildId} />;

      case "reactionroles":
        return <ReactionRolesSettings guildId={guildId} />;

      case "worldboss":
        return <WorldBossSettings guildId={guildId} />;

      case "events":
        return <EventsSettings guildId={guildId} />;

      case "party_raid":
        return <RaidSettings guildId={guildId} />;

      default:
        return (
          <div>
            <p>Unknown module: {moduleId}</p>
          </div>
        );
    }
  };

  const getModuleTitle = () => {
    const titles = {
      welcome: "Welcome Messages",
      goodbye: "Goodbye Messages",
      autorole: "Auto Role",
      reactionroles: "Reaction Roles",
      worldboss: "World Boss Notifier",
      events: "Events Notifier",
      party_raid: "Raid Party Finder Settings",
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
