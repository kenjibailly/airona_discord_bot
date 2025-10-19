import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Login from "./Login";
import styles from "../styles/Dashboard.module.css";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.user) {
          setIsAuthenticated(true);
        }
        setLoading(false);
      })
      .catch((err) => {
        // Not authenticated
        setIsAuthenticated(false);
        setLoading(false);
      });
  }, []);

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h1>Welcome back!</h1>
        <p>You are already logged in.</p>
        <button class={styles.button} onClick={goToDashboard}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  return <Login />;
}
