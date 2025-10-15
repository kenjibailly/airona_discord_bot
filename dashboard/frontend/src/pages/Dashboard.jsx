import { useEffect, useState } from "react";
import axios from "axios";
import GuildSelector from "../components/GuildSelector";

export default function Dashboard() {
  const [guilds, setGuilds] = useState([]);

  useEffect(() => {
    axios.get("/auth/session", { withCredentials: true })
      .then(res => {
        setGuilds(res.data.guilds || []);
      })
      .catch(console.error);
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <GuildSelector guilds={guilds} />
    </div>
  );
}
