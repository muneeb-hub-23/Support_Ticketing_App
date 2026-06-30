const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supportdesk_jwt_secret_change_in_prod_2025';
const JWT_EXPIRES = '12h';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 1e8,
});

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

const ticketsFile = path.join(__dirname, 'data', 'tickets.json');
const agentsFile  = path.join(__dirname, 'data', 'agents.json');
const kbFile      = path.join(__dirname, 'data', 'kb.json');
const chatFile    = path.join(__dirname, 'data', 'chat.json');
const auditFile   = path.join(__dirname, 'data', 'audit.json');
const usersFile   = path.join(__dirname, 'data', 'users.json');

if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}
if (!fs.existsSync(ticketsFile)) fs.writeFileSync(ticketsFile, '[]');
if (!fs.existsSync(agentsFile))  fs.writeFileSync(agentsFile,  '[]');
if (!fs.existsSync(kbFile))      fs.writeFileSync(kbFile,      '[]');
if (!fs.existsSync(chatFile))    fs.writeFileSync(chatFile,    '{}');
if (!fs.existsSync(auditFile))   fs.writeFileSync(auditFile,   '[]');
if (!fs.existsSync(usersFile)) {
  // Seed a default admin on first run
  const salt = bcrypt.genSaltSync(10);
  const defaultAdmin = [{
    id: uuidv4(), name: 'Administrator', email: 'admin@support.local',
    password: bcrypt.hashSync('Admin@1234', salt),
    role: 'admin', active: true,
    createdAt: new Date().toISOString(), lastLogin: null
  }];
  fs.writeFileSync(usersFile, JSON.stringify(defaultAdmin, null, 2));
  console.log('\n🔑 Default admin created: admin@support.local / Admin@1234\n');
}

// ── JWT Auth Middleware ────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.user = decoded;
    next();
  } catch { res.status(401).json({ error: 'Invalid or expired token' }); }
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    next();
  });
}

function addAudit(type, actor, action, detail) {
  const log = readJSON(auditFile);
  log.unshift({ id: uuidv4(), type, actor, action, detail, createdAt: new Date().toISOString() });
  writeJSON(auditFile, log.slice(0, 1000));
  io.to('admins').emit('audit:log', log[0]);
}

function readJSON(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

const connectedAgents = new Map();
const adminSockets = new Set();
const pendingScreenshots = new Map();

io.on('connection', (socket) => {
  console.log('New connection:', socket.id);

  socket.on('admin:join', () => {
    adminSockets.add(socket.id);
    socket.join('admins');
    const agentList = Array.from(connectedAgents.values()).map(a => ({
      id: a.id, hostname: a.hostname, ip: a.ip, os: a.os, username: a.username,
      connectedAt: a.connectedAt, socketId: a.socketId, status: a.status,
      systemInfo: a.systemInfo
    }));
    socket.emit('agents:list', agentList);
    const tickets = readJSON(ticketsFile);
    socket.emit('tickets:list', tickets);
    console.log('Admin joined:', socket.id);
  });

  socket.on('agent:register', (data) => {
    const agentId = data.agentId || uuidv4();
    const agentInfo = {
      id: agentId,
      socketId: socket.id,
      hostname: data.hostname || 'Unknown',
      ip: socket.handshake.address,
      os: data.os || 'Windows',
      username: data.username || 'Unknown',
      connectedAt: new Date().toISOString(),
      status: 'online',
      systemInfo: data.systemInfo || {}
    };
    connectedAgents.set(socket.id, agentInfo);
    socket.agentId = agentId;
    socket.isAgent = true;
    socket.join(`agent:${agentId}`);
    io.to('admins').emit('agent:connected', agentInfo);
    socket.emit('agent:registered', { agentId });
    console.log('Agent registered:', agentInfo.hostname, agentId);
  });

  socket.on('agent:screenshot', (data) => {
    io.to('admins').emit('agent:screenshot', {
      agentId: data.agentId,
      image: data.image,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('agent:systemInfo', (data) => {
    const agent = connectedAgents.get(socket.id);
    if (agent) {
      agent.systemInfo = data.info;
      connectedAgents.set(socket.id, agent);
      io.to('admins').emit('agent:systemInfo', { agentId: agent.id, info: data.info });
    }
  });

  socket.on('agent:commandResult', (data) => {
    io.to('admins').emit('agent:commandResult', data);
  });

  socket.on('agent:updatesList', (data) => {
    io.to('admins').emit('agent:updatesList', data);
  });

  socket.on('agent:log', (data) => {
    io.to('admins').emit('agent:log', data);
  });

  socket.on('admin:requestScreenshot', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:screenshot');
    }
  });

  socket.on('admin:sendCommand', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:execute', { command: data.command, cmdId: data.cmdId });
    }
  });

  socket.on('admin:mouseMove', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:mouseMove', { x: data.x, y: data.y });
    }
  });

  socket.on('admin:mouseClick', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:mouseClick', { x: data.x, y: data.y, button: data.button });
    }
  });

  socket.on('admin:mouseScroll', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:mouseScroll', { x: data.x, y: data.y, delta: data.delta });
    }
  });

  socket.on('admin:keyPress', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:keyPress', { key: data.key, modifiers: data.modifiers });
    }
  });

  socket.on('admin:keyType', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:keyType', { text: data.text });
    }
  });

  socket.on('admin:checkUpdates', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:checkUpdates');
    }
  });

  socket.on('admin:installUpdates', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:installUpdates');
    }
  });

  socket.on('admin:setDateTime', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:setDateTime', { datetime: data.datetime });
    }
  });

  socket.on('admin:getSystemInfo', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:getSystemInfo');
    }
  });

  socket.on('admin:reboot', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:reboot');
    }
  });

  socket.on('admin:shutdown', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:shutdown');
    }
  });

  socket.on('admin:lockScreen', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:lockScreen');
    }
  });

  socket.on('admin:openApp', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:openApp', { app: data.app });
    }
  });

  socket.on('admin:getProcesses', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:getProcesses');
    }
  });

  socket.on('admin:killProcess', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('cmd:killProcess', { pid: data.pid });
    }
  });

  socket.on('agent:processes', (data) => {
    io.to('admins').emit('agent:processes', data);
  });

  socket.on('agent:webrtcOffer', (data) => {
    io.to('admins').emit('agent:webrtcOffer', data);
  });

  socket.on('agent:webrtcAnswer', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('agent:webrtcAnswer', data);
    }
  });

  socket.on('agent:webrtcIce', (data) => {
    io.to('admins').emit('agent:webrtcIce', data);
  });

  socket.on('admin:webrtcOffer', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('admin:webrtcOffer', data);
    }
  });

  socket.on('admin:webrtcAnswer', (data) => {
    io.to('admins').emit('admin:webrtcAnswer', data);
  });

  socket.on('admin:webrtcIce', (data) => {
    const agent = findAgentById(data.agentId);
    if (agent) {
      io.to(agent.socketId).emit('admin:webrtcIce', data);
    }
  });

  socket.on('ticket:create', (data) => {
    const tickets = readJSON(ticketsFile);
    const ticket = {
      id: uuidv4(),
      title: data.title,
      description: data.description,
      priority: data.priority || 'medium',
      category: data.category || 'general',
      status: 'open',
      createdBy: data.createdBy || 'User',
      email: data.email || '',
      agentId: data.agentId || null,
      hostname: data.hostname || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: []
    };
    tickets.unshift(ticket);
    writeJSON(ticketsFile, tickets);
    io.to('admins').emit('ticket:new', ticket);
    socket.emit('ticket:created', ticket);
    addAudit('ticket', ticket.createdBy, 'Ticket Created', ticket.title);
  });

  socket.on('ticket:update', (data) => {
    const tickets = readJSON(ticketsFile);
    const idx = tickets.findIndex(t => t.id === data.id);
    if (idx !== -1) {
      const prev = tickets[idx].status;
      tickets[idx] = { ...tickets[idx], ...data, updatedAt: new Date().toISOString() };
      writeJSON(ticketsFile, tickets);
      io.emit('ticket:updated', tickets[idx]);
      if (data.status && data.status !== prev) addAudit('ticket', 'Admin', 'Status Changed', `${tickets[idx].title}: ${prev} → ${data.status}`);
    }
  });

  socket.on('ticket:addComment', (data) => {
    const tickets = readJSON(ticketsFile);
    const idx = tickets.findIndex(t => t.id === data.ticketId);
    if (idx !== -1) {
      const comment = { id: uuidv4(), text: data.text, author: data.author, createdAt: new Date().toISOString() };
      tickets[idx].comments = tickets[idx].comments || [];
      tickets[idx].comments.push(comment);
      tickets[idx].updatedAt = new Date().toISOString();
      writeJSON(ticketsFile, tickets);
      io.emit('ticket:updated', tickets[idx]);
      addAudit('ticket', data.author, 'Comment Added', tickets[idx].title);
    }
  });

  socket.on('chat:send', (data) => {
    const msg = { id: uuidv4(), channel: data.channel, author: data.author, text: data.text, createdAt: new Date().toISOString() };
    const allChat = readJSON(chatFile) || {};
    if (!allChat[data.channel]) allChat[data.channel] = [];
    allChat[data.channel].push(msg);
    if (allChat[data.channel].length > 200) allChat[data.channel] = allChat[data.channel].slice(-200);
    writeJSON(chatFile, allChat);
    io.emit('chat:message', msg);
  });

  socket.on('disconnect', () => {
    if (socket.isAgent) {
      const agent = connectedAgents.get(socket.id);
      if (agent) {
        agent.status = 'offline';
        io.to('admins').emit('agent:disconnected', { agentId: agent.id });
        connectedAgents.delete(socket.id);
      }
    }
    adminSockets.delete(socket.id);
    console.log('Disconnected:', socket.id);
  });
});

function findAgentById(agentId) {
  for (const [, agent] of connectedAgents) {
    if (agent.id === agentId) return agent;
  }
  return null;
}

app.get('/api/tickets', (req, res) => {
  res.json(readJSON(ticketsFile));
});

app.get('/api/agents', (req, res) => {
  res.json(Array.from(connectedAgents.values()));
});

// ── Auth Routes ────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const users = readJSON(usersFile);
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });
  if (!user.active) return res.status(403).json({ error: 'Account is disabled. Contact your administrator.' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
  // update lastLogin
  const idx = users.findIndex(u => u.id === user.id);
  users[idx].lastLogin = new Date().toISOString();
  writeJSON(usersFile, users);
  addAudit('admin', user.name, 'Login', `${user.role} logged in from ${req.ip}`);
  const token = jwt.sign({ id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const users = readJSON(usersFile);
  const user = users.find(u => u.id === req.user.id);
  if (!user || !user.active) return res.status(401).json({ error: 'Account not found or disabled' });
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, lastLogin: user.lastLogin });
});

app.post('/api/auth/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both fields required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const users = readJSON(usersFile);
  const idx = users.findIndex(u => u.id === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(currentPassword, users[idx].password);
  if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
  users[idx].password = await bcrypt.hash(newPassword, 10);
  writeJSON(usersFile, users);
  addAudit('admin', req.user.name, 'Password Changed', req.user.email);
  res.json({ ok: true });
});

// ── User Management (admin only) ───────────────────────────────────────────
app.get('/api/users', requireAdmin, (req, res) => {
  const users = readJSON(usersFile).map(({ password, ...u }) => u);
  res.json(users);
});

app.post('/api/users', requireAdmin, async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
  if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const users = readJSON(usersFile);
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email already in use' });
  const user = { id: uuidv4(), name, email, password: await bcrypt.hash(password, 10), role: role || 'admin', active: true, createdAt: new Date().toISOString(), lastLogin: null };
  users.push(user);
  writeJSON(usersFile, users);
  addAudit('admin', req.user.name, 'User Created', `${user.name} (${user.role})`);
  const { password: _, ...safe } = user;
  res.json(safe);
});

app.put('/api/users/:id', requireAdmin, async (req, res) => {
  const users = readJSON(usersFile);
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  if (req.params.id === req.user.id && req.body.role && req.body.role !== 'admin') return res.status(400).json({ error: 'Cannot demote yourself' });
  const { password, ...updates } = req.body;
  users[idx] = { ...users[idx], ...updates };
  if (password) { if (password.length < 8) return res.status(400).json({ error: 'Password too short' }); users[idx].password = await bcrypt.hash(password, 10); }
  writeJSON(usersFile, users);
  addAudit('admin', req.user.name, 'User Updated', users[idx].name);
  const { password: _, ...safe } = users[idx];
  res.json(safe);
});

app.delete('/api/users/:id', requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
  let users = readJSON(usersFile);
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  users = users.filter(u => u.id !== req.params.id);
  writeJSON(usersFile, users);
  addAudit('admin', req.user.name, 'User Deleted', user.name);
  res.json({ ok: true });
});

// ── Knowledge Base ─────────────────────────────────────────────────────────
app.get('/api/kb', (req, res) => res.json(readJSON(kbFile)));

app.post('/api/kb', (req, res) => {
  const articles = readJSON(kbFile);
  const art = { id: uuidv4(), ...req.body, views: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  articles.unshift(art);
  writeJSON(kbFile, articles);
  addAudit('admin', 'Admin', 'KB Article Created', art.title);
  res.json(art);
});

app.put('/api/kb/:id', (req, res) => {
  const articles = readJSON(kbFile);
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  articles[idx] = { ...articles[idx], ...req.body, updatedAt: new Date().toISOString() };
  writeJSON(kbFile, articles);
  res.json(articles[idx]);
});

app.delete('/api/kb/:id', (req, res) => {
  let articles = readJSON(kbFile);
  articles = articles.filter(a => a.id !== req.params.id);
  writeJSON(kbFile, articles);
  addAudit('admin', 'Admin', 'KB Article Deleted', req.params.id);
  res.json({ ok: true });
});

app.post('/api/kb/:id/view', (req, res) => {
  const articles = readJSON(kbFile);
  const idx = articles.findIndex(a => a.id === req.params.id);
  if (idx !== -1) { articles[idx].views = (articles[idx].views || 0) + 1; writeJSON(kbFile, articles); }
  res.json({ ok: true });
});

// ── Chat ────────────────────────────────────────────────────────────────────
app.get('/api/chat/:channel', (req, res) => {
  const allChat = readJSON(chatFile) || {};
  res.json((allChat[req.params.channel] || []).slice(-100));
});

// ── Audit Log ───────────────────────────────────────────────────────────────
app.get('/api/audit', (req, res) => res.json(readJSON(auditFile)));

// ── Analytics snapshot ──────────────────────────────────────────────────────
app.get('/api/analytics', (req, res) => {
  const tickets = readJSON(ticketsFile);
  const agents  = Array.from(connectedAgents.values());
  res.json({
    totalTickets: tickets.length,
    open:         tickets.filter(t => t.status === 'open').length,
    inProgress:   tickets.filter(t => t.status === 'in-progress').length,
    resolved:     tickets.filter(t => t.status === 'resolved').length,
    onlineAgents: agents.filter(a => a.status === 'online').length,
    totalAgents:  agents.length,
  });
});

app.get('/api/download/agent-ps1', (req, res) => {
  const serverUrl = `http://${req.hostname}:5000`;
  const script = generatePowerShellScript(serverUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="SupportAgent.ps1"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
});

app.get('/api/download/agent-vbs', (req, res) => {
  const serverUrl = `http://${req.hostname}:5000`;
  const script = generateVBSLauncher(serverUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="SupportAgent.vbs"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
});

app.get('/api/download/agent-bat', (req, res) => {
  const serverUrl = `http://${req.hostname}:5000`;
  const script = generateBatchScript(serverUrl);
  res.setHeader('Content-Disposition', 'attachment; filename="RunSupportAgent.bat"');
  res.setHeader('Content-Type', 'text/plain');
  res.send(script);
});

function generatePowerShellScript(serverUrl) {
  return `# Support Agent Script - Auto-generated
# Run as Administrator for full functionality
# Server: ${serverUrl}

param([string]$ServerUrl = "${serverUrl}")

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  IT Support Remote Agent v1.0   " -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
$nodeAvailable = $null -ne (Get-Command node -ErrorAction SilentlyContinue)

if (-not $nodeAvailable) {
    Write-Host "[INFO] Node.js not found. Installing via winget..." -ForegroundColor Yellow
    winget install OpenJS.NodeJS --silent --accept-source-agreements --accept-package-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# Setup agent directory
$agentDir = "$env:TEMP\\SupportAgent"
if (-not (Test-Path $agentDir)) {
    New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
}

Set-Location $agentDir

# Write package.json explicitly (always, to ensure it is correct)
$pkgJson = '{"name":"support-agent","version":"1.0.0","description":"IT Support Agent","main":"agent.js","dependencies":{"socket.io-client":"4.7.2"}}'
Set-Content -Path "$agentDir\\package.json" -Value $pkgJson -Encoding UTF8

# Install only if socket.io-client is missing
if (-not (Test-Path "$agentDir\\node_modules\\socket.io-client\\package.json")) {
    Write-Host "[INFO] Installing dependencies (socket.io-client)..." -ForegroundColor Yellow
    $npmResult = npm install --prefix "$agentDir" 2>&1
    Write-Host $npmResult
    if (-not (Test-Path "$agentDir\\node_modules\\socket.io-client\\package.json")) {
        Write-Host "[ERROR] npm install failed. Check your internet connection." -ForegroundColor Red
        Write-Host $npmResult -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "[OK] Dependencies installed." -ForegroundColor Green
} else {
    Write-Host "[OK] Dependencies already present." -ForegroundColor Green
}

# Write the agent JS file
$agentScript = @'
const { io } = require('socket.io-client');
const os = require('os');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const SERVER_URL = process.argv[2] || '${serverUrl}';
console.log('[Agent] Connecting to:', SERVER_URL);

let screenshot;
try { screenshot = require('screenshot-desktop'); } catch(e) { console.log('[Agent] screenshot-desktop not available'); }

let robot;
try { robot = require('robotjs'); } catch(e) { console.log('[Agent] robotjs not available'); }

const socket = io(SERVER_URL, { reconnection: true, reconnectionDelay: 3000, transports: ['websocket','polling'] });

const agentId = process.env.AGENT_ID || require('crypto').randomBytes(8).toString('hex');

socket.on('connect', () => {
  console.log('[Agent] Connected! Socket ID:', socket.id);
  const sysInfo = getSystemInfo();
  socket.emit('agent:register', {
    agentId, hostname: os.hostname(), os: os.version(),
    username: os.userInfo().username, systemInfo: sysInfo
  });
});

socket.on('disconnect', () => console.log('[Agent] Disconnected from server'));

socket.on('cmd:screenshot', async () => {
  try {
    if (screenshot) {
      const img = await screenshot({ format: 'png' });
      const b64 = img.toString('base64');
      socket.emit('agent:screenshot', { agentId, image: 'data:image/png;base64,' + b64 });
    } else {
      const result = execSync('powershell -Command "Add-Type -AssemblyName System.Windows.Forms; $bmp = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bitmap = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height); $g = [System.Drawing.Graphics]::FromImage($bitmap); $g.CopyFromScreen([System.Drawing.Point]::Empty, [System.Drawing.Point]::Empty, $bmp.Size); $ms = New-Object System.IO.MemoryStream; $bitmap.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png); [Convert]::ToBase64String($ms.ToArray())"', { maxBuffer: 50*1024*1024 });
      socket.emit('agent:screenshot', { agentId, image: 'data:image/png;base64,' + result.toString().trim() });
    }
  } catch(e) {
    socket.emit('agent:log', { agentId, level: 'error', msg: 'Screenshot failed: ' + e.message });
  }
});

socket.on('cmd:execute', (data) => {
  exec(data.command, { shell: 'powershell.exe', maxBuffer: 5*1024*1024 }, (err, stdout, stderr) => {
    socket.emit('agent:commandResult', { agentId, cmdId: data.cmdId, output: stdout || stderr || (err ? err.message : ''), error: !!err });
  });
});

socket.on('cmd:mouseMove', (data) => {
  if (robot) robot.moveMouse(data.x, data.y);
  else execSync(\`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(\${data.x}, \${data.y})"\`);
});

socket.on('cmd:mouseClick', (data) => {
  if (robot) { robot.moveMouse(data.x, data.y); robot.mouseClick(data.button || 'left'); }
  else execSync(\`powershell -Command "Add-Type -Name Win32 -Namespace API -MemberDefinition '[DllImport(\\"user32.dll\\")]public static extern void mouse_event(int f,int x,int y,int d,int e);'; [API.Win32]::mouse_event(0x8001,\${data.x},\${data.y},0,0); [API.Win32]::mouse_event(0x8002,\${data.x},\${data.y},0,0)"\`);
});

socket.on('cmd:mouseScroll', (data) => {
  if (robot) robot.scrollMouse(data.x || 0, data.delta || 3);
  else execSync(\`powershell -Command "Add-Type -Name Win32 -Namespace API -MemberDefinition '[DllImport(\\"user32.dll\\")]public static extern void mouse_event(int f,int x,int y,int d,int e);'; [API.Win32]::mouse_event(0x0800,0,0,\${(data.delta||1)*120},0)"\`);
});

socket.on('cmd:keyPress', (data) => {
  if (robot) { data.modifiers && data.modifiers.forEach(m => robot.keyToggle(m,'down')); robot.keyTap(data.key); data.modifiers && data.modifiers.forEach(m => robot.keyToggle(m,'up')); }
  else execSync(\`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('\${data.key}')"\`);
});

socket.on('cmd:keyType', (data) => {
  if (robot) robot.typeString(data.text);
  else execSync(\`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('\${data.text.replace(/'/g,"''")}')"\`);
});

socket.on('cmd:checkUpdates', () => {
  const cmd = 'powershell -NonInteractive -Command "$wu=New-Object -ComObject Microsoft.Update.Session; $s=$wu.CreateUpdateSearcher(); try { $r=$s.Search(\"IsInstalled=0 and Type=\\'Software\\'\"); $l=@(); foreach($u in $r.Updates){$kb=if($u.KBArticleIDs.Count-gt 0){\"KB\"+$u.KBArticleIDs[0]}else{\"\"}; $sz=[math]::Round($u.MaxDownloadSize/1MB,1); $l+=[PSCustomObject]@{Title=$u.Title;KB=$kb;Size=\"$sz MB\";Severity=$u.MsrcSeverity}}; $l|ConvertTo-Json -Compress } catch { Write-Output \"[{\\\"Title\\\":\\\"Error: \"+$_.Exception.Message+\"\\\",\\\"KB\\\":\\\"\\\",\\\"Size\\\": \\\"\\\"}]\" }"';
  exec(cmd, { timeout: 90000 }, (err, stdout, stderr) => {
    let updates = [];
    const raw = (stdout || '').trim();
    try {
      if (!raw) throw new Error('empty');
      const parsed = JSON.parse(raw);
      updates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      updates = [{ Title: raw || stderr || (err ? err.message : 'No updates found or search failed'), KB: '', Size: '', Severity: '' }];
    }
    socket.emit('agent:updatesList', { agentId, updates });
  });
});

socket.on('cmd:installUpdates', () => {
  const cmd = 'powershell -NonInteractive -Command "$wu=New-Object -ComObject Microsoft.Update.Session; $s=$wu.CreateUpdateSearcher(); $r=$s.Search(\"IsInstalled=0 and Type=\\'Software\\'\"); if($r.Updates.Count -eq 0){Write-Output \\'No updates available.\\'; exit 0}; Write-Output \"Found $($r.Updates.Count) update(s). Downloading...\"; $d=$wu.CreateUpdateDownloader(); $d.Updates=$r.Updates; $d.Download()|Out-Null; Write-Output \\'Download complete. Installing...\\'; $i=$wu.CreateUpdateInstaller(); $i.Updates=$r.Updates; $ir=$i.Install(); Write-Output \"Done. Result=$($ir.ResultCode) RebootRequired=$($ir.RebootRequired)\""';
  exec(cmd, { timeout: 600000 }, (err, stdout, stderr) => {
    socket.emit('agent:commandResult', { agentId, cmdId: 'installUpdates', output: stdout || stderr || (err ? err.message : 'Update install triggered'), error: !!err });
  });
});

socket.on('cmd:setDateTime', (data) => {
  exec(\`powershell -Command "Set-Date -Date '\${data.datetime}' 2>&1"\`, (err, stdout, stderr) => {
    socket.emit('agent:commandResult', { agentId, cmdId: 'setDateTime', output: stdout || stderr || (err ? err.message : 'Date/time set'), error: !!err });
  });
});

socket.on('cmd:getSystemInfo', () => {
  socket.emit('agent:systemInfo', { agentId, info: getSystemInfo() });
});

socket.on('cmd:reboot', () => {
  exec('shutdown /r /t 10', () => {});
  socket.emit('agent:log', { agentId, level: 'warn', msg: 'System rebooting in 10 seconds...' });
});

socket.on('cmd:shutdown', () => {
  exec('shutdown /s /t 10', () => {});
  socket.emit('agent:log', { agentId, level: 'warn', msg: 'System shutting down in 10 seconds...' });
});

socket.on('cmd:lockScreen', () => {
  exec('rundll32.exe user32.dll,LockWorkStation', () => {});
});

socket.on('cmd:openApp', (data) => {
  exec(\`start \${data.app}\`, { shell: 'cmd.exe' }, () => {});
});

socket.on('cmd:getProcesses', () => {
  exec('tasklist /FO CSV /NH', (err, stdout) => {
    const processes = stdout.split('\\n').filter(Boolean).map(line => {
      const parts = line.replace(/"/g,'').split(',');
      return { name: parts[0], pid: parseInt(parts[1]), session: parts[2], mem: parts[4] };
    }).filter(p => p.name);
    socket.emit('agent:processes', { agentId, processes });
  });
});

socket.on('cmd:killProcess', (data) => {
  exec(\`taskkill /PID \${data.pid} /F\`, (err, stdout, stderr) => {
    socket.emit('agent:commandResult', { agentId, cmdId: 'killProcess', output: stdout || stderr, error: !!err });
  });
});

function getSystemInfo() {
  try {
    const cpuName = execSync('powershell -Command "(Get-CimInstance Win32_Processor).Name"').toString().trim();
    const totalRam = Math.round(os.totalmem() / 1024 / 1024 / 1024 * 10) / 10;
    const freeRam = Math.round(os.freemem() / 1024 / 1024 / 1024 * 10) / 10;
    const drives = execSync('powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name,@{n=\\'Used\\';e={[math]::round($_.Used/1GB,1)}},@{n=\\'Free\\';e={[math]::round($_.Free/1GB,1)}} | ConvertTo-Json"').toString().trim();
    return {
      hostname: os.hostname(), platform: os.platform(), release: os.release(), version: os.version(),
      arch: os.arch(), cpu: cpuName, totalRam, freeRam, uptime: Math.round(os.uptime()),
      drives: JSON.parse(drives), screenResolution: robot ? robot.getScreenSize() : { width: 1920, height: 1080 }
    };
  } catch(e) {
    return { hostname: os.hostname(), platform: os.platform(), release: os.release(), cpu: 'Unknown', totalRam: Math.round(os.totalmem()/1e9*10)/10, freeRam: Math.round(os.freemem()/1e9*10)/10, uptime: os.uptime() };
  }
}

// Auto-screenshot every 2 seconds for live view
let screenshotInterval = null;
socket.on('cmd:startLiveView', () => {
  if (screenshotInterval) clearInterval(screenshotInterval);
  screenshotInterval = setInterval(async () => {
    try {
      if (screenshot) {
        const img = await screenshot({ format: 'jpeg' });
        socket.emit('agent:screenshot', { agentId, image: 'data:image/jpeg;base64,' + img.toString('base64') });
      }
    } catch(e) {}
  }, 500);
});

socket.on('cmd:stopLiveView', () => {
  if (screenshotInterval) { clearInterval(screenshotInterval); screenshotInterval = null; }
});

console.log('[Agent] Waiting for connection...');
'@

Set-Content -Path "$agentDir\\agent.js" -Value $agentScript -Encoding UTF8

Write-Host "[OK] Agent script written to $agentDir" -ForegroundColor Green
Write-Host "[INFO] Starting agent, connecting to $ServerUrl ..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the agent" -ForegroundColor Yellow
Write-Host ""

# Save agent ID between runs
$agentIdFile = "$agentDir\\agent_id.txt"
if (-not (Test-Path $agentIdFile)) {
    [System.Guid]::NewGuid().ToString() | Set-Content $agentIdFile
}
$env:AGENT_ID = Get-Content $agentIdFile

node "$agentDir\\agent.js" $ServerUrl
`;
}

function generateVBSLauncher(serverUrl) {
  return `' Support Agent Silent Launcher
' Runs the PowerShell agent without showing a console window
' Server: ${serverUrl}

Dim objShell, objFSO, strCmd, strPSPath, strScriptPath, tempDir
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

tempDir = objShell.ExpandEnvironmentStrings("%TEMP%") & "\\SupportAgent"
strPSPath = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe"

If Not objFSO.FolderExists(tempDir) Then
    objFSO.CreateFolder(tempDir)
End If

' Download the PS1 script
Dim http
Set http = CreateObject("MSXML2.XMLHTTP")
http.Open "GET", "${serverUrl}/api/download/agent-ps1", False
http.Send

strScriptPath = tempDir & "\\SupportAgent.ps1"
Dim stream
Set stream = CreateObject("ADODB.Stream")
stream.Type = 2
stream.Charset = "UTF-8"
stream.Open
stream.WriteText http.ResponseText
stream.SaveToFile strScriptPath, 2
stream.Close

' Run PowerShell script hidden
strCmd = strPSPath & " -ExecutionPolicy Bypass -WindowStyle Hidden -NonInteractive -File """ & strScriptPath & """ -ServerUrl """ & "${serverUrl}" & """"
objShell.Run strCmd, 0, False

MsgBox "Support Agent started! You are now connected to IT Support." & vbCrLf & vbCrLf & "The agent runs in the background. Close this message to continue.", vbInformation, "IT Support Agent"
`;
}

function generateBatchScript(serverUrl) {
  return `@echo off
title IT Support Agent
echo ==========================================
echo   IT Support Remote Agent Launcher
echo ==========================================
echo.
echo Connecting to: ${serverUrl}
echo.
powershell -ExecutionPolicy Bypass -Command "& {Invoke-WebRequest -Uri '${serverUrl}/api/download/agent-ps1' -OutFile '%TEMP%\\SupportAgent.ps1' -UseBasicParsing; & '%TEMP%\\SupportAgent.ps1' -ServerUrl '${serverUrl}'}"
pause
`;
}

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Support Ticketing Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 Socket.IO ready for agent connections`);
  console.log(`🌐 Admin dashboard: http://localhost:${PORT}`);
});
