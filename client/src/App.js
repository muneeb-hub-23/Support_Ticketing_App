import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import socket from './socket';
import { AuthProvider, useAuth } from './context/AuthContext';

import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminTickets from './pages/admin/Tickets';
import AdminAgents from './pages/admin/Agents';
import AdminRemoteControl from './pages/admin/RemoteControl';
import AdminTicketDetail from './pages/admin/TicketDetail';
import AdminAnalytics from './pages/admin/Analytics';
import AdminKnowledgeBase from './pages/admin/KnowledgeBase';
import AdminTeamChat from './pages/admin/TeamChat';
import AdminAuditLog from './pages/admin/AuditLog';
import AdminSettings from './pages/admin/Settings';
import AdminUserManagement from './pages/admin/UserManagement';
import UserPortal from './pages/user/UserPortal';
import UserTickets from './pages/user/UserTickets';
import UserDownload from './pages/user/UserDownload';
import UserKnowledgeBase from './pages/user/UserKnowledgeBase';
import UserChat from './pages/user/UserChat';
import UserProfile from './pages/user/UserProfile';
import Login from './pages/auth/Login';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0a0c14', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:'40px', height:'40px', border:'3px solid rgba(99,102,241,0.2)', borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

function AppRoutes() {
  useEffect(() => {
    socket.connect();
    return () => socket.disconnect();
  }, []);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/user" replace />} />
      <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<AdminDashboard />} />
        <Route path="tickets" element={<AdminTickets />} />
        <Route path="tickets/:id" element={<AdminTicketDetail />} />
        <Route path="agents" element={<AdminAgents />} />
        <Route path="remote/:agentId" element={<AdminRemoteControl />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="kb" element={<AdminKnowledgeBase />} />
        <Route path="chat" element={<AdminTeamChat />} />
        <Route path="audit" element={<AdminAuditLog />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="users" element={<AdminUserManagement />} />
      </Route>
      <Route path="/user" element={<UserLayout />}>
        <Route index element={<UserPortal />} />
        <Route path="tickets" element={<UserTickets />} />
        <Route path="download" element={<UserDownload />} />
        <Route path="kb" element={<UserKnowledgeBase />} />
        <Route path="chat" element={<UserChat />} />
        <Route path="profile" element={<UserProfile />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastContainer position="top-right" theme="dark" />
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
