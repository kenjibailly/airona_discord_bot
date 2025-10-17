import { useEffect, useState } from "react";
import axios from "axios";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [guilds, setGuilds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        setUser(res.data.user);
        setGuilds(res.data.guilds || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch session:", err);
        setLoading(false);
      });
  }, []);

  return { user, guilds, loading };
}
