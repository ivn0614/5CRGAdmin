import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import News from './pages/News';
import Events from './pages/Events';
import Activities from './pages/Activities';
import Educational from './pages/Educational';
import HelpCenter from './pages/HelpCenter';
import Users from './pages/UserManager';
import Profile from './pages/Profile';
import LandingPage from './pages/LandingPage';
import Partners from './pages/Partners';
import Inquiries from './pages/Inquiries';
import MainPageManager from './pages/MainPageManager';
import ProtectedRoute from './components/ProtectedRoute';


const App = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      
      {/* Protected routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/news" element={
        <ProtectedRoute>
          <News />
        </ProtectedRoute>
      } />
      <Route path="/events" element={
        <ProtectedRoute>
          <Events />
        </ProtectedRoute>
      } />
      <Route path="/activities" element={
        <ProtectedRoute>
          <Activities />
        </ProtectedRoute>
      } />
      <Route path="/educational" element={
        <ProtectedRoute>
          <Educational />
        </ProtectedRoute>
      } />
      <Route path="/help" element={
        <ProtectedRoute>
          <HelpCenter />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/partners" element={
        <ProtectedRoute>
          <Partners />
        </ProtectedRoute>
      } />
      <Route path="/inquiries" element={
        <ProtectedRoute>
          <Inquiries />
        </ProtectedRoute>
      } />
      <Route path="/mainpagemanager" element={
        <ProtectedRoute>
          <MainPageManager />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;