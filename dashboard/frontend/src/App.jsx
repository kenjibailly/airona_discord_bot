import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import GuildSettings from './pages/GuildSettings';
import ModuleSettings from './pages/ModuleSettings';
import ProtectedRoute from './components/ProtectedRoute';

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
    </Routes>
  );
}