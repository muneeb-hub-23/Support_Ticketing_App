import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Monitor, Cpu, RefreshCw, Power, Lock, HardDrive,
  Download, Calendar, MousePointer, Keyboard, Camera, Play, Square,
  AlertTriangle, CheckCircle, ChevronRight, Activity
} from 'lucide-react';
import socket from '../../socket';
import { toast } from 'react-toastify';

const TABS = ['Screen', 'Terminal', 'System Info', 'Updates', 'Processes', 'Control'];

export default function AdminRemoteControl() {
  const { agentId } = useParams();
  const navigate = useNavigate();
  const [agent, setAgent] = useState(null);
  const [tab, setTab] = useState(0);
  const [screenshot, setScreenshot] = useState(null);
  const [liveView, setLiveView] = useState(false);
  const [controlEnabled, setControlEnabled] = useState(false);
  const [systemInfo, setSystemInfo] = useState(null);
  const [updates, setUpdates] = useState(null);
  const [loadingUpdates, setLoadingUpdates] = useState(false);
  const [processes, setProcesses] = useState([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [termOutput, setTermOutput] = useState([{ type: 'info', text: '# Remote PowerShell Terminal — Connected to ' + agentId }]);
  const [termInput, setTermInput] = useState('');
  // eslint-disable-next-line no-unused-vars
  const [commandResults, setCommandResults] = useState({});
  const [logs, setLogs] = useState([]);
  const [dateTime, setDateTime] = useState('');
  const [customApp, setCustomApp] = useState('');
  const imgRef = useRef(null);
  const wrapRef = useRef(null);
  const termOutputRef = useRef(null);
  const cmdCounter = useRef(0);
  const liveViewRef = useRef(false);

  useEffect(() => {
    fetch('/api/agents').then(r => r.json()).then(list => {
      const a = list.find(x => x.id === agentId);
      if (a) { setAgent(a); setSystemInfo(a.systemInfo); }
    });
    socket.emit('admin:getSystemInfo', { agentId });

    const onAgentsList = (list) => {
      const a = list.find(x => x.id === agentId);
      if (a) { setAgent(a); setSystemInfo(a.systemInfo); }
    };
    const onScreenshot = (d) => { if (d.agentId === agentId) setScreenshot(d.image); };
    const onSysInfo = (d) => { if (d.agentId === agentId) setSystemInfo(d.info); };
    const onCmdResult = (d) => {
      if (d.agentId === agentId) {
        setCommandResults(prev => ({ ...prev, [d.cmdId]: d }));
        setTermOutput(prev => [...prev, { type: d.error ? 'error' : 'output', text: d.output || '' }]);
        if (termOutputRef.current) termOutputRef.current.scrollTop = termOutputRef.current.scrollHeight;
      }
    };
    const onUpdatesList = (d) => { if (d.agentId === agentId) { setUpdates(d.updates); setLoadingUpdates(false); } };
    const onProcesses = (d) => { if (d.agentId === agentId) { setProcesses(d.processes); setLoadingProcesses(false); } };
    const onLog = (d) => { if (d.agentId === agentId) setLogs(prev => [{...d, time: new Date().toLocaleTimeString()}, ...prev].slice(0,50)); };
    const onDisconnected = (d) => { if (d.agentId === agentId) { setAgent(a => a ? {...a, status:'offline'} : null); toast.error('Agent disconnected'); } };
    const onConnected = (a) => { if (a.id === agentId) { setAgent(a); toast.success('Agent reconnected'); } };

    socket.on('agents:list', onAgentsList);
    socket.on('agent:screenshot', onScreenshot);
    socket.on('agent:systemInfo', onSysInfo);
    socket.on('agent:commandResult', onCmdResult);
    socket.on('agent:updatesList', onUpdatesList);
    socket.on('agent:processes', onProcesses);
    socket.on('agent:log', onLog);
    socket.on('agent:disconnected', onDisconnected);
    socket.on('agent:connected', onConnected);

    return () => {
      socket.off('agents:list', onAgentsList);
      socket.off('agent:screenshot', onScreenshot);
      socket.off('agent:systemInfo', onSysInfo);
      socket.off('agent:commandResult', onCmdResult);
      socket.off('agent:updatesList', onUpdatesList);
      socket.off('agent:processes', onProcesses);
      socket.off('agent:log', onLog);
      socket.off('agent:disconnected', onDisconnected);
      socket.off('agent:connected', onConnected);
      if (liveViewRef.current) socket.emit('admin:sendCommand', { agentId, command: 'cmd:stopLiveView', cmdId: 'stopLive' });
    };
  }, [agentId]);

  const toggleLiveView = () => {
    if (!liveView) {
      socket.emit('admin:sendCommand', { agentId, command: 'cmd:startLiveView', cmdId: 'startLive' });
      socket.emit('admin:requestScreenshot', { agentId });
      liveViewRef.current = true;
      setLiveView(true);
      toast.info('Live view started');
    } else {
      socket.emit('admin:sendCommand', { agentId, command: 'cmd:stopLiveView', cmdId: 'stopLive' });
      liveViewRef.current = false;
      setLiveView(false);
    }
  };

  const takeScreenshot = () => {
    socket.emit('admin:requestScreenshot', { agentId });
    toast.info('Screenshot requested...');
  };

  const sendTermCmd = () => {
    if (!termInput.trim()) return;
    const cmdId = `cmd_${++cmdCounter.current}`;
    setTermOutput(prev => [...prev, { type: 'input', text: `PS> ${termInput}` }]);
    socket.emit('admin:sendCommand', { agentId, command: termInput, cmdId });
    setTermInput('');
  };

  const handleScreenMouseMove = useCallback((e) => {
    if (!controlEnabled || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const si = systemInfo?.screenResolution || { width: 1920, height: 1080 };
    const x = Math.round((e.clientX - rect.left) / rect.width * si.width);
    const y = Math.round((e.clientY - rect.top) / rect.height * si.height);
    socket.emit('admin:mouseMove', { agentId, x, y });
  }, [controlEnabled, agentId, systemInfo]);

  const handleScreenClick = useCallback((e) => {
    if (!controlEnabled || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const si = systemInfo?.screenResolution || { width: 1920, height: 1080 };
    const x = Math.round((e.clientX - rect.left) / rect.width * si.width);
    const y = Math.round((e.clientY - rect.top) / rect.height * si.height);
    const button = e.button === 2 ? 'right' : 'left';
    socket.emit('admin:mouseClick', { agentId, x, y, button });
  }, [controlEnabled, agentId, systemInfo]);

  const handleScreenScroll = useCallback((e) => {
    if (!controlEnabled) return;
    const delta = e.deltaY > 0 ? -3 : 3;
    socket.emit('admin:mouseScroll', { agentId, x: 0, y: 0, delta });
  }, [controlEnabled, agentId]);

  const handleKeyDown = useCallback((e) => {
    if (!controlEnabled || tab !== 0) return;
    e.preventDefault();
    const modifiers = [];
    if (e.ctrlKey) modifiers.push('control');
    if (e.altKey) modifiers.push('alt');
    if (e.shiftKey) modifiers.push('shift');
    socket.emit('admin:keyPress', { agentId, key: e.key.toLowerCase(), modifiers });
  }, [controlEnabled, agentId, tab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const checkUpdates = () => {
    setLoadingUpdates(true);
    setUpdates(null);
    socket.emit('admin:checkUpdates', { agentId });
    toast.info('Checking for Windows Updates...');
  };

  const installUpdates = () => {
    socket.emit('admin:installUpdates', { agentId });
    toast.warning('Installing updates — system may restart');
  };

  const getProcesses = () => {
    setLoadingProcesses(true);
    socket.emit('admin:getProcesses', { agentId });
  };

  const killProcess = (pid) => {
    socket.emit('admin:killProcess', { agentId, pid });
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    toast.success(`Process ${pid} terminated`);
  };

  const setSystemDateTime = () => {
    if (!dateTime) return;
    socket.emit('admin:setDateTime', { agentId, datetime: dateTime });
    toast.success('Date/Time command sent');
  };

  const isOffline = agent?.status === 'offline';

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', gap:'12px', marginBottom:'20px', flexWrap:'wrap'}}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/admin/agents')}>
          <ArrowLeft size={14} /> Back
        </button>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
            <h1 style={{fontSize:'20px', fontWeight:'800'}}>{agent?.hostname || 'Unknown Host'}</h1>
            <span className={`badge badge-${isOffline?'offline':'online'}`}>
              <span className={`dot ${isOffline?'dot-gray':'dot-green'}`}></span>
              {isOffline ? 'Offline' : 'Online'}
            </span>
          </div>
          <div style={{fontSize:'12px', color:'var(--text-muted)'}}>{agent?.ip} · {agent?.username} · {agent?.os}</div>
        </div>

        {!isOffline && (
          <div style={{marginLeft:'auto', display:'flex', gap:'8px', flexWrap:'wrap'}}>
            <button className="btn btn-secondary btn-sm" onClick={() => { socket.emit('admin:getSystemInfo', {agentId}); toast.info('Refreshing...'); }}>
              <RefreshCw size={13} /> Refresh
            </button>
            <button className={`btn btn-sm ${liveView?'btn-danger':'btn-success'}`} onClick={toggleLiveView}>
              {liveView ? <><Square size={13}/> Stop Live</> : <><Play size={13}/> Live View</>}
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { socket.emit('admin:lockScreen', {agentId}); toast.info('Locking screen...'); }}>
              <Lock size={13} /> Lock
            </button>
            <button className="btn btn-warning btn-sm" onClick={() => { if(window.confirm('Reboot?')) { socket.emit('admin:reboot', {agentId}); toast.warning('Rebooting...'); } }}>
              <RefreshCw size={13} /> Reboot
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => { if(window.confirm('Shutdown?')) { socket.emit('admin:shutdown', {agentId}); toast.error('Shutting down...'); } }}>
              <Power size={13} /> Shutdown
            </button>
          </div>
        )}
      </div>

      {isOffline && <div className="alert alert-danger"><AlertTriangle size={15}/> This agent is offline. Commands will not be executed.</div>}

      <div className="tabs">
        {TABS.map((t, i) => (
          <button key={i} className={`tab ${tab===i?'active':''}`} onClick={() => setTab(i)}>{t}</button>
        ))}
      </div>

      {/* SCREEN TAB */}
      {tab === 0 && (
        <div>
          <div className="remote-toolbar">
            <button className={`tool-btn ${controlEnabled?'active':''}`} onClick={() => setControlEnabled(c => !c)} title="Toggle Mouse/KB Control">
              <MousePointer size={16} />
            </button>
            <span className="separator"/>
            <button className="tool-btn" onClick={takeScreenshot} title="Take Screenshot">
              <Camera size={16} />
            </button>
            <button className={`tool-btn ${liveView?'active':''}`} onClick={toggleLiveView} title="Live View">
              {liveView ? <Square size={16}/> : <Play size={16}/>}
            </button>
            <span className="separator"/>
            <span style={{fontSize:'12px', color:'var(--text-secondary)'}}>
              {controlEnabled ? '🎮 Control Mode — keyboard & mouse active' : '👁️ View Only — click to enable control'}
            </span>
            {liveView && <span style={{fontSize:'12px', color:'var(--accent-green)', marginLeft:'auto'}}>
              <span className="dot dot-yellow" style={{marginRight:'4px'}}></span>Live streaming
            </span>}
          </div>
          <div className="remote-screen-wrap" ref={wrapRef}
            onMouseMove={handleScreenMouseMove}
            onMouseDown={handleScreenClick}
            onWheel={handleScreenScroll}
            onContextMenu={e => { e.preventDefault(); handleScreenClick(e); }}
            tabIndex={0}
          >
            {screenshot
              ? <img ref={imgRef} src={screenshot} alt="Remote Screen" draggable={false} />
              : <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'}}>
                  <Monitor size={48} style={{opacity:0.3, marginBottom:'12px'}} />
                  <div style={{fontSize:'15px', fontWeight:'600'}}>No screenshot yet</div>
                  <div style={{fontSize:'13px', marginBottom:'20px'}}>Click below to capture the screen</div>
                  <button className="btn btn-primary" onClick={takeScreenshot}><Camera size={14}/> Take Screenshot</button>
                </div>
            }
          </div>
          {screenshot && (
            <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
              <a href={screenshot} download={`screenshot_${agent?.hostname}_${Date.now()}.png`} className="btn btn-secondary btn-sm">
                <Download size={13}/> Save Screenshot
              </a>
              <span style={{fontSize:'11px', color:'var(--text-muted)', alignSelf:'center'}}>
                Last updated: {new Date().toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      )}

      {/* TERMINAL TAB */}
      {tab === 1 && (
        <div className="terminal">
          <div className="terminal-output" ref={termOutputRef}>
            {termOutput.map((line, i) => (
              <div key={i} className={`${line.type === 'error' ? 'line-error' : line.type === 'info' ? 'line-info' : line.type === 'input' ? '' : ''}`}>
                {line.text}
              </div>
            ))}
          </div>
          <div className="terminal-input-wrap">
            <span className="terminal-prompt">PS&gt;</span>
            <input className="terminal-input" value={termInput} onChange={e => setTermInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendTermCmd()}
              placeholder="Enter PowerShell command..." autoFocus={tab===1}
              disabled={isOffline}
            />
            <button className="btn btn-primary btn-sm" onClick={sendTermCmd} disabled={isOffline}>Run</button>
          </div>
          <div style={{padding:'8px 16px', background:'rgba(0,0,0,0.3)', borderTop:'1px solid var(--border)'}}>
            <div style={{display:'flex', gap:'8px', flexWrap:'wrap'}}>
              {['Get-Process', 'Get-Service', 'ipconfig /all', 'systeminfo', 'Get-EventLog -LogName System -Newest 10', 'Get-Disk'].map(cmd => (
                <button key={cmd} className="btn btn-xs btn-secondary" onClick={() => { setTermInput(cmd); }}>{cmd}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM INFO TAB */}
      {tab === 2 && (
        <div>
          <div style={{display:'flex', justifyContent:'flex-end', marginBottom:'12px'}}>
            <button className="btn btn-primary btn-sm" onClick={() => { socket.emit('admin:getSystemInfo', {agentId}); toast.info('Refreshing...'); }}>
              <RefreshCw size={13}/> Refresh
            </button>
          </div>
          {systemInfo ? (
            <>
              <div className="card" style={{marginBottom:'16px'}}>
                <div className="card-title"><Cpu size={15}/> Hardware</div>
                <div className="sysinfo-grid">
                  {[
                    { label: 'Hostname', value: systemInfo.hostname },
                    { label: 'CPU', value: systemInfo.cpu },
                    { label: 'Total RAM', value: systemInfo.totalRam ? `${systemInfo.totalRam} GB` : '—' },
                    { label: 'Free RAM', value: systemInfo.freeRam ? `${systemInfo.freeRam} GB` : '—' },
                    { label: 'Platform', value: systemInfo.platform },
                    { label: 'OS Version', value: systemInfo.release },
                    { label: 'Architecture', value: systemInfo.arch },
                    { label: 'Uptime', value: systemInfo.uptime ? `${Math.floor(systemInfo.uptime/3600)}h ${Math.floor((systemInfo.uptime%3600)/60)}m` : '—' },
                    { label: 'Resolution', value: systemInfo.screenResolution ? `${systemInfo.screenResolution.width}×${systemInfo.screenResolution.height}` : '—' },
                  ].map((item, i) => (
                    <div key={i} className="sysinfo-item">
                      <div className="sysinfo-label">{item.label}</div>
                      <div className="sysinfo-value">{item.value || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>

              {systemInfo.totalRam && systemInfo.freeRam && (
                <div className="card" style={{marginBottom:'16px'}}>
                  <div className="card-title">Memory Usage</div>
                  {(() => {
                    const used = systemInfo.totalRam - systemInfo.freeRam;
                    const pct = (used / systemInfo.totalRam * 100).toFixed(0);
                    return (
                      <>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'12px', color:'var(--text-muted)', marginBottom:'8px'}}>
                          <span>Used: {used.toFixed(1)} GB</span>
                          <span>{pct}%</span>
                          <span>Total: {systemInfo.totalRam} GB</span>
                        </div>
                        <div className="progress-bar" style={{height:'12px'}}>
                          <div className="progress-fill" style={{width:`${pct}%`, background: pct > 85 ? 'var(--accent-red)' : pct > 65 ? 'var(--accent-yellow)' : 'var(--accent-green)'}}></div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {Array.isArray(systemInfo.drives) && systemInfo.drives.length > 0 && (
                <div className="card">
                  <div className="card-title"><HardDrive size={15}/> Storage</div>
                  {systemInfo.drives.map((d, i) => {
                    if (!d.Used && !d.Free) return null;
                    const total = (d.Used || 0) + (d.Free || 0);
                    const pct = total > 0 ? ((d.Used || 0) / total * 100).toFixed(0) : 0;
                    return (
                      <div key={i} style={{marginBottom:'16px'}}>
                        <div style={{display:'flex', justifyContent:'space-between', fontSize:'13px', marginBottom:'6px'}}>
                          <span style={{fontWeight:'700'}}>Drive {d.Name}:</span>
                          <span style={{color:'var(--text-muted)'}}>{d.Used} GB used / {total.toFixed(1)} GB total</span>
                        </div>
                        <div className="progress-bar" style={{height:'8px'}}>
                          <div className="progress-fill" style={{width:`${pct}%`, background: pct > 85 ? 'var(--accent-red)' : 'var(--accent-blue)'}}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : <div style={{textAlign:'center', padding:'40px', color:'var(--text-muted)'}}>
            <div className="spinner" style={{margin:'0 auto 12px'}}></div>
            Loading system information...
          </div>}
        </div>
      )}

      {/* UPDATES TAB */}
      {tab === 3 && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <div>
              <h3 style={{fontSize:'16px', fontWeight:'700'}}>Windows Updates</h3>
              <div style={{fontSize:'12px', color:'var(--text-muted)'}}>Check and install available updates</div>
            </div>
            <div style={{display:'flex', gap:'8px'}}>
              <button className="btn btn-primary btn-sm" onClick={checkUpdates} disabled={loadingUpdates || isOffline}>
                {loadingUpdates ? <><div className="spinner" style={{width:'13px',height:'13px'}}/> Checking...</> : <><RefreshCw size={13}/> Check Updates</>}
              </button>
              {updates && updates.length > 0 && (
                <button className="btn btn-warning btn-sm" onClick={installUpdates} disabled={isOffline}>
                  <Download size={13}/> Install All
                </button>
              )}
            </div>
          </div>
          {updates === null && !loadingUpdates && (
            <div className="alert alert-info"><AlertTriangle size={14}/> Click "Check Updates" to scan for available Windows Updates</div>
          )}
          {loadingUpdates && (
            <div style={{textAlign:'center', padding:'40px'}}>
              <div className="spinner" style={{margin:'0 auto 12px'}}></div>
              <div style={{color:'var(--text-muted)'}}>Scanning for updates (may take 30-60 seconds)...</div>
            </div>
          )}
          {updates && !loadingUpdates && (
            <div className="card">
              {updates.length === 0
                ? <div className="alert alert-success"><CheckCircle size={14}/> System is up to date!</div>
                : <>
                  <div style={{marginBottom:'16px', color:'var(--accent-yellow)', fontWeight:'600'}}>{updates.length} update(s) available</div>
                  {updates.map((u, i) => (
                    <div key={i} className="update-item">
                      <div>
                        <div className="update-title">{u.Title || u.title || 'Update ' + (i+1)}</div>
                        {(u.KB || u.kb) && <div className="update-meta">KB{u.KB || u.kb}</div>}
                      </div>
                      {(u.Size || u.size) && <div className="update-meta">{u.Size || u.size}</div>}
                    </div>
                  ))}
                </>
              }
            </div>
          )}
        </div>
      )}

      {/* PROCESSES TAB */}
      {tab === 4 && (
        <div>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px'}}>
            <h3 style={{fontSize:'16px', fontWeight:'700'}}>Running Processes ({processes.length})</h3>
            <button className="btn btn-primary btn-sm" onClick={getProcesses} disabled={loadingProcesses || isOffline}>
              {loadingProcesses ? <><div className="spinner" style={{width:'13px',height:'13px'}}/> Loading...</> : <><RefreshCw size={13}/> Refresh</>}
            </button>
          </div>
          {processes.length === 0
            ? <div className="alert alert-info">Click Refresh to load running processes</div>
            : <div className="card">
              <div className="process-row process-header">
                <span>Process Name</span><span>PID</span><span>Session</span><span>Memory</span><span>Action</span>
              </div>
              <div style={{maxHeight:'500px', overflowY:'auto'}}>
                {processes.slice(0,150).map((p, i) => (
                  <div key={i} className="process-row">
                    <span style={{color:'var(--text-primary)', fontWeight:'500'}}>{p.name}</span>
                    <span style={{color:'var(--text-muted)'}}>{p.pid}</span>
                    <span style={{color:'var(--text-muted)'}}>{p.session}</span>
                    <span style={{color:'var(--accent-blue)'}}>{p.mem}</span>
                    <button className="btn btn-xs btn-danger" onClick={() => killProcess(p.pid)}>Kill</button>
                  </div>
                ))}
              </div>
            </div>
          }
        </div>
      )}

      {/* CONTROL TAB */}
      {tab === 5 && (
        <div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'16px'}}>
            <div className="card">
              <div className="card-title"><Power size={15}/> Power Options</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                <button className="btn btn-warning w-full" style={{justifyContent:'center'}} disabled={isOffline}
                  onClick={() => { if(window.confirm('Reboot this computer?')) { socket.emit('admin:reboot',{agentId}); toast.warning('Reboot command sent — rebooting in 10 seconds'); } }}>
                  <RefreshCw size={15}/> Restart Computer
                </button>
                <button className="btn btn-danger w-full" style={{justifyContent:'center'}} disabled={isOffline}
                  onClick={() => { if(window.confirm('Shutdown this computer?')) { socket.emit('admin:shutdown',{agentId}); toast.error('Shutdown command sent — shutting down in 10 seconds'); } }}>
                  <Power size={15}/> Shutdown Computer
                </button>
                <button className="btn btn-secondary w-full" style={{justifyContent:'center'}} disabled={isOffline}
                  onClick={() => { socket.emit('admin:lockScreen',{agentId}); toast.info('Screen locked'); }}>
                  <Lock size={15}/> Lock Screen
                </button>
              </div>
            </div>

            <div className="card">
              <div className="card-title"><Calendar size={15}/> Set Date & Time</div>
              <div className="form-group">
                <label className="form-label">New Date & Time</label>
                <input type="datetime-local" className="form-input" value={dateTime} onChange={e => setDateTime(e.target.value)} />
              </div>
              <button className="btn btn-primary w-full" style={{justifyContent:'center'}} onClick={setSystemDateTime} disabled={!dateTime || isOffline}>
                <Calendar size={14}/> Set Date/Time
              </button>
            </div>

            <div className="card">
              <div className="card-title"><Monitor size={15}/> Launch Application</div>
              <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                {['notepad','calc','mspaint','taskmgr','cmd','explorer','control','msconfig'].map(app => (
                  <button key={app} className="btn btn-secondary btn-sm" disabled={isOffline}
                    onClick={() => { socket.emit('admin:openApp',{agentId,app}); toast.info(`Opening ${app}...`); }}>
                    <ChevronRight size={13}/> {app}
                  </button>
                ))}
              </div>
              <div style={{marginTop:'12px'}}>
                <label className="form-label">Custom Application</label>
                <div className="input-row">
                  <input className="form-input" placeholder="e.g. chrome.exe" value={customApp} onChange={e => setCustomApp(e.target.value)} />
                  <button className="btn btn-primary" disabled={!customApp || isOffline} onClick={() => { socket.emit('admin:openApp',{agentId,app:customApp}); toast.info(`Opening ${customApp}...`); setCustomApp(''); }}>
                    Open
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title"><Keyboard size={15}/> Send Text to Remote</div>
              <div className="form-group">
                <label className="form-label">Type text on remote machine</label>
                <textarea className="form-textarea" placeholder="Text to type..." id="typeText" style={{minHeight:'80px'}} />
              </div>
              <button className="btn btn-primary w-full" style={{justifyContent:'center'}} disabled={isOffline}
                onClick={() => {
                  const txt = document.getElementById('typeText').value;
                  if (!txt) return;
                  socket.emit('admin:keyType', {agentId, text: txt});
                  toast.info('Text sent to remote');
                }}>
                <Keyboard size={14}/> Send Keystrokes
              </button>
              <div style={{marginTop:'12px'}}>
                <label className="form-label">Quick Keys</label>
                <div style={{display:'flex', gap:'6px', flexWrap:'wrap', marginTop:'6px'}}>
                  {[
                    {label:'Win', key:'meta'}, {label:'Ctrl+C', key:'c', mod:['control']}, {label:'Ctrl+V', key:'v', mod:['control']},
                    {label:'Ctrl+Z', key:'z', mod:['control']}, {label:'Alt+F4', key:'f4', mod:['alt']},
                    {label:'Enter', key:'enter'}, {label:'Esc', key:'escape'}, {label:'Del', key:'delete'}
                  ].map(k => (
                    <button key={k.label} className="btn btn-secondary btn-xs" disabled={isOffline}
                      onClick={() => socket.emit('admin:keyPress', {agentId, key:k.key, modifiers:k.mod||[]})}>
                      {k.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title"><Activity size={15}/> Agent Logs</div>
              <div style={{maxHeight:'200px', overflowY:'auto'}}>
                {logs.length === 0 && <div className="text-muted">No logs yet</div>}
                {logs.map((l, i) => (
                  <div key={i} style={{fontSize:'12px', padding:'4px 0', borderBottom:'1px solid var(--border)', color: l.level==='error'?'var(--accent-red)':l.level==='warn'?'var(--accent-yellow)':'var(--text-secondary)'}}>
                    <span style={{color:'var(--text-muted)'}}>{l.time}</span> {l.msg}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
