import React from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';

// Layouts
import Layout from './components/layout/Layout';

// Pages
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import GamingPage from './pages/GamingPage';
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';

// Context
import { useAuth } from './context/AuthContext';
import { useGesture } from './context/GestureContext';

function App() {
  const { user } = useAuth();
  const { gestureEnabled } = useGesture();

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="watch/:videoId" element={<WatchPage />} />
        <Route path="games" element={<GamingPage />} />
        <Route path="stream" element={<WatchPage />} />
        <Route path="profile" element={user ? <ProfilePage /> : <LoginPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App; 