import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Tag, Eye, ChevronRight, Star, X } from 'lucide-react';

export default function UserKnowledgeBase() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [catFilter, setCatFilter] = useState('all');

  useEffect(() => {
    fetch('/api/kb').then(r => r.json()).then(setArticles).catch(() => setArticles([]));
  }, []);

  const categories = ['all', ...Array.from(new Set(articles.map(a => a.category)))];
  const featured = articles.filter(a => a.featured);
  const filtered = articles.filter(a =>
    (catFilter === 'all' || a.category === catFilter) &&
    (!search || a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase()) ||
      (a.tags||[]).some(t => t.toLowerCase().includes(search.toLowerCase())))
  );

  const view = (a) => {
    setSelected(a);
    fetch(`/api/kb/${a.id}/view`, { method:'POST' }).catch(() => {});
  };

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Knowledge Base</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Find answers, how-tos and troubleshooting guides</p>
      </div>

      <div style={{ position:'relative', marginBottom:'24px' }}>
        <Search size={18} style={{ position:'absolute', left:'16px', top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
        <input className="form-input" style={{ paddingLeft:'46px', fontSize:'16px', height:'52px', borderRadius:'12px' }}
          placeholder="Search articles, guides, how-tos..." value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {!search && featured.length > 0 && (
        <div style={{ marginBottom:'28px' }}>
          <div style={{ fontSize:'13px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'12px' }}>
            <Star size={12} color="#f59e0b" style={{ verticalAlign:'middle', marginRight:'6px' }}/>Featured
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'14px' }}>
            {featured.map(a => (
              <div key={a.id} onClick={() => view(a)} className="card hover-card" style={{ cursor:'pointer', padding:'18px' }}>
                <div style={{ fontSize:'15px', fontWeight:'700', marginBottom:'8px' }}>{a.title}</div>
                <div style={{ fontSize:'12px', color:'var(--text-muted)', marginBottom:'10px' }}>
                  {a.category} · <Eye size={10} style={{ verticalAlign:'middle' }}/> {a.views||0} views
                </div>
                <div style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.5', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                  {a.content}
                </div>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'flex-end', marginTop:'12px', color:'var(--accent)', fontSize:'12px', fontWeight:'600' }}>
                  Read more <ChevronRight size={13}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap' }}>
        {categories.map(c => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`btn btn-sm ${catFilter===c ? 'btn-primary' : 'btn-secondary'}`}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'16px' }}>
        <div style={{ display: selected ? 'flex' : 'contents', flexDirection: selected ? 'column' : undefined, gap: selected ? '12px' : undefined }}>
          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign:'center', padding:'60px', gridColumn:'1/-1' }}>
              <BookOpen size={40} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
              <div style={{ fontWeight:'600', marginBottom:'6px' }}>No articles found</div>
              <div style={{ color:'var(--text-muted)', fontSize:'13px' }}>Try a different search or category</div>
            </div>
          ) : filtered.map(a => (
            <div key={a.id} onClick={() => view(a)} className="card hover-card" style={{ cursor:'pointer', padding:'18px', border: selected?.id===a.id ? '1px solid var(--accent)' : '1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                    {a.featured && <Star size={11} color="#f59e0b" fill="#f59e0b"/>}
                    <span style={{ fontWeight:'700', fontSize:'14px' }}>{a.title}</span>
                  </div>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'8px' }}>
                    {a.category} · <Eye size={10} style={{ verticalAlign:'middle' }}/> {a.views||0} · {new Date(a.createdAt).toLocaleDateString()}
                  </div>
                  <div style={{ fontSize:'13px', color:'var(--text-secondary)', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', lineHeight:'1.5' }}>
                    {a.content.slice(0, 120)}...
                  </div>
                  {(a.tags||[]).length > 0 && (
                    <div style={{ display:'flex', gap:'4px', marginTop:'8px', flexWrap:'wrap' }}>
                      {a.tags.map(t => <span key={t} style={{ fontSize:'10px', padding:'2px 7px', borderRadius:'99px', background:'rgba(99,102,241,0.12)', color:'var(--accent)' }}>{t}</span>)}
                    </div>
                  )}
                </div>
                <ChevronRight size={16} color="var(--text-muted)"/>
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card" style={{ position:'sticky', top:'80px', maxHeight:'calc(100vh - 120px)', overflowY:'auto', height:'fit-content' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'16px' }}>
              <div>
                <h2 style={{ fontSize:'20px', fontWeight:'800', lineHeight:'1.3' }}>{selected.title}</h2>
                <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>
                  {selected.category} · <Eye size={10} style={{ verticalAlign:'middle' }}/> {selected.views||0} views · {new Date(selected.createdAt).toLocaleDateString()}
                </div>
              </div>
              <button className="modal-close" onClick={() => setSelected(null)}><X size={16}/></button>
            </div>
            {(selected.tags||[]).length > 0 && (
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap', marginBottom:'16px' }}>
                {selected.tags.map(t => <span key={t} style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'99px', background:'rgba(99,102,241,0.12)', color:'var(--accent)' }}>
                  <Tag size={10} style={{ verticalAlign:'middle', marginRight:'3px' }}/>{t}
                </span>)}
              </div>
            )}
            <div style={{ whiteSpace:'pre-wrap', lineHeight:'1.9', fontSize:'14px', color:'var(--text-secondary)' }}>
              {selected.content}
            </div>
            <div style={{ marginTop:'20px', paddingTop:'16px', borderTop:'1px solid var(--border)', display:'flex', gap:'8px' }}>
              <span style={{ fontSize:'13px', color:'var(--text-muted)' }}>Was this helpful?</span>
              <button className="btn btn-sm btn-secondary">👍 Yes</button>
              <button className="btn btn-sm btn-secondary">👎 No</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
