import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageSquare, Hash, User, AtSign, Smile } from 'lucide-react';
import socket from '../../socket';

const CHANNELS = [
  { id: 'general', label: 'general', icon: '#' },
  { id: 'alerts', label: 'alerts', icon: '#' },
  { id: 'tickets', label: 'ticket-updates', icon: '#' },
  { id: 'agents', label: 'agent-monitor', icon: '#' },
];

const EMOJIS = ['👍','✅','❌','⚠️','🔥','💡','🚀','🛑','⏳','🔄'];

export default function AdminTeamChat() {
  const [channel, setChannel] = useState('general');
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState('');
  const [name] = useState(() => 'Admin-' + Math.random().toString(36).slice(2,5).toUpperCase());
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/chat/general').then(r => r.json()).then(msgs => setMessages(prev => ({...prev, general: msgs}))).catch(() => {});
    const onMsg = (msg) => setMessages(prev => ({ ...prev, [msg.channel]: [...(prev[msg.channel]||[]), msg] }));
    socket.on('chat:message', onMsg);
    return () => socket.off('chat:message', onMsg);
  }, []);

  useEffect(() => {
    fetch(`/api/chat/${channel}`).then(r => r.json()).then(msgs => setMessages(prev => ({...prev, [channel]: msgs}))).catch(() => {});
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, channel]);

  const send = () => {
    if (!input.trim()) return;
    socket.emit('chat:send', { channel, text: input.trim(), author: name });
    setInput('');
  };

  const msgs = messages[channel] || [];

  const groupedMsgs = msgs.reduce((acc, msg, i) => {
    const prev = msgs[i - 1];
    const sameAuthor = prev && prev.author === msg.author &&
      new Date(msg.createdAt) - new Date(prev.createdAt) < 60000;
    if (sameAuthor) { acc[acc.length - 1].msgs.push(msg); }
    else acc.push({ author: msg.author, msgs: [msg] });
    return acc;
  }, []);

  const avatarColor = (name) => {
    const colors = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];
    let h = 0; for (let c of name) h = c.charCodeAt(0) + ((h<<5)-h);
    return colors[Math.abs(h) % colors.length];
  };

  return (
    <div>
      <div style={{ marginBottom:'24px' }}>
        <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Team Chat</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Real-time internal messaging for the support team</p>
      </div>

      <div style={{ display:'flex', height:'calc(100vh - 200px)', minHeight:'500px', background:'var(--bg-card)', borderRadius:'var(--radius)', border:'1px solid var(--border)', overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{ width:'200px', background:'var(--bg-secondary)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'16px 14px', borderBottom:'1px solid var(--border)', fontSize:'12px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px' }}>
            Channels
          </div>
          {CHANNELS.map(ch => (
            <button key={ch.id} onClick={() => setChannel(ch.id)}
              style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 14px', background: channel===ch.id ? 'rgba(99,102,241,0.15)' : 'transparent', color: channel===ch.id ? 'var(--accent)' : 'var(--text-secondary)', border:'none', cursor:'pointer', textAlign:'left', fontSize:'14px', width:'100%', borderRight: channel===ch.id ? '2px solid var(--accent)' : '2px solid transparent' }}>
              <Hash size={14}/> {ch.label}
            </button>
          ))}
          <div style={{ padding:'16px 14px', borderBottom:'1px solid var(--border)', borderTop:'1px solid var(--border)', marginTop:'8px', fontSize:'12px', fontWeight:'700', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'1px' }}>
            Online
          </div>
          <div style={{ padding:'8px 14px', display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--text-secondary)' }}>
            <span className="dot dot-green"></span> {name} <span style={{ fontSize:'10px', color:'var(--accent)' }}>(you)</span>
          </div>
        </div>

        {/* Main */}
        <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px', background:'var(--bg-secondary)' }}>
            <Hash size={16} color="var(--text-muted)"/>
            <span style={{ fontWeight:'700', fontSize:'15px' }}>{CHANNELS.find(c => c.id===channel)?.label}</span>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'16px 20px', display:'flex', flexDirection:'column', gap:'4px' }}>
            {groupedMsgs.length === 0 && (
              <div style={{ textAlign:'center', color:'var(--text-muted)', marginTop:'60px' }}>
                <MessageSquare size={40} style={{ opacity:0.2, margin:'0 auto 12px', display:'block' }}/>
                <div>No messages yet. Say hello!</div>
              </div>
            )}
            {groupedMsgs.map((group, gi) => (
              <div key={gi} style={{ display:'flex', gap:'12px', marginBottom:'12px' }}>
                <div style={{ width:'36px', height:'36px', borderRadius:'50%', background: avatarColor(group.author), display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'700', fontSize:'13px', flexShrink:0, marginTop:'2px' }}>
                  {group.author.slice(0,2).toUpperCase()}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom:'4px' }}>
                    <span style={{ fontWeight:'700', fontSize:'13px', color: avatarColor(group.author) }}>{group.author}</span>
                    <span style={{ fontSize:'11px', color:'var(--text-muted)' }}>{new Date(group.msgs[0].createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</span>
                  </div>
                  {group.msgs.map((m, mi) => (
                    <div key={mi} style={{ fontSize:'14px', color:'var(--text-secondary)', lineHeight:'1.6', padding:'2px 0' }}>{m.text}</div>
                  ))}
                </div>
              </div>
            ))}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
            <div style={{ display:'flex', gap:'6px', marginBottom:'8px', flexWrap:'wrap' }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setInput(i => i + e)} style={{ background:'none', border:'none', fontSize:'16px', cursor:'pointer', padding:'2px 4px', borderRadius:'4px' }}
                  title={e}>{e}</button>
              ))}
            </div>
            <div style={{ display:'flex', gap:'8px' }}>
              <input className="form-input" style={{ flex:1 }} placeholder={`Message #${CHANNELS.find(c=>c.id===channel)?.label}...`}
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()} />
              <button className="btn btn-primary" onClick={send} disabled={!input.trim()}><Send size={15}/></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
