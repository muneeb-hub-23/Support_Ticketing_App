import React, { useEffect, useState } from 'react';
import { Ticket, Send, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import socket from '../../socket';
import { toast } from 'react-toastify';

export default function UserTickets() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comment, setComment] = useState('');
  const [name, setName] = useState(localStorage.getItem('supportName') || '');
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(list => {
      if (name) setTickets(list.filter(t => t.createdBy === name));
      else setTickets(list);
    });
    const onUpdated = (t) => {
      setTickets(prev => prev.map(x => x.id === t.id ? t : x));
      if (selected?.id === t.id) setSelected(t);
    };
    socket.on('ticket:updated', onUpdated);
    return () => socket.off('ticket:updated', onUpdated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const saveName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem('supportName', nameInput.trim());
    setName(nameInput.trim());
  };

  const addComment = () => {
    if (!comment.trim() || !selected) return;
    socket.emit('ticket:addComment', { ticketId: selected.id, text: comment, author: name || 'User' });
    setComment('');
    toast.success('Comment added');
  };

  const statusIcon = (s) => {
    if (s === 'open') return <AlertTriangle size={14} color="var(--accent)" />;
    if (s === 'in-progress') return <Clock size={14} color="var(--accent-yellow)" />;
    if (s === 'resolved') return <CheckCircle size={14} color="var(--accent-green)" />;
    return <CheckCircle size={14} color="var(--text-muted)" />;
  };

  if (!name) {
    return (
      <div style={{ maxWidth: '400px', margin: '60px auto' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🎫</div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>View Your Tickets</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>
            Enter your name to see tickets you've created
          </p>
          <div className="input-row">
            <input className="form-input" placeholder="Your name..." value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()} />
            <button className="btn btn-primary" onClick={saveName}>View</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>My Tickets</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '4px' }}>
            Showing tickets for <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>
            <button style={{ marginLeft: '8px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px' }}
              onClick={() => { setName(''); localStorage.removeItem('supportName'); }}>
              (change)
            </button>
          </p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
          <Ticket size={48} style={{ opacity: 0.2, margin: '0 auto 16px', display: 'block' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No tickets found</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Create a support ticket from the home page</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '20px' }}>
          <div className="card">
            {tickets.map(t => (
              <div key={t.id} className="ticket-item" onClick={() => setSelected(t)}
                style={{ borderRadius: '8px', background: selected?.id === t.id ? 'var(--bg-hover)' : '' }}>
                <div>{statusIcon(t.status)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{t.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    #{t.id.slice(0, 8)} · {new Date(t.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span className={`badge badge-${t.status.replace(' ', '-')}`}>{t.status}</span>
                  <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                </div>
              </div>
            ))}
          </div>

          {selected && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '16px' }}>{selected.title}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{selected.id.slice(0, 8)}</div>
                </div>
                <button className="modal-close" onClick={() => setSelected(null)}><X size={16} /></button>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span className={`badge badge-${selected.status.replace(' ', '-')}`}>{selected.status}</span>
                <span className={`badge badge-${selected.priority}`}>{selected.priority}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', alignSelf: 'center' }}>{selected.category}</span>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: '8px', padding: '12px', marginBottom: '16px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {selected.description}
              </div>

              {selected.status === 'resolved' && (
                <div className="alert alert-success"><CheckCircle size={14} /> This ticket has been resolved by IT Support</div>
              )}

              <div style={{ fontWeight: '700', fontSize: '13px', marginBottom: '10px' }}>
                Comments ({selected.comments?.length || 0})
              </div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '12px' }}>
                {(selected.comments || []).map(c => (
                  <div key={c.id} style={{ background: c.author === 'Admin' ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)', border: c.author === 'Admin' ? '1px solid rgba(99,102,241,0.3)' : '1px solid var(--border)', borderRadius: '8px', padding: '10px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '4px' }}>
                      <strong style={{ color: c.author === 'Admin' ? 'var(--accent)' : 'var(--text-primary)' }}>
                        {c.author === 'Admin' ? '🛡️ IT Support' : c.author}
                      </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{c.text}</div>
                  </div>
                ))}
                {!selected.comments?.length && <div className="text-muted">No comments yet</div>}
              </div>
              <div className="input-row">
                <input className="form-input" placeholder="Add a reply..." value={comment}
                  onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} />
                <button className="btn btn-primary" onClick={addComment}><Send size={14} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
