import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Shield, Wifi, Lock, User, AlertCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function ParticleCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.5 + 0.1,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99,102,241,${p.alpha})`;
        ctx.fill();
      });
      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x, dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(99,102,241,${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }} />;
}

function GridLines() {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)', backgroundSize:'60px 60px' }}/>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)' }}/>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState('');
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/admin';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? from : '/user', { replace: true });
    } catch (err) {
      setError(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 600);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#0a0c14', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Inter', sans-serif", position:'relative', overflow:'hidden' }}>
      <GridLines />
      <ParticleCanvas />

      {/* Glow orbs */}
      <div style={{ position:'fixed', top:'-200px', left:'-200px', width:'600px', height:'600px', borderRadius:'50%', background:'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents:'none', zIndex:0, animation:'orbFloat 8s ease-in-out infinite' }}/>
      <div style={{ position:'fixed', bottom:'-200px', right:'-200px', width:'500px', height:'500px', borderRadius:'50%', background:'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents:'none', zIndex:0, animation:'orbFloat 10s ease-in-out infinite reverse' }}/>

      <div style={{ position:'relative', zIndex:10, width:'100%', maxWidth:'440px', padding:'24px' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:'40px', animation:'fadeSlideDown 0.6s ease both' }}>
          <div style={{ width:'64px', height:'64px', borderRadius:'18px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', boxShadow:'0 0 40px rgba(99,102,241,0.4)', fontSize:'28px' }}>
            🛡️
          </div>
          <h1 style={{ fontSize:'28px', fontWeight:'800', color:'#e2e8f0', letterSpacing:'-0.5px', margin:0 }}>SupportDesk</h1>
          <p style={{ color:'#64748b', fontSize:'14px', marginTop:'6px' }}>Admin Control Center</p>
        </div>

        {/* Card */}
        <div className={`login-card${shake ? ' login-shake' : ''}`}
          style={{ background:'rgba(26,29,46,0.85)', backdropFilter:'blur(20px)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'20px', padding:'36px', boxShadow:'0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03), inset 0 1px 0 rgba(255,255,255,0.05)', animation:'fadeSlideUp 0.6s ease 0.1s both' }}>

          <div style={{ marginBottom:'28px' }}>
            <h2 style={{ fontSize:'20px', fontWeight:'700', color:'#e2e8f0', margin:0 }}>Welcome back</h2>
            <p style={{ color:'#64748b', fontSize:'13px', marginTop:'4px', margin:0 }}>Sign in to your account to continue</p>
          </div>

          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 14px', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'10px', marginBottom:'20px', animation:'fadeSlideDown 0.3s ease' }}>
              <AlertCircle size={15} color="#ef4444" style={{ flexShrink:0 }}/>
              <span style={{ fontSize:'13px', color:'#ef4444' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom:'16px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#94a3b8', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Email Address</label>
              <div style={{ position:'relative' }}>
                <User size={15} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color: focused==='email' ? '#6366f1' : '#475569', transition:'color 0.2s' }}/>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                  placeholder="admin@support.local" required autoComplete="email"
                  style={{ width:'100%', background:'rgba(15,17,23,0.8)', border:`1px solid ${focused==='email' ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, borderRadius:'10px', padding:'12px 14px 12px 40px', color:'#e2e8f0', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxShadow: focused==='email' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none', boxSizing:'border-box' }}/>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:'24px' }}>
              <label style={{ display:'block', fontSize:'12px', fontWeight:'600', color:'#94a3b8', marginBottom:'8px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={15} style={{ position:'absolute', left:'14px', top:'50%', transform:'translateY(-50%)', color: focused==='pw' ? '#6366f1' : '#475569', transition:'color 0.2s' }}/>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('pw')} onBlur={() => setFocused('')}
                  placeholder="••••••••" required autoComplete="current-password"
                  style={{ width:'100%', background:'rgba(15,17,23,0.8)', border:`1px solid ${focused==='pw' ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, borderRadius:'10px', padding:'12px 44px 12px 40px', color:'#e2e8f0', fontSize:'14px', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxShadow: focused==='pw' ? '0 0 0 3px rgba(99,102,241,0.15)' : 'none', boxSizing:'border-box' }}/>
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#64748b', cursor:'pointer', padding:'4px', display:'flex' }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'13px', background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border:'none', borderRadius:'10px', color:'white', fontSize:'14px', fontWeight:'700', cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', transition:'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.4)', letterSpacing:'0.3px' }}>
              {loading ? (
                <>
                  <div style={{ width:'16px', height:'16px', border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'white', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
                  Authenticating...
                </>
              ) : (
                <><Shield size={15}/> Sign In to Admin Panel <ChevronRight size={14}/></>
              )}
            </button>
          </form>

          {/* Hint */}
          <div style={{ marginTop:'24px', padding:'14px', background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.12)', borderRadius:'10px' }}>
            <div style={{ fontSize:'11px', color:'#64748b', marginBottom:'6px', textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:'600' }}>Default Credentials</div>
            <div style={{ fontSize:'12px', color:'#94a3b8' }}>
              <span style={{ color:'#6366f1', fontFamily:'monospace' }}>admin@support.local</span>
              {' / '}
              <span style={{ color:'#6366f1', fontFamily:'monospace' }}>Admin@1234</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:'24px', animation:'fadeSlideUp 0.6s ease 0.3s both' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'12px', color:'#475569' }}>
            <Wifi size={12}/> Secured with JWT · 12h session
          </div>
        </div>
      </div>
    </div>
  );
}
