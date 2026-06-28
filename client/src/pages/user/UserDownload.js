import React, { useState } from 'react';
import { Download, Terminal, Shield, Zap, CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'react-toastify';

export default function UserDownload() {
  const [copied, setCopied] = useState(null);

  const serverUrl = window.location.protocol + '//' + window.location.hostname + ':5000';

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const steps = [
    { icon: '1', title: 'Download the Script', desc: 'Choose PowerShell (.ps1) or silent VBS launcher below' },
    { icon: '2', title: 'Run as Administrator', desc: 'Right-click the file → "Run as Administrator" for full access' },
    { icon: '3', title: 'Agent Connects', desc: 'The script auto-installs dependencies and connects to IT Support' },
    { icon: '4', title: 'IT Can Help You', desc: 'Support team can now see your screen, run diagnostics & fix issues' },
  ];

  const downloads = [
    {
      key: 'ps1',
      icon: '💻',
      title: 'PowerShell Script',
      subtitle: '.PS1 — Recommended',
      desc: 'Full-featured agent with screen capture, remote control, Windows Update management and more. Requires PowerShell 5.0+',
      color: '#6366f1',
      href: `${serverUrl}/api/download/agent-ps1`,
      filename: 'SupportAgent.ps1',
      cmd: `powershell -ExecutionPolicy Bypass -File SupportAgent.ps1`
    },
    {
      key: 'vbs',
      icon: '🤫',
      title: 'Silent Launcher',
      subtitle: '.VBS — Background Mode',
      desc: 'Runs the agent silently in the background with no console window. Perfect for set-and-forget deployment.',
      color: '#10b981',
      href: `${serverUrl}/api/download/agent-vbs`,
      filename: 'SupportAgent.vbs',
      cmd: `wscript.exe SupportAgent.vbs`
    },
    {
      key: 'bat',
      icon: '⚡',
      title: 'Batch Launcher',
      subtitle: '.BAT — Quick Start',
      desc: 'Simple batch file that downloads and runs the agent automatically. Easiest option for non-technical users.',
      color: '#f59e0b',
      href: `${serverUrl}/api/download/agent-bat`,
      filename: 'RunSupportAgent.bat',
      cmd: `RunSupportAgent.bat`
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Remote Support Agent</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '4px' }}>
          Download and run the agent to allow IT Support to remotely assist you
        </p>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
        <AlertTriangle size={16} />
        <div>
          <strong>Security Notice:</strong> Only download and run this agent when requested by your IT Support team.
          The agent gives IT staff temporary access to view and control your computer.
        </div>
      </div>

      {/* How it works */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="card-title"><Zap size={15} /> How It Works</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{s.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Downloads */}
      <div className="download-grid">
        {downloads.map(d => (
          <div key={d.key} className="download-card">
            <div className="download-icon" style={{ background: `${d.color}22` }}>
              <span>{d.icon}</span>
            </div>
            <div style={{ fontWeight: '800', fontSize: '17px', marginBottom: '4px' }}>{d.title}</div>
            <div style={{ fontSize: '12px', color: d.color, fontWeight: '600', marginBottom: '12px' }}>{d.subtitle}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: '1.6' }}>{d.desc}</div>

            <div style={{ background: 'var(--bg-secondary)', borderRadius: '6px', padding: '8px 12px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <code style={{ fontSize: '11px', color: 'var(--accent-green)', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {d.cmd}
              </code>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
                onClick={() => copyToClipboard(d.cmd, d.key)}>
                {copied === d.key ? <CheckCircle size={14} color="var(--accent-green)" /> : <Copy size={14} />}
              </button>
            </div>

            <a href={d.href} download={d.filename} className="btn btn-primary w-full" style={{ justifyContent: 'center' }}>
              <Download size={15} /> Download {d.filename}
            </a>
          </div>
        ))}
      </div>

      {/* Manual connection */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title"><Terminal size={15} /> Manual PowerShell Command</div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Run this command directly in PowerShell (as Administrator) to connect without downloading a file:
        </p>
        <div style={{ background: '#0a0e1a', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <code style={{ fontSize: '12px', color: '#a8ff78', flex: 1, wordBreak: 'break-all' }}>
            {`iex (New-Object Net.WebClient).DownloadString('${serverUrl}/api/download/agent-ps1')`}
          </code>
          <button className="btn btn-secondary btn-sm" onClick={() => copyToClipboard(`iex (New-Object Net.WebClient).DownloadString('${serverUrl}/api/download/agent-ps1')`, 'manual')}>
            {copied === 'manual' ? <CheckCircle size={13} color="var(--accent-green)" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      {/* What the agent can do */}
      <div className="card">
        <div className="card-title"><Shield size={15} /> What The Agent Can Do</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          {[
            { icon: '🖥️', title: 'Screen Viewing', desc: 'IT can see your screen in real-time' },
            { icon: '🖱️', title: 'Mouse Control', desc: 'Remote mouse movement and clicks' },
            { icon: '⌨️', title: 'Keyboard Input', desc: 'Type on your behalf to fix issues' },
            { icon: '⚡', title: 'Run Commands', desc: 'Execute PowerShell diagnostics & fixes' },
            { icon: '🔄', title: 'Windows Updates', desc: 'Check and install system updates' },
            { icon: '📅', title: 'Date & Time', desc: 'Fix incorrect system time settings' },
            { icon: '📋', title: 'Process Manager', desc: 'View and manage running applications' },
            { icon: '📊', title: 'System Info', desc: 'Collect hardware & software details' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '10px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
              <span style={{ fontSize: '20px' }}>{item.icon}</span>
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{item.title}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="alert alert-info" style={{ marginTop: '16px' }}>
          <Shield size={14} />
          The agent connects over an encrypted WebSocket connection. IT support cannot access your computer
          after the agent is stopped. Close the terminal window to disconnect at any time.
        </div>
      </div>
    </div>
  );
}
