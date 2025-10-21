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

export default function WorldBossSettings({ guildId }) {
  const [settings, setSettings] = useState({
    roleId: "",
    channelId: "",
    minutesBefore: 5,
    embedColor: "#ff6b00",
  });
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

      if (
        response.data.settings &&
        Object.keys(response.data.settings).length > 0
      ) {
        setSettings(response.data.settings);
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

    if (!settings.roleId) {
      alert("Please select a role to ping");
      return;
    }

    if (!settings.channelId) {
      alert("Please select a notification channel");
      return;
    }

    if (settings.minutesBefore < 1 || settings.minutesBefore > 60) {
      alert("Minutes before spawn must be between 1 and 60");
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        `/guilds/${guildId}/modules/worldboss/settings`,
        {
          settings,
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
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
      <div className={styles.formGroup}>
        <label htmlFor="channelId">Notification Channel *</label>
        <select
          id="channelId"
          name="channelId"
          value={settings.channelId}
          onChange={handleChange}
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
        <label htmlFor="roleId">Role to Ping *</label>
        <select
          id="roleId"
          name="roleId"
          value={settings.roleId}
          onChange={handleChange}
          className={styles.select}
          required
        >
          <option value="">Select a role...</option>
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
        <small>This role will be pinged when boss notifications are sent</small>
      </div>

      {settings.roleId && (
        <div className={styles.preview}>
          <strong>Selected Role:</strong>
          <span
            className={styles.rolePreview}
            style={{
              color: getRoleColor(settings.roleId),
              backgroundColor: `${getRoleColor(settings.roleId)}20`,
              border: `1px solid ${getRoleColor(settings.roleId)}`,
            }}
          >
            {roles.find((r) => r.id === settings.roleId)?.name ||
              "Unknown Role"}
          </span>
        </div>
      )}

      <div className={styles.formGroup}>
        <label htmlFor="minutesBefore">Minutes Before Spawn *</label>
        <input
          id="minutesBefore"
          className={styles.select}
          name="minutesBefore"
          type="number"
          min="1"
          max="60"
          value={settings.minutesBefore}
          onChange={handleChange}
          required
        />
        <small>
          How many minutes before the boss spawns to send the notification
          (1-60)
        </small>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="embedColor">Embed Color</label>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input
            id="embedColor"
            name="embedColor"
            type="text"
            value={settings.embedColor}
            onChange={handleChange}
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
            value={settings.embedColor}
            onChange={(e) =>
              setSettings((prev) => ({ ...prev, embedColor: e.target.value }))
            }
            style={{ width: "60px", height: "38px", cursor: "pointer" }}
          />
        </div>
        <small>Color of the notification embed</small>
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
