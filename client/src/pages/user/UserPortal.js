import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Download, Clock, AlertTriangle, Send, X } from 'lucide-react';
import socket from '../../socket';
import { toast } from 'react-toastify';

const CATEGORIES = ['Hardware', 'Software', 'Network', 'Email', 'Printer', 'Account/Access', 'Performance', 'Other'];

export default function UserPortal() {
  const navigate = useNavigate();
  const serverUrl = window.location.protocol + '//' + window.location.hostname + ':5000';
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium', category: 'Software', createdBy: '', email: '' });

  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.createdBy.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    socket.emit('ticket:create', form);
    socket.once('ticket:created', (t) => {
      setSubmitting(false);
      setShowForm(false);
      setForm({ title: '', description: '', priority: 'medium', category: 'Software', createdBy: '', email: '' });
      toast.success(`Ticket #${t.id.slice(0,8)} created successfully!`);
      navigate('/user/tickets');
    });
    setTimeout(() => setSubmitting(false), 5000);
  };

  return (
    <div>
      <div className="hero">
        <h1>IT Support Portal</h1>
        <p>Get help fast — submit a ticket, download the remote agent, or check your request status</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Ticket size={16} /> Create Support Ticket
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/user/download')}>
            <Download size={16} /> Download Remote Agent
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/user/tickets')}>
            <Clock size={16} /> View My Tickets
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        {[
          { icon: '🚀', title: 'Fast Response', desc: 'Average response time under 2 hours', color: '#6366f1' },
          { icon: '🖥️', title: 'Remote Support', desc: 'Technicians can access your PC securely', color: '#10b981' },
          { icon: '🔒', title: 'Secure', desc: 'All remote sessions are fully encrypted', color: '#3b82f6' },
          { icon: '📊', title: 'Track Status', desc: 'Follow your ticket from open to resolved', color: '#f59e0b' },
        ].map((item, i) => (
          <div key={i} className="card" style={{ textAlign: 'center', padding: '24px' }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
            <div style={{ fontWeight: '700', marginBottom: '6px' }}>{item.title}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div className="card">
          <div className="card-title"><AlertTriangle size={15} /> Common Issues</div>
          {[
            'Cannot connect to VPN', 'Email not sending/receiving', 'Printer not working',
            'Slow computer performance', 'Password reset needed', 'Software installation request',
            'Hardware malfunction', 'Network/Internet issues'
          ].map((issue, i) => (
            <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px', cursor: 'pointer', color: 'var(--text-secondary)' }}
              onClick={() => { setForm(f => ({ ...f, title: issue })); setShowForm(true); }}>
              → {issue}
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title"><Download size={15} /> Remote Agent Quick Start</div>
          <div className="alert alert-info" style={{ marginBottom: '16px' }}>
            <AlertTriangle size={14} />
            Allow IT to securely view & control your PC to resolve issues faster
          </div>
          <ol style={{ paddingLeft: '20px', color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '2' }}>
            <li>Download the PowerShell agent below</li>
            <li>Run as Administrator</li>
            <li>Agent connects automatically</li>
            <li>IT support can now see your screen</li>
          </ol>
          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <a href={`${serverUrl}/api/download/agent-ps1`} className="btn btn-primary btn-sm">
              <Download size={13} /> Download .PS1
            </a>
            <a href={`${serverUrl}/api/download/agent-vbs`} className="btn btn-secondary btn-sm">
              <Download size={13} /> Download .VBS
            </a>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title">Create Support Ticket</div>
              <button className="modal-close" onClick={() => setShowForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={submit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Name *</label>
                  <input className="form-input" placeholder="Full name" value={form.createdBy}
                    onChange={e => setForm(f => ({ ...f, createdBy: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" placeholder="your@email.com" value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" placeholder="Brief description of the issue" value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea className="form-textarea" placeholder="Describe the issue in detail — what happened, when, any error messages..."
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select className="form-select" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <><div className="spinner" style={{ width: '13px', height: '13px' }} /> Submitting...</> : <><Send size={14} /> Submit Ticket</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
