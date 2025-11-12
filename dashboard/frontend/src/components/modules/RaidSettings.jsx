import { useState, useEffect } from "react";
import axios from "axios";
import styles from "../../styles/ModuleSettings.module.css";

export default function RaidSettings({ guildId, user }) {
  const [settings, setSettings] = useState({
    deleteAfter: "",
  });
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchRoles();
  }, [guildId]);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(
        `/guilds/${guildId}/modules/party_raid`,
        {
          withCredentials: true,
        }
      );
      if (response.data.settings) {
        setSettings(response.data.settings);
      }
    } catch (err) {
      console.error("Failed to fetch Raid Party Finder settings:", err);
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
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setLoading(false);
    }
  };

  const getRoleColor = (roleId) => {
    const role = roles.find((r) => r.id === roleId);
    if (!role || role.color === 0) return "#99aab5";
    return `#${role.color.toString(16).padStart(6, "0")}`;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await axios.put(
        `/guilds/${guildId}/modules/party_raid/settings/${user.id}/@${user.username}`,
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

  if (loading) {
    return <div>Loading settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className={styles.settingsForm}>
      <div className={styles.formGroup}>
        <label htmlFor="roleId">Role to Ping (Optional)</label>
        <select
          id="roleId"
          name="roleId"
          value={settings.roleId}
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
        <label htmlFor="deleteAfter">Hours to delete after raid *</label>
        <input
          id="deleteAfter"
          className={styles.select}
          name="deleteAfter"
          type="number"
          value={settings.deleteAfter}
          onChange={handleChange}
          required
        />
        <small>
          How many hours after creation or start of the raid should it be
          deleted?
        </small>
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
