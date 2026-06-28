import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Monitor, RefreshCw } from 'lucide-react';
import socket from '../../socket';

export default function AdminAgents() {
  const [agents, setAgents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onList = (list) => setAgents(list);
    const onConnected = (a) => setAgents(prev => [...prev.filter(x => x.id !== a.id), {...a, status:'online'}]);
    const onDisconnected = (d) => setAgents(prev => prev.map(a => a.id === d.agentId ? {...a, status:'offline'} : a));
    const onSysInfo = (d) => setAgents(prev => prev.map(a => a.id === d.agentId ? {...a, systemInfo: d.info} : a));
    socket.on('agents:list', onList);
    socket.on('agent:connected', onConnected);
    socket.on('agent:disconnected', onDisconnected);
    socket.on('agent:systemInfo', onSysInfo);
    return () => {
      socket.off('agents:list', onList);
      socket.off('agent:connected', onConnected);
      socket.off('agent:disconnected', onDisconnected);
      socket.off('agent:systemInfo', onSysInfo);
    };
  }, []);

  const requestSysInfo = (agentId, e) => {
    e.stopPropagation();
    socket.emit('admin:getSystemInfo', { agentId });
  };

  const online = agents.filter(a => a.status === 'online');
  const offline = agents.filter(a => a.status === 'offline');

  return (
    <div>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'24px', fontWeight:'800'}}>Connected Agents</h1>
        <p style={{color:'var(--text-muted)', fontSize:'13px', marginTop:'4px'}}>
          <span style={{color:'var(--accent-green)'}}>{online.length} online</span>
          {offline.length > 0 && <> · <span style={{color:'var(--text-muted)'}}>{offline.length} offline</span></>}
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="card" style={{textAlign:'center', padding:'60px'}}>
          <Monitor size={48} style={{opacity:0.2, margin:'0 auto 16px', display:'block'}} />
          <div style={{fontSize:'18px', fontWeight:'700', marginBottom:'8px'}}>No Agents Connected</div>
          <div style={{color:'var(--text-muted)', fontSize:'14px', marginBottom:'24px'}}>Share the Remote Agent download with users to get started</div>
          <button className="btn btn-primary" onClick={() => navigate('/user/download')}>Download Agent Script</button>
        </div>
      ) : (
        <>
          {online.length > 0 && (
            <div style={{marginBottom:'28px'}}>
              <h2 style={{fontSize:'14px', fontWeight:'700', color:'var(--accent-green)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                🟢 Online ({online.length})
              </h2>
              <div className="agents-grid">
                {online.map(a => (
                  <AgentCard key={a.id} agent={a} onClick={() => navigate(`/admin/remote/${a.id}`)} onRefresh={(e) => requestSysInfo(a.id, e)} />
                ))}
              </div>
            </div>
          )}
          {offline.length > 0 && (
            <div>
              <h2 style={{fontSize:'14px', fontWeight:'700', color:'var(--text-muted)', marginBottom:'12px', textTransform:'uppercase', letterSpacing:'0.5px'}}>
                ⚫ Offline ({offline.length})
              </h2>
              <div className="agents-grid">
                {offline.map(a => (
                  <AgentCard key={a.id} agent={a} onClick={() => {}} onRefresh={() => {}} offline />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AgentCard({ agent, onClick, onRefresh, offline: isOffline }) {
  const si = agent.systemInfo || {};
  const ramUsed = si.totalRam && si.freeRam ? ((si.totalRam - si.freeRam) / si.totalRam * 100).toFixed(0) : null;

  return (
    <div className="agent-card" onClick={isOffline ? undefined : onClick} style={isOffline ? {opacity:0.6, cursor:'default'} : {}}>
      <div className="agent-card-header">
        <div>
          <div className="agent-name">{agent.hostname}</div>
          <div className="agent-meta">{agent.ip} · {agent.username}</div>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px'}}>
          <span className={`badge badge-${isOffline?'offline':'online'}`}>
            <span className={`dot ${isOffline?'dot-gray':'dot-green'}`}></span>
            {isOffline ? 'Offline' : 'Online'}
          </span>
        </div>
      </div>

      <div className="sysinfo-grid" style={{marginBottom:'12px'}}>
        <div className="sysinfo-item">
          <div className="sysinfo-label">CPU</div>
          <div className="sysinfo-value" style={{fontSize:'11px', color:'var(--accent-blue)'}}>{si.cpu?.slice(0,20) || '—'}</div>
        </div>
        <div className="sysinfo-item">
          <div className="sysinfo-label">RAM</div>
          <div className="sysinfo-value" style={{color:'var(--accent-purple)'}}>{si.totalRam ? `${si.totalRam}GB` : '—'}</div>
        </div>
        <div className="sysinfo-item">
          <div className="sysinfo-label">OS</div>
          <div className="sysinfo-value" style={{fontSize:'11px', color:'var(--text-secondary)'}}>{si.release || agent.os?.slice(0,15) || 'Windows'}</div>
        </div>
        <div className="sysinfo-item">
          <div className="sysinfo-label">Uptime</div>
          <div className="sysinfo-value" style={{color:'var(--accent-green)', fontSize:'13px'}}>
            {si.uptime ? `${Math.floor(si.uptime/3600)}h ${Math.floor((si.uptime%3600)/60)}m` : '—'}
          </div>
        </div>
      </div>

      {ramUsed && (
        <div style={{marginBottom:'12px'}}>
          <div style={{display:'flex', justifyContent:'space-between', fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px'}}>
            <span>RAM Usage</span><span>{ramUsed}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{width:`${ramUsed}%`, background: ramUsed > 80 ? 'var(--accent-red)' : ramUsed > 60 ? 'var(--accent-yellow)' : 'var(--accent-green)'}}></div>
          </div>
        </div>
      )}

      {!isOffline && (
        <div style={{display:'flex', gap:'8px'}}>
          <button className="btn btn-primary btn-sm" style={{flex:1, justifyContent:'center'}}>
            <Monitor size={13} /> Remote
          </button>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={onRefresh} title="Refresh Info">
            <RefreshCw size={13} />
          </button>
        </div>
      )}

      <div style={{marginTop:'8px', fontSize:'11px', color:'var(--text-muted)'}}>
        Connected: {new Date(agent.connectedAt).toLocaleString()}
      </div>
    </div>
  );
}
