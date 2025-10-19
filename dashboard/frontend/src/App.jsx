import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import GuildSettings from "./pages/GuildSettings";
import ModuleSettings from "./pages/ModuleSettings";
import ReactionRoleEditor from "./pages/ReactionRoleEditor";
import EmbedBuilder from "./pages/EmbedBuilder";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guild/:guildId"
        element={
          <ProtectedRoute>
            <GuildSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guild/:guildId/module/:moduleId"
        element={
          <ProtectedRoute>
            <ModuleSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guild/:guildId/module/reactionroles/create"
        element={
          <ProtectedRoute>
            <ReactionRoleEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guild/:guildId/module/reactionroles/edit/:reactionRoleId"
        element={
          <ProtectedRoute>
            <ReactionRoleEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/guild/:guildId/embed-builder"
        element={
          <ProtectedRoute>
            <EmbedBuilder />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
