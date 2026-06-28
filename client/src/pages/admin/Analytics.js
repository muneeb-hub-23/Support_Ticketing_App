import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Ticket, Monitor, Clock, CheckCircle, AlertTriangle, Zap, Users } from 'lucide-react';
import socket from '../../socket';

const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

function StatCard({ icon, label, value, sub, color }) {
  return (
    <div className="card stat-card" style={{ borderTop: `3px solid ${color}` }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
          <div style={{ fontSize:'32px', fontWeight:'800', color:'var(--text-primary)', lineHeight:1 }}>{value}</div>
          {sub && <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>{sub}</div>}
        </div>
        <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${color}22`, display:'flex', alignItems:'center', justifyContent:'center', color }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(setTickets);
    fetch('/api/agents').then(r => r.json()).then(setAgents);
    socket.on('ticket:new', () => fetch('/api/tickets').then(r => r.json()).then(setTickets));
    socket.on('ticket:updated', () => fetch('/api/tickets').then(r => r.json()).then(setTickets));
    return () => { socket.off('ticket:new'); socket.off('ticket:updated'); };
  }, []);

  const open = tickets.filter(t => t.status === 'open').length;
  const inProg = tickets.filter(t => t.status === 'in-progress').length;
  const resolved = tickets.filter(t => t.status === 'resolved').length;
  const closed = tickets.filter(t => t.status === 'closed').length;
  const high = tickets.filter(t => t.priority === 'high').length;
  const online = agents.filter(a => a.status === 'online').length;

  // Tickets by day (last 7 days)
  const byDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const count = tickets.filter(t => {
      const td = new Date(t.createdAt);
      return td.toDateString() === d.toDateString();
    }).length;
    return { label, count };
  });

  // By category
  const cats = {};
  tickets.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
  const catData = Object.entries(cats).map(([name, value]) => ({ name, value }));

  // By priority
  const prioData = [
    { name: 'Low', value: tickets.filter(t => t.priority === 'low').length },
    { name: 'Medium', value: tickets.filter(t => t.priority === 'medium').length },
    { name: 'High', value: tickets.filter(t => t.priority === 'high').length },
  ].filter(x => x.value > 0);

  // Resolution trend
  const resolvedByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en', { weekday: 'short' });
    const created = tickets.filter(t => new Date(t.createdAt).toDateString() === d.toDateString()).length;
    const done = tickets.filter(t => t.status === 'resolved' && new Date(t.updatedAt).toDateString() === d.toDateString()).length;
    return { label, created, resolved: done };
  });

  const avgResolveTime = (() => {
    const res = tickets.filter(t => t.status === 'resolved');
    if (!res.length) return 'N/A';
    const avg = res.reduce((acc, t) => acc + (new Date(t.updatedAt) - new Date(t.createdAt)), 0) / res.length;
    const hrs = Math.round(avg / 3600000);
    return hrs < 24 ? `${hrs}h` : `${Math.round(hrs/24)}d`;
  })();

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Analytics</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Real-time insights across all support operations</p>
      </div>

      <div className="stats-grid" style={{ marginBottom:'24px' }}>
        <StatCard icon={<Ticket size={20}/>} label="Total Tickets" value={tickets.length} sub={`${open} open`} color="var(--accent)" />
        <StatCard icon={<AlertTriangle size={20}/>} label="Open Tickets" value={open} sub={`${high} high priority`} color="var(--accent-red)" />
        <StatCard icon={<Clock size={20}/>} label="In Progress" value={inProg} sub="Being worked on" color="var(--accent-yellow)" />
        <StatCard icon={<CheckCircle size={20}/>} label="Resolved" value={resolved + closed} sub={`Avg time: ${avgResolveTime}`} color="var(--accent-green)" />
        <StatCard icon={<Monitor size={20}/>} label="Online Agents" value={online} sub={`${agents.length} total`} color="var(--accent-blue)" />
        <StatCard icon={<Zap size={20}/>} label="Resolution Rate" value={tickets.length ? `${Math.round((resolved+closed)/tickets.length*100)}%` : '0%'} sub="All time" color="var(--accent-purple)" />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'20px' }}>
        <div className="card">
          <div className="card-title"><TrendingUp size={15}/> Ticket Volume — Last 7 Days</div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={byDay}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px' }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#cg)" strokeWidth={2} name="Tickets" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title"><TrendingUp size={15}/> Created vs Resolved</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={resolvedByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fill:'var(--text-muted)', fontSize:11 }} />
              <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} allowDecimals={false} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px' }} />
              <Legend />
              <Line type="monotone" dataKey="created" stroke="#6366f1" strokeWidth={2} dot={{ r:3 }} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={{ r:3 }} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'20px' }}>
        <div className="card">
          <div className="card-title">By Category</div>
          {catData.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px' }} />
                <Legend iconType="circle" iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="text-muted" style={{ textAlign:'center', padding:'40px 0' }}>No data yet</div>}
        </div>

        <div className="card">
          <div className="card-title">By Priority</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={prioData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fill:'var(--text-muted)', fontSize:11 }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill:'var(--text-muted)', fontSize:11 }} width={55} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'8px' }} />
              <Bar dataKey="value" radius={[0,6,6,0]}>
                {prioData.map((e, i) => <Cell key={i} fill={e.name==='High'?'#ef4444':e.name==='Medium'?'#f59e0b':'#10b981'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title"><Users size={15}/> Status Breakdown</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginTop:'8px' }}>
            {[
              { label:'Open', count: open, color:'var(--accent-red)', pct: tickets.length ? Math.round(open/tickets.length*100) : 0 },
              { label:'In Progress', count: inProg, color:'var(--accent-yellow)', pct: tickets.length ? Math.round(inProg/tickets.length*100) : 0 },
              { label:'Resolved', count: resolved, color:'var(--accent-green)', pct: tickets.length ? Math.round(resolved/tickets.length*100) : 0 },
              { label:'Closed', count: closed, color:'var(--text-muted)', pct: tickets.length ? Math.round(closed/tickets.length*100) : 0 },
            ].map(s => (
              <div key={s.label}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'12px', marginBottom:'4px' }}>
                  <span style={{ color:'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ color: s.color, fontWeight:'700' }}>{s.count} <span style={{ color:'var(--text-muted)', fontWeight:'400' }}>({s.pct}%)</span></span>
                </div>
                <div style={{ height:'6px', background:'var(--bg-secondary)', borderRadius:'99px', overflow:'hidden' }}>
                  <div style={{ width:`${s.pct}%`, height:'100%', background: s.color, borderRadius:'99px', transition:'width 0.5s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
