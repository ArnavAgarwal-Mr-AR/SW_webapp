import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useThemeStore } from './store/themeStore';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { UserDashboard } from './components/dashboard/UserDashboard';
import { CreatePodcast } from './components/podcast/CreatePodcast';
import { JoinPodcast } from './components/podcast/JoinPodcast';
import { PodcastSession } from './components/podcast/PodcastSession';
import { SettingsPage } from './components/settings/SettingsPage';
import { ThemeToggle } from './components/layout/ThemeToggle';

export default function App() {
  const isDarkMode = useThemeStore((state) => state.isDarkMode);

  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <nav className="fixed top-0 right-0 m-4 z-50">
            <ThemeToggle />
          </nav>
          <div className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<LoginForm />} />
              <Route path="/register" element={<RegisterForm />} />
              <Route path="/dashboard" element={<UserDashboard />} />
              <Route path="/create-podcast" element={<CreatePodcast />} />
              <Route path="/join-podcast" element={<JoinPodcast />} />
              <Route path="/session/:inviteKey" element={<PodcastSession />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}