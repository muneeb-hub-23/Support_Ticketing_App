import React, { useEffect, useState, useRef } from 'react';
import { Send, MessageCircle, X, Minimize2, Maximize2, Bot } from 'lucide-react';
import socket from '../../socket';

const BOT_RESPONSES = [
  { trigger:/password/i, reply:"To reset your password:\n1. Go to your company's IT portal\n2. Click 'Forgot Password'\n3. Enter your email address\n4. Check your inbox for a reset link\n\nIf you still need help, I'll create a ticket for you!" },
  { trigger:/vpn/i, reply:"For VPN issues, try:\n1. Disconnect and reconnect\n2. Check your internet connection\n3. Make sure VPN client is up to date\n4. Try switching VPN server location\n\nStill not working? Create a ticket and we'll assist you." },
  { trigger:/printer/i, reply:"Common printer fixes:\n1. Restart the printer\n2. Check paper and toner levels\n3. Remove and re-add the printer in Windows Settings\n4. Update printer drivers\n\nNeed more help? Our team can connect remotely to fix it." },
  { trigger:/slow|performance/i, reply:"To improve PC performance:\n1. Restart your computer\n2. Close unused programs\n3. Run Disk Cleanup\n4. Check for Windows Updates\n\nIf still slow, let me create a ticket for a deeper diagnosis." },
  { trigger:/email/i, reply:"Email troubleshooting:\n1. Check spam/junk folder\n2. Verify your email settings\n3. Check storage quota (inbox may be full)\n4. Try webmail to isolate the issue\n\nShall I open a ticket for you?" },
  { trigger:/ticket|help|support|issue|problem/i, reply:"I can create a support ticket for you right now! Just tell me:\n1. What's the issue?\n2. When did it start?\n3. Any error messages?\n\nOr click 'Create Ticket' in the Home menu." },
];

function getBotReply(msg) {
  for (const r of BOT_RESPONSES) { if (r.trigger.test(msg)) return r.reply; }
  return "I'm not sure about that one, but our IT team can definitely help! You can:\n• Create a support ticket from the Home page\n• Download the Remote Agent so we can assist you directly\n• Call IT Support at the number in the sidebar";
}

export default function UserChat() {
  const [messages, setMessages] = useState([
    { id:1, author:'IT Support Bot', text:"Hi there! 👋 I'm the IT Support Assistant.\n\nI can help with common issues like:\n• Password resets\n• VPN problems\n• Printer issues\n• Email problems\n• Slow performance\n\nWhat can I help you with today?", isBot:true, createdAt: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const [name] = useState(() => localStorage.getItem('supportName') || 'User');
  const [isTyping, setIsTyping] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/chat/support').then(r => r.json()).then(msgs => {
      if (msgs.length) setMessages(prev => [...prev, ...msgs.filter(m => m.author !== 'IT Support Bot')]);
    }).catch(() => {});

    const onMsg = (msg) => {
      if (msg.channel === 'support' && msg.author !== name) {
        setMessages(prev => [...prev, { ...msg, isAdmin: true }]);
      }
    };
    socket.on('chat:message', onMsg);
    socket.on('connect', () => setAdminOnline(socket.connected));
    return () => socket.off('chat:message', onMsg);
  }, [name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, isTyping]);

  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), author: name, text: input.trim(), isBot:false, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    const userText = input.trim();
    setInput('');

    socket.emit('chat:send', { channel:'support', text: userText, author: name });

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const botReply = getBotReply(userText);
      setMessages(prev => [...prev, { id: Date.now()+1, author:'IT Support Bot', text: botReply, isBot:true, createdAt: new Date().toISOString() }]);
    }, 900 + Math.random() * 600);
  };

  const QUICK = ['Password reset help', 'VPN not working', 'Printer issues', 'Email problems', 'PC running slow', 'Create a ticket'];

  return (
    <div>
      <div style={{ marginBottom:'24px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ fontSize:'24px', fontWeight:'800' }}>Live Support Chat</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'13px', marginTop:'4px' }}>Chat with IT Support or our AI assistant</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', fontSize:'13px', color:'var(--accent-green)' }}>
          <span className="dot dot-green"></span> AI Assistant Online
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'20px', height:'calc(100vh - 220px)', minHeight:'500px' }}>
        <div style={{ display:'flex', flexDirection:'column', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'var(--radius)', overflow:'hidden' }}>
          <div style={{ padding:'14px 18px', background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'12px' }}>
            <div style={{ width:'36px', height:'36px', borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-purple))', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Bot size={18} color="white"/>
            </div>
            <div>
              <div style={{ fontWeight:'700', fontSize:'14px' }}>IT Support Chat</div>
              <div style={{ fontSize:'11px', color:'var(--accent-green)', display:'flex', alignItems:'center', gap:'4px' }}>
                <span className="dot dot-green" style={{ width:'6px', height:'6px' }}></span> AI assistant active
              </div>
            </div>
          </div>

          <div style={{ flex:1, overflowY:'auto', padding:'20px', display:'flex', flexDirection:'column', gap:'12px' }}>
            {messages.map((m) => (
              <div key={m.id} style={{ display:'flex', gap:'10px', flexDirection: m.isBot || m.isAdmin ? 'row' : 'row-reverse' }}>
                {(m.isBot || m.isAdmin) && (
                  <div style={{ width:'32px', height:'32px', borderRadius:'50%', background: m.isBot ? 'linear-gradient(135deg,var(--accent),var(--accent-purple))' : 'var(--accent-green)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:'4px' }}>
                    {m.isBot ? <Bot size={15} color="white"/> : <span style={{ fontSize:'12px', fontWeight:'700', color:'white' }}>IT</span>}
                  </div>
                )}
                <div style={{ maxWidth:'75%' }}>
                  <div style={{ fontSize:'11px', color:'var(--text-muted)', marginBottom:'4px', textAlign: m.isBot || m.isAdmin ? 'left' : 'right' }}>
                    {m.isBot ? 'IT Support Bot' : m.isAdmin ? m.author : 'You'} · {new Date(m.createdAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}
                  </div>
                  <div style={{ padding:'10px 14px', borderRadius: m.isBot || m.isAdmin ? '4px 14px 14px 14px' : '14px 4px 14px 14px', background: m.isBot || m.isAdmin ? 'var(--bg-secondary)' : 'var(--accent)', color: m.isBot || m.isAdmin ? 'var(--text-secondary)' : 'white', fontSize:'13px', lineHeight:'1.7', whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {isTyping && (
              <div style={{ display:'flex', gap:'10px' }}>
                <div style={{ width:'32px', height:'32px', borderRadius:'50%', background:'linear-gradient(135deg,var(--accent),var(--accent-purple))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Bot size={15} color="white"/>
                </div>
                <div style={{ padding:'12px 16px', background:'var(--bg-secondary)', borderRadius:'4px 14px 14px 14px', display:'flex', gap:'4px', alignItems:'center' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--text-muted)', animation:`bounce 1s ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            )}
            <div ref={bottomRef}/>
          </div>

          <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-secondary)' }}>
            <div style={{ display:'flex', gap:'8px' }}>
              <input className="form-input" style={{ flex:1 }} placeholder="Type your message..."
                value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}/>
              <button className="btn btn-primary" onClick={send} disabled={!input.trim()}><Send size={15}/></button>
            </div>
          </div>
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          <div className="card">
            <div className="card-title" style={{ marginBottom:'12px' }}><MessageCircle size={14}/> Quick Questions</div>
            <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
              {QUICK.map(q => (
                <button key={q} className="btn btn-secondary btn-sm" style={{ textAlign:'left', justifyContent:'flex-start', fontSize:'12px' }}
                  onClick={() => { setInput(q); }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom:'12px' }}>Support Hours</div>
            {[['Monday–Friday','8am – 6pm'],['Saturday','10am – 2pm'],['Sunday','Emergency only'],['Emergency','24/7 Hotline']].map(([day, hrs]) => (
              <div key={day} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:'12px' }}>
                <span style={{ color:'var(--text-muted)' }}>{day}</span>
                <span style={{ fontWeight:'600', color:'var(--accent-green)' }}>{hrs}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
