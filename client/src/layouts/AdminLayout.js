import React, { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Ticket, Monitor, Users,
  Wifi, WifiOff, ChevronRight, BarChart2, BookOpen,
  MessageSquare, Shield, Settings, LogOut, UserCog
} from 'lucide-react';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const [agentCount, setAgentCount] = useState(0);
  const [ticketCount, setTicketCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  useEffect(() => {
    socket.emit('admin:join');
    setConnected(socket.connected);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onAgentsList = (list) => setAgentCount(list.filter(a => a.status === 'online').length);
    const onAgentConnected = () => setAgentCount(c => c + 1);
    const onAgentDisconnected = () => setAgentCount(c => Math.max(0, c - 1));
    const onTicketsList = (list) => setTicketCount(list.filter(t => t.status === 'open').length);
    const onTicketNew = () => setTicketCount(c => c + 1);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('agents:list', onAgentsList);
    socket.on('agent:connected', onAgentConnected);
    socket.on('agent:disconnected', onAgentDisconnected);
    socket.on('tickets:list', onTicketsList);
    socket.on('ticket:new', onTicketNew);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('agents:list', onAgentsList);
      socket.off('agent:connected', onAgentConnected);
      socket.off('agent:disconnected', onAgentDisconnected);
      socket.off('tickets:list', onTicketsList);
      socket.off('ticket:new', onTicketNew);
    };
  }, []);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🛡️</div>
          <div>
            <h2>SupportDesk</h2>
            <span>Admin Panel</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="sidebar-section">Overview</div>
          <NavLink to="/admin" end className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <LayoutDashboard size={18} /> Dashboard
          </NavLink>
          <NavLink to="/admin/tickets" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Ticket size={18} /> Tickets
            {ticketCount > 0 && <span className="nav-badge red">{ticketCount}</span>}
          </NavLink>

          <div className="sidebar-section">Analytics</div>
          <NavLink to="/admin/analytics" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <BarChart2 size={18} /> Analytics
          </NavLink>

          <div className="sidebar-section">Remote</div>
          <NavLink to="/admin/agents" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Monitor size={18} /> Connected Agents
            {agentCount > 0 && <span className="nav-badge">{agentCount}</span>}
          </NavLink>

          <div className="sidebar-section">Tools</div>
          <NavLink to="/admin/kb" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <BookOpen size={18} /> Knowledge Base
          </NavLink>
          <NavLink to="/admin/chat" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <MessageSquare size={18} /> Team Chat
          </NavLink>
          <NavLink to="/admin/audit" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Shield size={18} /> Audit Log
          </NavLink>

          <div className="sidebar-section">System</div>
          <NavLink to="/admin/users" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <UserCog size={18} /> User Management
          </NavLink>
          <NavLink to="/admin/settings" className={({isActive}) => `nav-item${isActive?' active':''}`}>
            <Settings size={18} /> Settings
          </NavLink>
          <button className="nav-item" onClick={() => navigate('/user')}>
            <Users size={18} /> User Portal <ChevronRight size={14} style={{marginLeft:'auto'}} />
          </button>
        </nav>
        <div style={{padding:'16px 20px', borderTop:'1px solid var(--border)'}}>
          <div style={{display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', marginBottom:'10px'}}>
            {connected
              ? <><span className="dot dot-green"></span><span style={{color:'var(--accent-green)'}}>Server Connected</span></>
              : <><span className="dot dot-red"></span><span style={{color:'var(--accent-red)'}}>Disconnected</span></>
            }
          </div>
          {user && (
            <div style={{display:'flex', alignItems:'center', gap:'8px', padding:'8px 10px', background:'var(--bg-hover)', borderRadius:'8px'}}>
              <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'700',fontSize:'11px',color:'white',flexShrink:0}}>
                {user.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:'12px',fontWeight:'600',color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user.name}</div>
                <div style={{fontSize:'10px',color:'var(--accent)',textTransform:'capitalize'}}>{user.role}</div>
              </div>
              <button onClick={handleLogout} title="Logout" style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',padding:'2px',display:'flex',borderRadius:'4px'}}>
                <LogOut size={14}/>
              </button>
            </div>
          )}
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-title">Admin Control Center</div>
          <div className="topbar-right">
            <div style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'var(--text-muted)'}}>
              {connected ? <Wifi size={14} color="var(--accent-green)" /> : <WifiOff size={14} color="var(--accent-red)" />}
              {connected ? 'Live' : 'Offline'}
            </div>
            {user && (
              <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                <div style={{textAlign:'right',fontSize:'12px'}}>
                  <div style={{color:'var(--text-primary)',fontWeight:'600'}}>{user.name}</div>
                  <div style={{color:'var(--text-muted)',textTransform:'capitalize',fontSize:'11px'}}>{user.role}</div>
                </div>
                <div style={{width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'13px', fontWeight:'700'}}>
                  {user.name.slice(0,2).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Logout"><LogOut size={13}/></button>
              </div>
            )}
          </div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
