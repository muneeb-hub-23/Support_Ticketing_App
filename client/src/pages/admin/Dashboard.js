import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Monitor, AlertTriangle, CheckCircle, Clock, Activity, TrendingUp, Zap } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import socket from '../../socket';

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#64748b'];

export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [activity, setActivity] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onTicketsList = (list) => {
      setTickets(list);
      list.slice(0, 8).forEach(t => {
        setActivity(a => [{
          icon: '🎫', color: '#6366f1',
          text: `New ticket: ${t.title}`,
          time: new Date(t.createdAt).toLocaleTimeString()
        }, ...a].slice(0, 10));
      });
    };
    const onAgentsList = (list) => setAgents(list);
    const onTicketNew = (t) => {
      setTickets(prev => [t, ...prev]);
      setActivity(a => [{ icon: '🎫', color: '#6366f1', text: `New ticket: ${t.title}`, time: new Date().toLocaleTimeString() }, ...a].slice(0, 10));
    };
    const onAgentConnected = (a) => {
      setAgents(prev => [...prev.filter(x => x.id !== a.id), a]);
      setActivity(act => [{ icon: '🖥️', color: '#10b981', text: `Agent connected: ${a.hostname}`, time: new Date().toLocaleTimeString() }, ...act].slice(0, 10));
    };
    const onAgentDisconnected = (d) => {
      setAgents(prev => prev.map(a => a.id === d.agentId ? { ...a, status: 'offline' } : a));
      setActivity(act => [{ icon: '⚠️', color: '#f59e0b', text: `Agent disconnected`, time: new Date().toLocaleTimeString() }, ...act].slice(0, 10));
    };
    const onTicketUpdated = (t) => setTickets(prev => prev.map(x => x.id === t.id ? t : x));

    socket.on('tickets:list', onTicketsList);
    socket.on('agents:list', onAgentsList);
    socket.on('ticket:new', onTicketNew);
    socket.on('agent:connected', onAgentConnected);
    socket.on('agent:disconnected', onAgentDisconnected);
    socket.on('ticket:updated', onTicketUpdated);

    return () => {
      socket.off('tickets:list', onTicketsList);
      socket.off('agents:list', onAgentsList);
      socket.off('ticket:new', onTicketNew);
      socket.off('agent:connected', onAgentConnected);
      socket.off('agent:disconnected', onAgentDisconnected);
      socket.off('ticket:updated', onTicketUpdated);
    };
  }, []);

  const open = tickets.filter(t => t.status === 'open').length;
  const inProgress = tickets.filter(t => t.status === 'in-progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  const onlineAgents = agents.filter(a => a.status === 'online').length;

  const chartData = [
    { name: 'Mon', tickets: 4, resolved: 2 },
    { name: 'Tue', tickets: 7, resolved: 5 },
    { name: 'Wed', tickets: 3, resolved: 3 },
    { name: 'Thu', tickets: 9, resolved: 6 },
    { name: 'Fri', tickets: 5, resolved: 4 },
    { name: 'Sat', tickets: 2, resolved: 2 },
    { name: 'Sun', tickets: open + inProgress, resolved: resolved },
  ];

  const pieData = [
    { name: 'Open', value: Math.max(open, 1) },
    { name: 'In Progress', value: Math.max(inProgress, 1) },
    { name: 'Resolved', value: Math.max(resolved, 1) },
    { name: 'Closed', value: Math.max(tickets.filter(t=>t.status==='closed').length, 1) },
  ];

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'24px', fontWeight:'800'}}>Dashboard</h1>
        <p style={{color:'var(--text-muted)', fontSize:'13px', marginTop:'4px'}}>Real-time overview of your support operations</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/admin/tickets')} style={{cursor:'pointer'}}>
          <div className="stat-icon" style={{background:'rgba(99,102,241,0.15)'}}>
            <Ticket size={22} color="var(--accent)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent)'}}>{open}</div>
            <div className="label">Open Tickets</div>
            <div className="change up">↑ Needs attention</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(245,158,11,0.15)'}}>
            <Clock size={22} color="var(--accent-yellow)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent-yellow)'}}>{inProgress}</div>
            <div className="label">In Progress</div>
            <div className="change">Active work</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(16,185,129,0.15)'}}>
            <CheckCircle size={22} color="var(--accent-green)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent-green)'}}>{resolved}</div>
            <div className="label">Resolved</div>
            <div className="change up">↑ Great work!</div>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/admin/agents')} style={{cursor:'pointer'}}>
          <div className="stat-icon" style={{background:'rgba(59,130,246,0.15)'}}>
            <Monitor size={22} color="var(--accent-blue)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent-blue)'}}>{onlineAgents}</div>
            <div className="label">Online Agents</div>
            <div className="change">{agents.length} total registered</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(139,92,246,0.15)'}}>
            <TrendingUp size={22} color="var(--accent-purple)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent-purple)'}}>{tickets.length}</div>
            <div className="label">Total Tickets</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'rgba(239,68,68,0.15)'}}>
            <AlertTriangle size={22} color="var(--accent-red)" />
          </div>
          <div className="stat-info">
            <div className="value" style={{color:'var(--accent-red)'}}>{tickets.filter(t=>t.priority==='high').length}</div>
            <div className="label">High Priority</div>
            <div className="change down">↑ Urgent</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title"><Activity size={16} /> Ticket Activity (This Week)</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="cTickets" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="cResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2f4a" />
              <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip contentStyle={{background:'#1e2235', border:'1px solid #2a2f4a', borderRadius:'8px', color:'#e2e8f0'}} />
              <Area type="monotone" dataKey="tickets" stroke="#6366f1" fill="url(#cTickets)" strokeWidth={2} name="New" />
              <Area type="monotone" dataKey="resolved" stroke="#10b981" fill="url(#cResolved)" strokeWidth={2} name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title"><Zap size={16} /> Ticket Distribution</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{background:'#1e2235', border:'1px solid #2a2f4a', borderRadius:'8px', color:'#e2e8f0'}} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px'}}>
            {pieData.map((p, i) => (
              <div key={i} style={{display:'flex', alignItems:'center', gap:'6px', fontSize:'12px'}}>
                <div style={{width:'8px', height:'8px', borderRadius:'50%', background:COLORS[i]}}></div>
                <span style={{color:'var(--text-secondary)'}}>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{marginTop:'20px'}}>
        <div className="card">
          <div className="card-title"><Ticket size={16} /> Recent Tickets</div>
          {tickets.slice(0, 6).length === 0 && <div className="text-muted">No tickets yet</div>}
          {tickets.slice(0, 6).map(t => (
            <div key={t.id} className="ticket-item" onClick={() => navigate(`/admin/tickets/${t.id}`)} style={{borderRadius:'8px'}}>
              <div style={{flex:1}}>
                <div style={{fontWeight:'600', fontSize:'14px'}}>{t.title}</div>
                <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>{t.createdBy} · {new Date(t.createdAt).toLocaleDateString()}</div>
              </div>
              <span className={`badge badge-${t.priority}`}>{t.priority}</span>
              <span className={`badge badge-${t.status.replace(' ','-')}`}>{t.status}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><Activity size={16} /> Live Activity</div>
          {activity.length === 0 && <div className="text-muted">Waiting for activity...</div>}
          {activity.map((a, i) => (
            <div key={i} className="activity-item">
              <div className="activity-icon" style={{background:`${a.color}22`}}>
                <span>{a.icon}</span>
              </div>
              <div>
                <div className="activity-text">{a.text}</div>
                <div className="activity-time">{a.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{marginTop:'20px'}}>
        <div className="card-title"><Monitor size={16} /> Online Agents</div>
        {agents.filter(a => a.status === 'online').length === 0
          ? <div className="alert alert-info"><span>No agents currently online. Share the download link with users to connect.</span></div>
          : <div className="agents-grid">
            {agents.filter(a => a.status === 'online').map(a => (
              <div key={a.id} className="agent-card" onClick={() => navigate(`/admin/remote/${a.id}`)}>
                <div className="agent-card-header">
                  <div>
                    <div className="agent-name">{a.hostname}</div>
                    <div className="agent-meta">{a.ip} · {a.username}</div>
                  </div>
                  <span className="badge badge-online"><span className="dot dot-green"></span>Online</span>
                </div>
                <div className="agent-stats">
                  <div className="agent-stat">
                    <div className="agent-stat-label">RAM</div>
                    <div className="agent-stat-value" style={{fontSize:'14px', color:'var(--accent-blue)'}}>{a.systemInfo?.totalRam || '?'}GB</div>
                  </div>
                  <div className="agent-stat">
                    <div className="agent-stat-label">OS</div>
                    <div className="agent-stat-value" style={{fontSize:'12px', color:'var(--text-secondary)'}}>{a.os?.slice(0,12) || 'Windows'}</div>
                  </div>
                </div>
                <div style={{marginTop:'12px'}}>
                  <button className="btn btn-primary btn-sm w-full" style={{justifyContent:'center'}}>
                    <Monitor size={14} /> Remote Control
                  </button>
                </div>
              </div>
            ))}
          </div>
        }
      </div>
    </div>
  );
}
