import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/ModuleSettings.module.css";

const WORLD_BOSSES = {
  "00": [
    // XX:00 spawns
    { name: "Golden Juggernaut", level: 10 },
    { name: "Inferno Ogre", level: 25 },
    { name: "Brigand Leader", level: 35 },
    { name: "Muku Chief", level: 45 },
    { name: "Storm Goblin King", level: 55 },
    { name: "Celestial Flier", level: 60 },
    { name: "Goblin King", level: 60 },
  ],
  30: [
    // XX:30 spawns
    { name: "Frost Ogre", level: 20 },
    { name: "Phantom Arachnocrab", level: 30 },
    { name: "Venobzzar Incubator", level: 40 },
    { name: "Iron Fang", level: 50 },
    { name: "Tempest Ogre", level: 60 },
    { name: "Lizardman King", level: 60 },
    { name: "Muku King", level: 60 },
  ],
};

const SPECIAL_BOSSES = [
  {
    name: "Lovely Boarlet",
    level: 1,
    times: ["10:00", "14:00", "18:00"],
  },
  {
    name: "Breezy Boarlet",
    level: 1,
    times: ["12:00", "16:00", "20:00"],
  },
];

export default function WorldBossSettings({ guildId, user }) {
  const [worldBossSettings, setWorldBossSettings] = useState({
    roleId: "",
    channelId: "",
    minutesBefore: 5,
  });
  
  const [specialBossSettings, setSpecialBossSettings] = useState({
    roleId: "",
    channelId: "",
    minutesBefore: 5,
  });

  const [embedColor, setEmbedColor] = useState("#ff6b00");
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchRoles();
    fetchChannels();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`/guilds/${guildId}/modules/worldboss`, {
        withCredentials: true,
      });

      if (response.data.settings && Object.keys(response.data.settings).length > 0) {
        const settings = response.data.settings;
        
        // Load world boss settings
        if (settings.worldBoss) {
          setWorldBossSettings(settings.worldBoss);
        }
        
        // Load special boss settings
        if (settings.specialBoss) {
          setSpecialBossSettings(settings.specialBoss);
        }
        
        // Load embed color (shared between both)
        if (settings.embedColor) {
          setEmbedColor(settings.embedColor);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch world boss settings:", err);
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`/guilds/${guildId}/roles`, {
        withCredentials: true,
      });
      const assignableRoles = (response.data.roles || []).filter(
        (role) => !role.managed
      );
      setRoles(assignableRoles);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  };

  const fetchChannels = async () => {
    try {
      const response = await axios.get(`/guilds/${guildId}/channels`, {
        withCredentials: true,
      });
      setChannels(response.data.channels || []);
    } catch (err) {
      console.error("Failed to fetch channels:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!worldBossSettings.channelId) {
      alert("Please select a notification channel for World Bosses");
      return;
    }

    if (!specialBossSettings.channelId) {
      alert("Please select a notification channel for Special Bosses");
      return;
    }

    if (worldBossSettings.minutesBefore < 1 || worldBossSettings.minutesBefore > 60) {
      alert("World Boss minutes before spawn must be between 1 and 60");
      return;
    }

    if (specialBossSettings.minutesBefore < 1 || specialBossSettings.minutesBefore > 60) {
      alert("Special Boss minutes before spawn must be between 1 and 60");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        `/guilds/${guildId}/modules/worldboss/settings/${user.id}/@${user.username}`,
        {
          settings: {
            worldBoss: worldBossSettings,
            specialBoss: specialBossSettings,
            embedColor: embedColor,
          },
        },
        { withCredentials: true }
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleWorldBossChange = (e) => {
    const { name, value } = e.target;
    setWorldBossSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSpecialBossChange = (e) => {
    const { name, value } = e.target;
    setSpecialBossSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getRoleColor = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.color === 0) return "#99aab5";
    return `#${role.color.toString(16).padStart(6, "0")}`;
  };

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className={styles.settingsForm}>
      <div className={styles.categorySection}>
        <h3>⚔️ World Boss Settings</h3>
        
        <div className={styles.formGroup}>
          <label htmlFor="worldBoss-channelId">Notification Channel *</label>
          <select
            id="worldBoss-channelId"
            name="channelId"
            value={worldBossSettings.channelId}
            onChange={handleWorldBossChange}
            className={styles.select}
            required
          >
            <option value="">Select a channel...</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                # {channel.name}
              </option>
            ))}
          </select>
          <small>Channel where boss notifications will be sent</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="worldBoss-roleId">Role to Ping (Optional)</label>
          <select
            id="worldBoss-roleId"
            name="roleId"
            value={worldBossSettings.roleId}
            onChange={handleWorldBossChange}
            className={styles.select}
          >
            <option value="">No role (notifications without ping)</option>
            {roles.map((role) => (
              <option
                key={role.id}
                value={role.id}
                style={{
                  color: getRoleColor(role.id),
                  fontWeight: "500",
                }}
              >
                {role.name}
              </option>
            ))}
          </select>
          <small>
            Select a role to ping, or leave empty to send notifications without
            pinging
          </small>
        </div>

        {worldBossSettings.roleId && (
          <div className={styles.preview}>
            <strong>Selected Role:</strong>
            <span
              className={styles.rolePreview}
              style={{
                color: getRoleColor(worldBossSettings.roleId),
                backgroundColor: `${getRoleColor(worldBossSettings.roleId)}20`,
                border: `1px solid ${getRoleColor(worldBossSettings.roleId)}`,
              }}
            >
              {roles.find((r) => r.id === worldBossSettings.roleId)?.name ||
                "Unknown Role"}
            </span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="worldBoss-minutesBefore">Minutes Before Spawn *</label>
          <input
            id="worldBoss-minutesBefore"
            className={styles.select}
            name="minutesBefore"
            type="number"
            min="1"
            max="60"
            value={worldBossSettings.minutesBefore}
            onChange={handleWorldBossChange}
            required
          />
          <small>
            How many minutes before the boss spawns to send the notification
            (1-60)
          </small>
        </div>
      </div>

      <div className={styles.categorySection}>
        <h3>🐗 Special Boss Settings</h3>
        <div className={styles.formGroup}>
          <label htmlFor="specialBoss-channelId">Notification Channel *</label>
          <select
            id="specialBoss-channelId"
            name="channelId"
            value={specialBossSettings.channelId}
            onChange={handleSpecialBossChange}
            className={styles.select}
            required
          >
            <option value="">Select a channel...</option>
            {channels.map((channel) => (
              <option key={channel.id} value={channel.id}>
                # {channel.name}
              </option>
            ))}
          </select>
          <small>Channel where boss notifications will be sent</small>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="specialBoss-roleId">Role to Ping (Optional)</label>
          <select
            id="specialBoss-roleId"
            name="roleId"
            value={specialBossSettings.roleId}
            onChange={handleSpecialBossChange}
            className={styles.select}
          >
            <option value="">No role (notifications without ping)</option>
            {roles.map((role) => (
              <option
                key={role.id}
                value={role.id}
                style={{
                  color: getRoleColor(role.id),
                  fontWeight: "500",
                }}
              >
                {role.name}
              </option>
            ))}
          </select>
          <small>
            Select a role to ping, or leave empty to send notifications without
            pinging
          </small>
        </div>

        {specialBossSettings.roleId && (
          <div className={styles.preview}>
            <strong>Selected Role:</strong>
            <span
              className={styles.rolePreview}
              style={{
                color: getRoleColor(specialBossSettings.roleId),
                backgroundColor: `${getRoleColor(specialBossSettings.roleId)}20`,
                border: `1px solid ${getRoleColor(specialBossSettings.roleId)}`,
              }}
            >
              {roles.find((r) => r.id === specialBossSettings.roleId)?.name ||
                "Unknown Role"}
            </span>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="specialBoss-minutesBefore">Minutes Before Spawn *</label>
          <input
            id="specialBoss-minutesBefore"
            className={styles.select}
            name="minutesBefore"
            type="number"
            min="1"
            max="60"
            value={specialBossSettings.minutesBefore}
            onChange={handleSpecialBossChange}
            required
          />
          <small>
            How many minutes before the boss spawns to send the notification
            (1-60)
          </small>
        </div>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="embedColor">Embed Color (Shared)</label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            id="embedColor"
            name="embedColor"
            type="text"
            value={embedColor}
            onChange={(e) => setEmbedColor(e.target.value)}
            placeholder="#ff6b00"
            style={{
              flex: 1,
              backgroundColor: "var(--secondary-color)",
              color: "white",
              border: "none",
              borderRadius: "3px",
              padding: "0.5rem",
            }}
          />
          <input
            type="color"
            value={embedColor}
            onChange={(e) => setEmbedColor(e.target.value)}
            style={{ width: "60px", height: "38px", cursor: "pointer" }}
          />
        </div>
        <small>Color of the notification embed (applies to both boss types)</small>
      </div>

      <div className={styles.infoBox}>
        <h4>⚔️ Boss Spawn Times:</h4>
        <div style={{ marginTop: "0.5rem" }}>
          <strong>Every hour at XX:00:</strong>
          <ul style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
            {WORLD_BOSSES["00"].map((boss, i) => (
              <li key={i}>
                {boss.name} (Lv. {boss.level})
              </li>
            ))}
          </ul>
          <strong>Every hour at XX:30:</strong>
          <ul style={{ marginTop: "0.25rem", marginBottom: "0.75rem" }}>
            {WORLD_BOSSES["30"].map((boss, i) => (
              <li key={i}>
                {boss.name} (Lv. {boss.level})
              </li>
            ))}
          </ul>
          <strong>🐗 Special Bosses:</strong>
          <ul style={{ marginTop: "0.25rem" }}>
            {SPECIAL_BOSSES.map((boss, i) => (
              <li key={i}>
                {boss.name} (Lv. {boss.level}) - {boss.times.join(", ")}
              </li>
            ))}
          </ul>
        </div>
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
          ℹ️ All times are displayed in your local timezone via Discord
          timestamps.
        </p>
      </div>

      <div className={styles.buttonGroup}>
        <button type="submit" disabled={saving} className={styles.saveButton}>
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {saveSuccess && (
          <span className={styles.successMessage}>
            ✓ Settings saved successfully!
          </span>
        )}
      </div>
    </form>
  );
}