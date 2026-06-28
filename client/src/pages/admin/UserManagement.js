import React, { useEffect, useState } from 'react';
import { Users, Plus, Edit2, Trash2, Shield, User, ToggleLeft, ToggleRight, Key, X, Save, Search } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const ROLES = ['admin', 'support'];

function UserModal({ user, onClose, onSave, currentUserId }) {
  const isNew = !user;
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    role: user?.role || 'admin',
    active: user?.active !== false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required'); return; }
    if (isNew && form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!isNew && form.password && form.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!isNew && !form.password) delete payload.password;
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:'480px' }}>
        <div className="modal-header">
          <div className="modal-title">{isNew ? 'Create New User' : `Edit — ${user.name}`}</div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom:'16px' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="John Smith" required/>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="user@company.com" required/>
          </div>
          <div className="form-group">
            <label className="form-label">Password {!isNew && <span style={{ color:'var(--text-muted)', fontWeight:'400' }}>(leave blank to keep current)</span>}</label>
            <input className="form-input" type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder={isNew ? 'Min 8 characters' : '••••••••'} autoComplete="new-password"/>
          </div>
          {!isNew && user.id !== currentUserId && (
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid var(--border)' }}>
              <div>
                <div style={{ fontWeight:'600', fontSize:'14px' }}>Account Active</div>
                <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>Disabled users cannot log in</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))}/>
                <span className="toggle-slider"></span>
              </label>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : <><Save size={14}/> {isNew ? 'Create User' : 'Save Changes'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ChangePasswordModal({ userId, onClose }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.newPassword !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.newPassword.length < 8) { setError('Minimum 8 characters'); return; }
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/change-password', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Password changed successfully');
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth:'400px' }}>
        <div className="modal-header">
          <div className="modal-title">Change Password</div>
          <button className="modal-close" onClick={onClose}><X size={18}/></button>
        </div>
        {error && <div className="alert alert-danger" style={{ marginBottom:'16px' }}>{error}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input className="form-input" type="password" value={form.currentPassword} onChange={e => setForm(f => ({...f, currentPassword: e.target.value}))} required/>
          </div>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" value={form.newPassword} onChange={e => setForm(f => ({...f, newPassword: e.target.value}))} placeholder="Min 8 characters" required/>
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input className="form-input" type="password" value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} required/>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Change Password'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [changePwFor, setChangePwFor] = useState(null);
  const [search, setSearch] = useState('');
  const { authFetch, user: currentUser } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/users');
      setUsers(await res.json());
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const save = async (payload) => {
    const isNew = !modal?.id;
    const res = await authFetch(isNew ? '/api/users' : `/api/users/${modal.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    toast.success(isNew ? 'User created' : 'User updated');
    load();
  };

  const del = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    const res = await authFetch(`/api/users/${u.id}`, { method:'DELETE' });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('User deleted');
    setUsers(prev => prev.filter(x => x.id !== u.id));
  };

  const toggleActive = async (u) => {
    const res = await authFetch(`/api/users/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ active: !u.active }) });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error); return; }
    setUsers(prev => prev.map(x => x.id === u.id ? data : x));
    toast.success(data.active ? 'Account enabled' : 'Account disabled');
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const activeCount = users.filter(u => u.active).length;

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'800' }}>User Management</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>
            {users.length} users · {adminCount} admins · {activeCount} active
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({})}>
          <Plus size={15}/> New User
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom:'24px' }}>
        {[
          { label:'Total Users', val: users.length, color:'var(--accent)', icon:<Users size={18}/> },
          { label:'Admins', val: adminCount, color:'var(--accent-purple)', icon:<Shield size={18}/> },
          { label:'Active', val: activeCount, color:'var(--accent-green)', icon:<User size={18}/> },
          { label:'Disabled', val: users.length - activeCount, color:'var(--accent-red)', icon:<ToggleLeft size={18}/> },
        ].map(s => (
          <div key={s.label} className="card" style={{ borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'6px' }}>{s.label}</div>
                <div style={{ fontSize:'28px', fontWeight:'800' }}>{s.val}</div>
              </div>
              <div style={{ width:'40px', height:'40px', borderRadius:'10px', background:`${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="search-wrap" style={{ marginBottom:'16px' }}>
        <Search size={14} className="search-icon"/>
        <input className="form-input search-input" placeholder="Search by name, email, or role..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 2fr 100px 100px 140px 120px', padding:'10px 20px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', fontSize:'11px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px' }}>
          <span>Name</span><span>Email</span><span>Role</span><span>Status</span><span>Last Login</span><span style={{ textAlign:'right' }}>Actions</span>
        </div>
        {loading ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)' }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)' }}>
            <Users size={36} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
            No users found
          </div>
        ) : filtered.map((u, i) => (
          <div key={u.id} style={{ display:'grid', gridTemplateColumns:'2fr 2fr 100px 100px 140px 120px', padding:'14px 20px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', alignItems:'center' }} className="hover-row">
            <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
              <div style={{ width:'34px', height:'34px', borderRadius:'50%', background:`linear-gradient(135deg, ${u.role==='admin' ? '#6366f1,#8b5cf6' : '#10b981,#059669'})`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', color:'white', flexShrink:0 }}>
                {u.name.slice(0,2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight:'600', fontSize:'14px' }}>{u.name}</div>
                {u.id === currentUser?.id && <div style={{ fontSize:'10px', color:'var(--accent)', fontWeight:'700' }}>YOU</div>}
              </div>
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:'13px' }}>{u.email}</div>
            <div>
              <span style={{ padding:'3px 10px', borderRadius:'99px', fontSize:'11px', fontWeight:'700', background: u.role==='admin' ? 'rgba(99,102,241,0.15)' : 'rgba(16,185,129,0.15)', color: u.role==='admin' ? 'var(--accent)' : 'var(--accent-green)' }}>
                {u.role==='admin' ? '👑 Admin' : '🎧 Support'}
              </span>
            </div>
            <div>
              <button onClick={() => u.id !== currentUser?.id && toggleActive(u)} style={{ display:'flex', alignItems:'center', gap:'4px', background:'none', border:'none', cursor: u.id===currentUser?.id ? 'default' : 'pointer', padding:0, fontSize:'12px', fontWeight:'600', color: u.active ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                {u.active ? <><ToggleRight size={18}/> Active</> : <><ToggleLeft size={18}/> Disabled</>}
              </button>
            </div>
            <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>
              {u.lastLogin ? new Date(u.lastLogin).toLocaleString([], { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : 'Never'}
            </div>
            <div style={{ display:'flex', gap:'4px', justifyContent:'flex-end' }}>
              <button className="btn btn-xs btn-secondary" title="Change Password" onClick={() => setChangePwFor(u)}><Key size={12}/></button>
              <button className="btn btn-xs btn-secondary" title="Edit" onClick={() => setModal(u)}><Edit2 size={12}/></button>
              {u.id !== currentUser?.id && <button className="btn btn-xs btn-danger" title="Delete" onClick={() => del(u)}><Trash2 size={12}/></button>}
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <UserModal user={modal.id ? modal : null} onClose={() => setModal(null)} onSave={save} currentUserId={currentUser?.id}/>
      )}
      {changePwFor && (
        <ChangePasswordModal userId={changePwFor.id} onClose={() => setChangePwFor(null)}/>
      )}
    </div>
  );
}
