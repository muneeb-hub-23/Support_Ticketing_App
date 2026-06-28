import React, { useEffect, useState } from 'react';
import { BookOpen, Plus, Search, Tag, Edit2, Trash2, Eye, X, Save, Star, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';

const CATEGORIES = ['Hardware','Software','Network','Email','Printer','Account/Access','Performance','General'];

export default function AdminKnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ title:'', category:'General', tags:'', content:'', featured:false });

  useEffect(() => {
    fetch('/api/kb').then(r => r.json()).then(setArticles).catch(() => setArticles([]));
  }, []);

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) { toast.error('Title and content required'); return; }
    const payload = { ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) };
    const url = editing ? `/api/kb/${editing.id}` : '/api/kb';
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const art = await res.json();
    if (editing) setArticles(prev => prev.map(a => a.id === art.id ? art : a));
    else setArticles(prev => [art, ...prev]);
    setEditing(null);
    setForm({ title:'', category:'General', tags:'', content:'', featured:false });
    toast.success(editing ? 'Article updated' : 'Article created');
  };

  const del = async (id) => {
    if (!window.confirm('Delete this article?')) return;
    await fetch(`/api/kb/${id}`, { method:'DELETE' });
    setArticles(prev => prev.filter(a => a.id !== id));
    toast.success('Article deleted');
  };

  const startEdit = (a) => {
    setEditing(a);
    setForm({ title: a.title, category: a.category, tags: (a.tags||[]).join(', '), content: a.content, featured: a.featured||false });
    setViewing(null);
  };

  const filtered = articles.filter(a =>
    (catFilter === 'all' || a.category === catFilter) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase()))
  );

  const featured = articles.filter(a => a.featured);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Knowledge Base</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>{articles.length} articles · {featured.length} featured</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title:'', category:'General', tags:'', content:'', featured:false }); setViewing('new'); }}>
          <Plus size={15}/> New Article
        </button>
      </div>

      {featured.length > 0 && !search && catFilter === 'all' && (
        <div className="card" style={{ marginBottom:'20px' }}>
          <div className="card-title"><Star size={14} color="#f59e0b"/> Featured Articles</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'12px' }}>
            {featured.map(a => (
              <div key={a.id} onClick={() => setViewing(a)} style={{ padding:'14px', background:'var(--bg-secondary)', borderRadius:'10px', cursor:'pointer', border:'1px solid var(--border)' }}
                className="hover-card">
                <div style={{ fontSize:'13px', fontWeight:'700', marginBottom:'6px' }}>{a.title}</div>
                <div style={{ fontSize:'11px', color:'var(--text-muted)' }}>{a.category} · {a.views||0} views</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns: viewing ? '1fr 1.4fr' : '1fr', gap:'20px' }}>
        <div>
          <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
            <div className="search-wrap" style={{ flex:1 }}>
              <Search size={14} className="search-icon" />
              <input className="form-input search-input" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select" style={{ width:'160px' }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'48px', color:'var(--text-muted)' }}>
                <BookOpen size={36} style={{ opacity:0.3, marginBottom:'12px', display:'block', margin:'0 auto 12px' }}/>
                No articles found
              </div>
            ) : filtered.map((a, i) => (
              <div key={a.id} style={{ padding:'14px 18px', borderBottom: i < filtered.length-1 ? '1px solid var(--border)' : 'none', cursor:'pointer', background: viewing?.id === a.id ? 'var(--bg-hover)' : 'transparent' }}
                onClick={() => setViewing(a)}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'4px' }}>
                      {a.featured && <Star size={11} color="#f59e0b" fill="#f59e0b"/>}
                      <span style={{ fontWeight:'600', fontSize:'14px' }}>{a.title}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:'var(--text-muted)', display:'flex', gap:'10px', flexWrap:'wrap' }}>
                      <span>{a.category}</span>
                      <span><Eye size={10} style={{ verticalAlign:'middle' }}/> {a.views||0}</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                    </div>
                    {(a.tags||[]).length > 0 && (
                      <div style={{ display:'flex', gap:'4px', marginTop:'6px', flexWrap:'wrap' }}>
                        {a.tags.map(t => <span key={t} className="badge" style={{ fontSize:'10px', padding:'2px 6px', background:'rgba(99,102,241,0.15)', color:'var(--accent)', border:'none' }}>{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:'4px', marginLeft:'8px' }}>
                    <button className="btn btn-xs btn-secondary" onClick={e => { e.stopPropagation(); startEdit(a); }}><Edit2 size={11}/></button>
                    <button className="btn btn-xs btn-danger" onClick={e => { e.stopPropagation(); del(a.id); }}><Trash2 size={11}/></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {viewing && viewing !== 'new' && (
          <div className="card" style={{ position:'sticky', top:'80px', height:'fit-content', maxHeight:'calc(100vh - 120px)', overflowY:'auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
              <div>
                <h2 style={{ fontSize:'18px', fontWeight:'800' }}>{viewing.title}</h2>
                <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'4px' }}>{viewing.category} · {viewing.views||0} views</div>
              </div>
              <div style={{ display:'flex', gap:'6px' }}>
                <button className="btn btn-sm btn-secondary" onClick={() => startEdit(viewing)}><Edit2 size={13}/> Edit</button>
                <button className="modal-close" onClick={() => setViewing(null)}><X size={16}/></button>
              </div>
            </div>
            {(viewing.tags||[]).length > 0 && (
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
                {viewing.tags.map(t => <span key={t} className="badge" style={{ background:'rgba(99,102,241,0.15)', color:'var(--accent)', border:'none' }}><Tag size={10}/> {t}</span>)}
              </div>
            )}
            <div style={{ whiteSpace:'pre-wrap', lineHeight:'1.8', fontSize:'14px', color:'var(--text-secondary)' }}>{viewing.content}</div>
          </div>
        )}

        {(viewing === 'new' || editing) && (
          <div className="card" style={{ position:'sticky', top:'80px', height:'fit-content' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <div style={{ fontWeight:'700', fontSize:'16px' }}>{editing ? 'Edit Article' : 'New Article'}</div>
              <button className="modal-close" onClick={() => { setViewing(null); setEditing(null); }}><X size={16}/></button>
            </div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Article title"/>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ display:'flex', alignItems:'flex-end', gap:'8px' }}>
                <label style={{ display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', paddingBottom:'2px', fontSize:'13px', color:'var(--text-secondary)' }}>
                  <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({...f, featured: e.target.checked}))} />
                  Featured
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags <span style={{ color:'var(--text-muted)' }}>(comma separated)</span></label>
              <input className="form-input" value={form.tags} onChange={e => setForm(f => ({...f, tags: e.target.value}))} placeholder="vpn, password, printer"/>
            </div>
            <div className="form-group">
              <label className="form-label">Content *</label>
              <textarea className="form-textarea" style={{ minHeight:'220px', fontFamily:'inherit' }} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Write step-by-step instructions, tips, solutions..."/>
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <button className="btn btn-primary" onClick={save}><Save size={14}/> {editing ? 'Update' : 'Publish'}</button>
              <button className="btn btn-secondary" onClick={() => { setViewing(null); setEditing(null); }}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
