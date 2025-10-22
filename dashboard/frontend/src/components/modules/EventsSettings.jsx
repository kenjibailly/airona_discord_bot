import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/ModuleSettings.module.css";

export default function EventsSettings({ guildId }) {
  const [settings, setSettings] = useState({
    channelId: "",
    bossRoleId: "",
    bossMinutesBefore: 5,
    guildActivityRoleId: "",
    guildActivityMinutesBefore: 5,
    leisureRoleId: "",
    leisureMinutesBefore: 5,
    embedColor: "#00b4d8",
  });
  const [roles, setRoles] = useState([]);
  const [channels, setChannels] = useState([]);
  const [events, setEvents] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchRoles();
    fetchChannels();
    fetchEvents();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`/guilds/${guildId}/modules/events`, {
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
      console.error("Failed to fetch events settings:", err);
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

  const fetchEvents = async () => {
    try {
      const response = await axios.get(`/events`, {
        withCredentials: true,
      });
      setEvents(response.data.events || null);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!settings.channelId) {
      alert("Please select a notification channel");
      return;
    }

    // Validate minutes before (always validate, even if no role is set)
    if (settings.bossMinutesBefore < 1 || settings.bossMinutesBefore > 60) {
      alert("Boss events: Minutes before event must be between 1 and 60");
      return;
    }

    if (
      settings.guildActivityMinutesBefore < 1 ||
      settings.guildActivityMinutesBefore > 60
    ) {
      alert("Guild activities: Minutes before event must be between 1 and 60");
      return;
    }

    if (
      settings.leisureMinutesBefore < 1 ||
      settings.leisureMinutesBefore > 60
    ) {
      alert(
        "Leisure activities: Minutes before event must be between 1 and 60"
      );
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        `/guilds/${guildId}/modules/events/settings`,
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

  const renderRolePreview = (roleId, label) => {
    if (!roleId) return null;
    return (
      <div className={styles.preview}>
        <strong>{label}:</strong>
        <span
          className={styles.rolePreview}
          style={{
            color: getRoleColor(roleId),
            backgroundColor: `${getRoleColor(roleId)}20`,
            border: `1px solid ${getRoleColor(roleId)}`,
          }}
        >
          {roles.find((r) => r.id === roleId)?.name || "Unknown Role"}
        </span>
      </div>
    );
  };

  const formatTime = (hour, minute) => {
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  };

  const getDayNames = (days) => {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (days.length === 7) return "Every day";
    return days.map((d) => dayMap[d]).join(", ");
  };

  const renderEventSchedule = () => {
    if (!events) {
      return (
        <div className={styles.infoBox}>
          <p>Loading event schedule...</p>
        </div>
      );
    }

    return (
      <div className={styles.infoBox}>
        <h4>📅 Event Schedule (All times in UTC-2):</h4>

        <div style={{ marginTop: "0.5rem" }}>
          {/* Boss Events */}
          {events.boss && events.boss.length > 0 && (
            <>
              <strong>🔥 Boss Events:</strong>
              <ul style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
                {events.boss.map((event, idx) => (
                  <li key={idx}>
                    {event.name}:{" "}
                    {formatTime(event.startTime.hour, event.startTime.minute)} -{" "}
                    {formatTime(event.endTime.hour, event.endTime.minute)} (
                    {getDayNames(event.days)})
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Guild Activities */}
          {events.guildActivity && events.guildActivity.length > 0 && (
            <>
              <strong>⚔️ Guild Activities:</strong>
              <ul style={{ marginTop: "0.25rem", marginBottom: "0.5rem" }}>
                {events.guildActivity.map((event, idx) => (
                  <li key={idx}>
                    {event.name}:{" "}
                    {formatTime(event.startTime.hour, event.startTime.minute)} -{" "}
                    {formatTime(event.endTime.hour, event.endTime.minute)} (
                    {getDayNames(event.days)})
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Leisure Activities */}
          {events.leisure && events.leisure.length > 0 && (
            <>
              <strong>🎯 Leisure Activities:</strong>
              <ul style={{ marginTop: "0.25rem" }}>
                {events.leisure.map((event, idx) => (
                  <li key={idx}>
                    {event.name}:{" "}
                    {event.times
                      .map((t) => formatTime(t.hour, t.minute))
                      .join(", ")}{" "}
                    ({getDayNames(event.days)})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", color: "#666" }}>
          ℹ️ Times are displayed using Discord timestamps, which automatically
          convert to each user's local timezone.
        </p>
      </div>
    );
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
        <small>Channel where event notifications will be sent</small>
      </div>

      {/* Boss Events Section */}
      <div className={styles.categorySection}>
        <h3 className={styles.categoryTitle}>🔥 Boss Events</h3>

        <div className={styles.formGroup}>
          <label htmlFor="bossRoleId">Role to Ping (Optional)</label>
          <select
            id="bossRoleId"
            name="bossRoleId"
            value={settings.bossRoleId}
            onChange={handleChange}
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

        {renderRolePreview(settings.bossRoleId, "Selected Role")}

        <div className={styles.formGroup}>
          <label htmlFor="bossMinutesBefore">Minutes Before Event</label>
          <input
            className={styles.select}
            id="bossMinutesBefore"
            name="bossMinutesBefore"
            type="number"
            min="1"
            max="60"
            value={settings.bossMinutesBefore}
            onChange={handleChange}
          />
          <small>
            How many minutes before boss events to send notification (1-60)
          </small>
        </div>
      </div>

      {/* Guild Activities Section */}
      <div className={styles.categorySection}>
        <h3 className={styles.categoryTitle}>⚔️ Guild Activities</h3>

        <div className={styles.formGroup}>
          <label htmlFor="guildActivityRoleId">Role to Ping (Optional)</label>
          <select
            id="guildActivityRoleId"
            name="guildActivityRoleId"
            value={settings.guildActivityRoleId}
            onChange={handleChange}
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

        {renderRolePreview(settings.guildActivityRoleId, "Selected Role")}

        <div className={styles.formGroup}>
          <label htmlFor="guildActivityMinutesBefore">
            Minutes Before Event
          </label>
          <input
            className={styles.select}
            id="guildActivityMinutesBefore"
            name="guildActivityMinutesBefore"
            type="number"
            min="1"
            max="60"
            value={settings.guildActivityMinutesBefore}
            onChange={handleChange}
          />
          <small>
            How many minutes before guild activities to send notification (1-60)
          </small>
        </div>
      </div>

      {/* Leisure Activities Section */}
      <div className={styles.categorySection}>
        <h3 className={styles.categoryTitle}>🎯 Leisure Activities</h3>

        <div className={styles.formGroup}>
          <label htmlFor="leisureRoleId">Role to Ping (Optional)</label>
          <select
            id="leisureRoleId"
            name="leisureRoleId"
            value={settings.leisureRoleId}
            onChange={handleChange}
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

        {renderRolePreview(settings.leisureRoleId, "Selected Role")}

        <div className={styles.formGroup}>
          <label htmlFor="leisureMinutesBefore">Minutes Before Event</label>
          <input
            id="leisureMinutesBefore"
            className={styles.select}
            name="leisureMinutesBefore"
            type="number"
            min="1"
            max="60"
            value={settings.leisureMinutesBefore}
            onChange={handleChange}
          />
          <small>
            How many minutes before leisure activities to send notification
            (1-60)
          </small>
        </div>
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
            placeholder="#00b4d8"
            style={{
              flex: 1,
              backgroundColor: "var(--secondary-color)",
              color: "white",
              border: "none",
              padding: "0.5rem",
              borderRadius: "3px",
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

      {renderEventSchedule()}

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
