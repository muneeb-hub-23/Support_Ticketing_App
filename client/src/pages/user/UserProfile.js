import React, { useState, useEffect } from 'react';
import { User, Save, Ticket, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UserProfile() {
  const [profile, setProfile] = useState({
    name: localStorage.getItem('supportName') || '',
    email: localStorage.getItem('supportEmail') || '',
    phone: localStorage.getItem('supportPhone') || '',
    department: localStorage.getItem('supportDept') || '',
    location: localStorage.getItem('supportLocation') || '',
  });
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (profile.name) {
      fetch('/api/tickets').then(r => r.json()).then(all => setTickets(all.filter(t => t.createdBy === profile.name)));
    }
  }, [profile.name]);

  const save = () => {
    Object.entries(profile).forEach(([k, v]) => {
      const map = { name:'supportName', email:'supportEmail', phone:'supportPhone', department:'supportDept', location:'supportLocation' };
      if (map[k]) localStorage.setItem(map[k], v);
    });
    toast.success('Profile saved');
  };

  const open = tickets.filter(t => t.status === 'open').length;
  const resolved = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const inProg = tickets.filter(t => t.status === 'in-progress').length;

  const avatarColor = '#6366f1';
  const initials = profile.name ? profile.name.slice(0,2).toUpperCase() : 'U';

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'800' }}>My Profile</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Manage your account and view your support history</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'300px 1fr', gap:'20px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="card" style={{ textAlign:'center' }}>
            <div style={{ width:'80px', height:'80px', borderRadius:'50%', background:`linear-gradient(135deg,${avatarColor},#8b5cf6)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', fontWeight:'800', color:'white', margin:'0 auto 16px' }}>
              {initials}
            </div>
            <div style={{ fontWeight:'800', fontSize:'18px', marginBottom:'4px' }}>{profile.name || 'Your Name'}</div>
            <div style={{ fontSize:'13px', color:'var(--text-muted)', marginBottom:'4px' }}>{profile.email || 'email@company.com'}</div>
            {profile.department && <div style={{ fontSize:'12px', color:'var(--accent)', fontWeight:'600' }}>{profile.department}</div>}
          </div>

          <div className="card">
            <div className="card-title">Ticket Summary</div>
            {[
              { label:'Open', count:open, color:'var(--accent-red)', icon:<AlertTriangle size={14}/> },
              { label:'In Progress', count:inProg, color:'var(--accent-yellow)', icon:<Clock size={14}/> },
              { label:'Resolved', count:resolved, color:'var(--accent-green)', icon:<CheckCircle size={14}/> },
              { label:'Total', count:tickets.length, color:'var(--accent)', icon:<Ticket size={14}/> },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <span style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'13px', color:'var(--text-secondary)' }}>{s.icon}{s.label}</span>
                <span style={{ fontWeight:'800', fontSize:'18px', color:s.color }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="card">
            <div className="card-title"><User size={15}/> Personal Information</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={profile.name} placeholder="John Smith" onChange={e => setProfile(p => ({...p, name:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={profile.email} placeholder="john@company.com" onChange={e => setProfile(p => ({...p, email:e.target.value}))}/>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={profile.phone} placeholder="+1 (555) 000-0000" onChange={e => setProfile(p => ({...p, phone:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input className="form-input" value={profile.department} placeholder="Engineering, Sales, HR..." onChange={e => setProfile(p => ({...p, department:e.target.value}))}/>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Office / Location</label>
              <input className="form-input" value={profile.location} placeholder="Floor 3, Building A" onChange={e => setProfile(p => ({...p, location:e.target.value}))}/>
            </div>
            <button className="btn btn-primary" onClick={save}><Save size={14}/> Save Profile</button>
          </div>

          <div className="card">
            <div className="card-title"><Ticket size={15}/> Recent Tickets</div>
            {tickets.length === 0 ? (
              <div style={{ textAlign:'center', padding:'32px', color:'var(--text-muted)', fontSize:'13px' }}>No tickets yet</div>
            ) : tickets.slice(0,5).map(t => (
              <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight:'600', fontSize:'13px', marginBottom:'2px' }}>{t.title}</div>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>#{t.id.slice(0,8)} · {new Date(t.createdAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display:'flex', gap:'6px' }}>
                  <span className={`badge badge-${t.status.replace(' ','-')}`}>{t.status}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
