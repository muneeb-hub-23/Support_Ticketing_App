import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, Ticket, Download, ArrowRight, BookOpen, MessageCircle, User } from 'lucide-react';

export default function UserLayout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">💬</div>
          <div>
            <h2>Support Portal</h2>
            <span>User Area</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Support</div>
          <NavLink to="/user" end className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Home size={18} /> Home
          </NavLink>
          <NavLink to="/user/tickets" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Ticket size={18} /> My Tickets
          </NavLink>
          <NavLink to="/user/download" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Download size={18} /> Remote Agent
          </NavLink>
          <NavLink to="/user/kb" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <BookOpen size={18} /> Knowledge Base
          </NavLink>
          <NavLink to="/user/chat" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <MessageCircle size={18} /> Live Support Chat
          </NavLink>
          <div className="sidebar-section">Account</div>
          <NavLink to="/user/profile" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <User size={18} /> My Profile
          </NavLink>
          <div className="sidebar-section">Admin</div>
          <NavLink to="/admin" className="nav-item">
            <ArrowRight size={18} /> Admin Panel
          </NavLink>
        </nav>
        <div style={{padding:'16px 20px', borderTop:'1px solid var(--border)', fontSize:'12px', color:'var(--text-muted)'}}>
          Need urgent help? Call <strong style={{color:'var(--text-primary)'}}>IT Support</strong>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">IT Support Portal</div>
          <div className="topbar-right">
            <span style={{fontSize:'12px', color:'var(--text-muted)'}}>Welcome back</span>
            <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'var(--accent-purple)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:'700'}}>U</div>
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
