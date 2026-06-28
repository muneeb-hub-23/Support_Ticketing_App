import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Palette, Server, Mail, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

export default function AdminSettings() {
  const [tab, setTab] = useState(0);
  const [general, setGeneral] = useState({ companyName:'IT Support Desk', supportEmail:'support@company.com', supportPhone:'+1 (555) 000-0000', timezone:'UTC', maxAgents:'50' });
  const [notif, setNotif] = useState({ newTicket:true, agentConnect:true, agentDisconnect:true, highPriority:true, soundAlerts:false, emailNotif:false });
  const [appearance, setAppearance] = useState({ accentColor:'#6366f1', fontSize:'14', compactMode:false });

  const save = (section) => {
    toast.success(`${section} settings saved`);
  };

  const TABS = [
    { label:'General', icon:<SettingsIcon size={15}/> },
    { label:'Notifications', icon:<Bell size={15}/> },
    { label:'Appearance', icon:<Palette size={15}/> },
    { label:'Security', icon:<Shield size={15}/> },
    { label:'Server', icon:<Server size={15}/> },
  ];

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Settings</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Configure your support desk environment</p>
      </div>

      <div style={{ display:'flex', gap:'20px' }}>
        <div style={{ width:'200px', flexShrink:0 }}>
          <div className="card" style={{ padding:'8px 0' }}>
            {TABS.map((t, i) => (
              <button key={i} onClick={() => setTab(i)}
                style={{ display:'flex', alignItems:'center', gap:'10px', width:'100%', padding:'10px 16px', background: tab===i ? 'rgba(99,102,241,0.15)' : 'transparent', color: tab===i ? 'var(--accent)' : 'var(--text-secondary)', border:'none', cursor:'pointer', fontSize:'14px', fontWeight: tab===i ? '600' : '500', borderRight: tab===i ? '2px solid var(--accent)' : '2px solid transparent', textAlign:'left' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex:1 }}>
          {tab === 0 && (
            <div className="card">
              <div className="card-title"><SettingsIcon size={15}/> General Settings</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Company / Desk Name</label>
                  <input className="form-input" value={general.companyName} onChange={e => setGeneral(g => ({...g, companyName:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input className="form-input" type="email" value={general.supportEmail} onChange={e => setGeneral(g => ({...g, supportEmail:e.target.value}))}/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Support Phone</label>
                  <input className="form-input" value={general.supportPhone} onChange={e => setGeneral(g => ({...g, supportPhone:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-select" value={general.timezone} onChange={e => setGeneral(g => ({...g, timezone:e.target.value}))}>
                    {['UTC','America/New_York','America/Chicago','America/Los_Angeles','Europe/London','Europe/Paris','Asia/Karachi','Asia/Kolkata','Asia/Dubai','Asia/Tokyo'].map(tz => <option key={tz}>{tz}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Max Concurrent Agents</label>
                <input className="form-input" style={{ maxWidth:'120px' }} type="number" value={general.maxAgents} onChange={e => setGeneral(g => ({...g, maxAgents:e.target.value}))}/>
              </div>
              <button className="btn btn-primary" onClick={() => save('General')}><Save size={14}/> Save Changes</button>
            </div>
          )}

          {tab === 1 && (
            <div className="card">
              <div className="card-title"><Bell size={15}/> Notification Preferences</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'0' }}>
                {[
                  { key:'newTicket', label:'New Ticket Created', desc:'Alert when a user submits a new support ticket' },
                  { key:'agentConnect', label:'Agent Connected', desc:'Alert when a remote agent comes online' },
                  { key:'agentDisconnect', label:'Agent Disconnected', desc:'Alert when a remote agent goes offline' },
                  { key:'highPriority', label:'High Priority Ticket', desc:'Immediate alert for high priority tickets' },
                  { key:'soundAlerts', label:'Sound Alerts', desc:'Play notification sounds in browser' },
                  { key:'emailNotif', label:'Email Notifications', desc:'Send email for critical events' },
                ].map(item => (
                  <div key={item.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight:'600', fontSize:'14px' }}>{item.label}</div>
                      <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>{item.desc}</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={notif[item.key]} onChange={e => setNotif(n => ({...n, [item.key]:e.target.checked}))}/>
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary" style={{ marginTop:'20px' }} onClick={() => save('Notifications')}><Save size={14}/> Save Changes</button>
            </div>
          )}

          {tab === 2 && (
            <div className="card">
              <div className="card-title"><Palette size={15}/> Appearance</div>
              <div className="form-group">
                <label className="form-label">Accent Color</label>
                <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
                  <input type="color" value={appearance.accentColor} onChange={e => setAppearance(a => ({...a, accentColor:e.target.value}))} style={{ width:'48px', height:'36px', borderRadius:'8px', border:'1px solid var(--border)', background:'transparent', cursor:'pointer' }}/>
                  <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>{appearance.accentColor}</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Base Font Size</label>
                <select className="form-select" style={{ maxWidth:'120px' }} value={appearance.fontSize} onChange={e => setAppearance(a => ({...a, fontSize:e.target.value}))}>
                  {['12','13','14','15','16'].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight:'600', fontSize:'14px' }}>Compact Mode</div>
                  <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>Reduce padding and spacing throughout the UI</div>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={appearance.compactMode} onChange={e => setAppearance(a => ({...a, compactMode:e.target.checked}))}/>
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <button className="btn btn-primary" style={{ marginTop:'20px' }} onClick={() => save('Appearance')}><Save size={14}/> Save Changes</button>
            </div>
          )}

          {tab === 3 && (
            <div className="card">
              <div className="card-title"><Shield size={15}/> Security</div>
              <div className="alert alert-info" style={{ marginBottom:'20px' }}>
                <Shield size={14}/> Authentication is currently disabled. All routes are publicly accessible.
              </div>
              {[
                { label:'Require Admin Password', desc:'Protect admin panel with a password', badge:'Coming Soon' },
                { label:'Session Timeout', desc:'Automatically log out after inactivity', badge:'Coming Soon' },
                { label:'IP Allowlist', desc:'Restrict admin access to specific IP ranges', badge:'Coming Soon' },
                { label:'Two-Factor Auth', desc:'Require 2FA for admin login', badge:'Coming Soon' },
                { label:'Agent Token Auth', desc:'Require secret token for agent registration', badge:'Coming Soon' },
              ].map((item, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight:'600', fontSize:'14px' }}>{item.label}</div>
                    <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'2px' }}>{item.desc}</div>
                  </div>
                  <span className="badge" style={{ background:'rgba(99,102,241,0.15)', color:'var(--accent)', border:'none', fontSize:'10px' }}>{item.badge}</span>
                </div>
              ))}
            </div>
          )}

          {tab === 4 && (
            <div className="card">
              <div className="card-title"><Server size={15}/> Server Info</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'20px' }}>
                {[
                  { label:'Backend URL', value:'http://localhost:5000' },
                  { label:'Frontend URL', value:'http://localhost:3000' },
                  { label:'Socket.IO', value:'Connected' },
                  { label:'Node.js', value:'v26+' },
                  { label:'Agent Script', value:'/api/download/agent-ps1' },
                  { label:'Data Storage', value:'JSON files (server/data/)' },
                ].map(item => (
                  <div key={item.label} style={{ padding:'12px', background:'var(--bg-secondary)', borderRadius:'8px', border:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px', textTransform:'uppercase', letterSpacing:'0.5px' }}>{item.label}</div>
                    <div style={{ fontSize:'13px', fontWeight:'600', color:'var(--accent-green)', fontFamily:'monospace' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => window.location.reload()}><RefreshCw size={13}/> Restart Frontend</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
