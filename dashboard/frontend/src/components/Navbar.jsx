import { useNavigate } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";

export default function Navbar({ user, guilds = [], selectedGuildId = "" }) {
  const navigate = useNavigate();

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
    const newGuildId = e.target.value;
    if (newGuildId) {
      navigate(`/guild/${newGuildId}`);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <nav className={styles.navBar}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <h2 
          onClick={() => navigate("/dashboard")} 
          style={{ cursor: "pointer" }}
        >
          Discord Dashboard
        </h2>
        {guilds.length > 0 && (
          <select 
            value={selectedGuildId} 
            onChange={handleGuildChange}
            style={{ padding: "5px 10px", fontSize: "14px" }}
          >
            <option value="">Select a server...</option>
            {guilds.map(g => (
              <option key={g.id} value={g.id}>
                {g.name}
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
              className={styles.avatar}
            />
            <span>{user.global_name}</span>
          </>
        )}
        <button className={styles.button} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}