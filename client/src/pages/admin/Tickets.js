import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, Search } from 'lucide-react';
import socket from '../../socket';
import { toast } from 'react-toastify';

export default function AdminTickets() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const onList = (list) => setTickets(list);
    const onNew = (t) => { setTickets(prev => [t, ...prev]); toast.info(`New ticket: ${t.title}`); };
    const onUpdated = (t) => setTickets(prev => prev.map(x => x.id === t.id ? t : x));
    socket.on('tickets:list', onList);
    socket.on('ticket:new', onNew);
    socket.on('ticket:updated', onUpdated);
    return () => {
      socket.off('tickets:list', onList);
      socket.off('ticket:new', onNew);
      socket.off('ticket:updated', onUpdated);
    };
  }, []);

  const filtered = tickets.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase()) || t.createdBy?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPriority && matchSearch;
  });

  const updateStatus = (id, status, e) => {
    e.stopPropagation();
    socket.emit('ticket:update', { id, status });
    toast.success(`Ticket marked as ${status}`);
  };

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px'}}>
        <div>
          <h1 style={{fontSize:'24px', fontWeight:'800'}}>Support Tickets</h1>
          <p style={{color:'var(--text-muted)', fontSize:'13px', marginTop:'4px'}}>{filtered.length} tickets</p>
        </div>
      </div>

      <div className="card" style={{marginBottom:'20px'}}>
        <div style={{display:'flex', gap:'12px', flexWrap:'wrap', alignItems:'center'}}>
          <div style={{flex:1, minWidth:'200px', position:'relative'}}>
            <Search size={14} style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)'}} />
            <input className="form-input" style={{paddingLeft:'36px'}} placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-select" style={{width:'auto'}} value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select className="form-select" style={{width:'auto'}} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div style={{display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap'}}>
        {['all','open','in-progress','resolved','closed'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`btn btn-sm ${filter===s?'btn-primary':'btn-secondary'}`}>
            {s === 'all' ? 'All' : s.replace('-',' ').replace(/\b\w/g,c=>c.toUpperCase())}
            {s !== 'all' && <span style={{marginLeft:'4px', opacity:0.7}}>({tickets.filter(t=>t.status===s).length})</span>}
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0
          ? <div style={{textAlign:'center', padding:'48px', color:'var(--text-muted)'}}>
              <Ticket size={40} style={{opacity:0.3, margin:'0 auto 12px'}} />
              <div>No tickets found</div>
            </div>
          : <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => navigate(`/admin/tickets/${t.id}`)} style={{cursor:'pointer'}}>
                    <td>
                      <div style={{fontWeight:'600'}}>{t.title}</div>
                      <div style={{fontSize:'11px', color:'var(--text-muted)', marginTop:'2px'}}>{t.description?.slice(0,60)}{t.description?.length > 60 ? '...' : ''}</div>
                    </td>
                    <td><span style={{fontSize:'12px', color:'var(--text-secondary)'}}>{t.category}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td><span className={`badge badge-${t.status.replace(' ','-')}`}>{t.status}</span></td>
                    <td style={{color:'var(--text-secondary)', fontSize:'12px'}}>{t.createdBy}</td>
                    <td style={{color:'var(--text-muted)', fontSize:'12px'}}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{display:'flex', gap:'4px'}} onClick={e => e.stopPropagation()}>
                        {t.status !== 'in-progress' && t.status !== 'resolved' && t.status !== 'closed' &&
                          <button className="btn btn-xs btn-warning" onClick={e => updateStatus(t.id,'in-progress',e)}>In Progress</button>}
                        {t.status !== 'resolved' && t.status !== 'closed' &&
                          <button className="btn btn-xs btn-success" onClick={e => updateStatus(t.id,'resolved',e)}>Resolve</button>}
                        {t.status !== 'closed' &&
                          <button className="btn btn-xs btn-secondary" onClick={e => updateStatus(t.id,'closed',e)}>Close</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>
  );
}
