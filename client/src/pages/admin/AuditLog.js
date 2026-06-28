import React, { useEffect, useState } from 'react';
import { Shield, Search, Filter, RefreshCw, Download, User, Monitor, Ticket, AlertTriangle } from 'lucide-react';
import socket from '../../socket';

const TYPE_ICONS = {
  ticket: <Ticket size={13}/>,
  agent: <Monitor size={13}/>,
  admin: <User size={13}/>,
  system: <AlertTriangle size={13}/>,
};
const TYPE_COLORS = { ticket:'var(--accent)', agent:'var(--accent-green)', admin:'var(--accent-yellow)', system:'var(--accent-red)' };

export default function AdminAuditLog() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    fetch('/api/audit').then(r => r.json()).then(d => { setLogs(d); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
    const onLog = (entry) => setLogs(prev => [entry, ...prev].slice(0, 500));
    socket.on('audit:log', onLog);
    return () => socket.off('audit:log', onLog);
  }, []);

  const filtered = logs.filter(l =>
    (typeFilter === 'all' || l.type === typeFilter) &&
    (l.action?.toLowerCase().includes(search.toLowerCase()) || l.detail?.toLowerCase().includes(search.toLowerCase()) || l.actor?.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCSV = () => {
    const rows = [['Time','Type','Actor','Action','Detail'], ...filtered.map(l => [
      new Date(l.createdAt).toLocaleString(), l.type, l.actor||'', l.action||'', l.detail||''
    ])];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `audit_log_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Audit Log</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>{filtered.length} events</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={load}><RefreshCw size={13}/> Refresh</button>
          <button className="btn btn-secondary btn-sm" onClick={exportCSV}><Download size={13}/> Export CSV</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
        <div className="search-wrap" style={{ flex:1 }}>
          <Search size={14} className="search-icon"/>
          <input className="form-input search-input" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className="form-select" style={{ width:'140px' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="all">All Types</option>
          <option value="ticket">Tickets</option>
          <option value="agent">Agents</option>
          <option value="admin">Admin</option>
          <option value="system">System</option>
        </select>
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'160px 80px 120px 1fr 200px', padding:'10px 16px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          <span>Time</span><span>Type</span><span>Actor</span><span>Action</span><span>Detail</span>
        </div>
        <div style={{ maxHeight:'calc(100vh - 340px)', overflowY:'auto' }}>
          {loading ? (
            <div style={{ textAlign:'center', padding:'40px', color:'var(--text-muted)' }}><div className="spinner" style={{ margin:'0 auto' }}/></div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px', color:'var(--text-muted)' }}>
              <Shield size={40} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
              No audit events yet
            </div>
          ) : filtered.map((l, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 80px 120px 1fr 200px', padding:'10px 16px', borderBottom:'1px solid var(--border)', fontSize:'13px', alignItems:'center' }}
              className="hover-row">
              <span style={{ color:'var(--text-muted)', fontSize:'11px' }}>{new Date(l.createdAt).toLocaleString()}</span>
              <span>
                <span style={{ display:'inline-flex', alignItems:'center', gap:'4px', padding:'2px 8px', borderRadius:'99px', fontSize:'11px', fontWeight:'600', background:`${TYPE_COLORS[l.type]}22`, color: TYPE_COLORS[l.type] }}>
                  {TYPE_ICONS[l.type]} {l.type}
                </span>
              </span>
              <span style={{ color:'var(--text-secondary)', fontWeight:'600', fontSize:'12px' }}>{l.actor || '—'}</span>
              <span style={{ color:'var(--text-primary)', fontWeight:'600' }}>{l.action}</span>
              <span style={{ color:'var(--text-muted)', fontSize:'12px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.detail || '—'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
