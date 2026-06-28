import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Tag, User, Clock, Monitor } from 'lucide-react';
import socket from '../../socket';
import { toast } from 'react-toastify';

export default function AdminTicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    fetch('/api/tickets').then(r => r.json()).then(tickets => {
      const t = tickets.find(x => x.id === id);
      if (t) setTicket(t);
    });
    const onUpdated = (t) => { if (t.id === id) setTicket(t); };
    socket.on('ticket:updated', onUpdated);
    return () => socket.off('ticket:updated', onUpdated);
  }, [id]);

  const updateStatus = (status) => {
    socket.emit('ticket:update', { id, status });
    toast.success(`Status updated to ${status}`);
  };

  const addComment = () => {
    if (!comment.trim()) return;
    socket.emit('ticket:addComment', { ticketId: id, text: comment, author: 'Admin' });
    setComment('');
  };

  if (!ticket) return <div style={{padding:'40px', textAlign:'center', color:'var(--text-muted)'}}>Loading...</div>;

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px'}}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/tickets')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <h1 style={{fontSize:'20px', fontWeight:'800'}}>{ticket.title}</h1>
          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>#{ticket.id?.slice(0,8)} · Created {new Date(ticket.createdAt).toLocaleString()}</div>
        </div>
        <div style={{marginLeft:'auto', display:'flex', gap:'8px'}}>
          {['open','in-progress','resolved','closed'].map(s => (
            <button key={s} onClick={() => updateStatus(s)} className={`btn btn-sm ${ticket.status===s?'btn-primary':'btn-secondary'}`}>
              {s.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 280px', gap:'20px'}}>
        <div>
          <div className="card" style={{marginBottom:'16px'}}>
            <div className="card-title">Description</div>
            <p style={{color:'var(--text-secondary)', lineHeight:'1.7', whiteSpace:'pre-wrap'}}>{ticket.description}</p>
          </div>

          <div className="card">
            <div className="card-title"><Send size={15} /> Comments ({ticket.comments?.length || 0})</div>
            <div style={{marginBottom:'16px'}}>
              {(ticket.comments || []).map(c => (
                <div key={c.id} style={{background:'var(--bg-secondary)', borderRadius:'8px', padding:'12px', marginBottom:'10px'}}>
                  <div style={{display:'flex', justifyContent:'space-between', marginBottom:'6px'}}>
                    <span style={{fontWeight:'700', fontSize:'13px'}}>{c.author}</span>
                    <span style={{fontSize:'11px', color:'var(--text-muted)'}}>{new Date(c.createdAt).toLocaleString()}</span>
                  </div>
                  <div style={{fontSize:'14px', color:'var(--text-secondary)'}}>{c.text}</div>
                </div>
              ))}
              {(ticket.comments?.length === 0 || !ticket.comments) && <div className="text-muted">No comments yet</div>}
            </div>
            <div className="input-row">
              <input className="form-input" placeholder="Add a comment..." value={comment} onChange={e => setComment(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addComment()} />
              <button className="btn btn-primary" onClick={addComment}><Send size={14} /></button>
            </div>
          </div>
        </div>

        <div>
          <div className="card" style={{marginBottom:'12px'}}>
            <div className="card-title">Details</div>
            <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
              {[
                { icon: <Tag size={14} />, label: 'Status', value: <span className={`badge badge-${ticket.status.replace(' ','-')}`}>{ticket.status}</span> },
                { icon: <Tag size={14} />, label: 'Priority', value: <span className={`badge badge-${ticket.priority}`}>{ticket.priority}</span> },
                { icon: <Tag size={14} />, label: 'Category', value: ticket.category },
                { icon: <User size={14} />, label: 'Created By', value: ticket.createdBy },
                { icon: <User size={14} />, label: 'Email', value: ticket.email || '—' },
                { icon: <Clock size={14} />, label: 'Created', value: new Date(ticket.createdAt).toLocaleDateString() },
                { icon: <Clock size={14} />, label: 'Updated', value: new Date(ticket.updatedAt).toLocaleDateString() },
              ].map((item, i) => (
                <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'13px', borderBottom:'1px solid var(--border)', paddingBottom:'10px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:'6px', color:'var(--text-muted)'}}>{item.icon}{item.label}</div>
                  <div style={{color:'var(--text-primary)', fontWeight:'500'}}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
          {ticket.agentId && (
            <div className="card">
              <div className="card-title"><Monitor size={14}/> Connected Machine</div>
              <div style={{fontSize:'13px', color:'var(--text-secondary)', marginBottom:'12px'}}>{ticket.hostname}</div>
              <button className="btn btn-primary btn-sm w-full" style={{justifyContent:'center'}} onClick={() => navigate(`/admin/remote/${ticket.agentId}`)}>
                <Monitor size={14} /> Remote Control
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
