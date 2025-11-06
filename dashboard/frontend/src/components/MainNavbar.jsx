import { useNavigate } from "react-router-dom";
import { useState } from "react";
import styles from "../styles/Dashboard.module.css";
import useAuth from "../hooks/useAuth";
import Login from "../pages/Login";

export default function MainNavbar() {
  const { user, guilds, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;
    if (user.avatar) {
      const extension = user.avatar.startsWith("a_") ? "gif" : "png";
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extension}`;
    }
    return `https://cdn.discordapp.com/embed/avatars/${
      (parseInt(user.id) >> 22) % 6
    }.png`;
  };

  const getGuildIconUrl = (guild) => {
    if (!guild || !guild.icon) return null;
    return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png`;
  };

  return (
    <nav className={styles.navBar}>
      <div>
        <a class={styles.navLink} href="/">
          Home
        </a>
        <a class={styles.navLink} href="/help">
          Help
        </a>
        <a class={styles.navLink} href="/status">
          Status
        </a>
      </div>
      <div style={{ textAlign: "center", marginLeft: "auto" }}>
        <a
          href={`https://discord.com/api/oauth2/authorize?client_id=${
            import.meta.env.VITE_DISCORD_CLIENT_ID
          }&permissions=8&scope=bot`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ marginRight: "10px" }}
        >
          <button class={styles.button}>Add to server</button>
        </a>
      </div>

      {user ? (
        <div style={{ textAlign: "center" }}>
          <a href="/dashboard">
            <button class={styles.button}>Dashboard</button>
          </a>
        </div>
      ) : (
        <Login />
      )}
    </nav>
  );
}
