const http = require('http');
const url = require('url');
const { Webhook } = require('svix');

// Configuration
const PORT = process.env.PORT || 3005;

// In-memory event storage
let capturedEvents = [];

/**
 * Helper to parse request body as string
 */
function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

/**
 * Format timestamp ms to ISO UTC and Manila Local string
 */
function formatMs(ms) {
  if (!ms) return null;
  const num = typeof ms === 'string' ? Number(ms) : ms;
  if (isNaN(num)) return null;
  // Handle 10-digit sec vs 13-digit ms
  const normalizedMs = num < 1e11 ? num * 1000 : num;
  const d = new Date(normalizedMs);
  if (isNaN(d.getTime())) return null;
  return {
    raw: num,
    utc: d.toISOString(),
    manila: d.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
  };
}

/**
 * HTTP Server Handler
 */
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, svix-id, svix-timestamp, svix-signature');

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Webhook Capture Endpoint: POST /webhook/:appName or POST /api/webhook/:appName
  if (method === 'POST' && (pathname.startsWith('/webhook/') || pathname.startsWith('/api/webhook/'))) {
    const parts = pathname.split('/').filter(Boolean);
    const appName = parts[parts.length - 1] || 'default';
    
    try {
      const rawBody = await getRawBody(req);
      const headers = req.headers;
      
      const svixId = headers['svix-id'];
      const svixTimestamp = headers['svix-timestamp'];
      const svixSignature = headers['svix-signature'];

      const receivedAtMs = Date.now();
      const serverReceived = formatMs(receivedAtMs);

      let payload = {};
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = { raw: rawBody };
      }

      // Verify signature if secret key is configured
      const secretKey = process.env[`WEBHOOK_SECRET_${appName.toUpperCase()}`] || process.env.WEBHOOK_SECRET;
      let signatureVerified = false;
      if (secretKey && svixId && svixTimestamp && svixSignature) {
        try {
          const wh = new Webhook(secretKey);
          wh.verify(rawBody, {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature,
          });
          signatureVerified = true;
        } catch {
          signatureVerified = false;
        }
      }

      const eventType = payload.type || 'unknown';
      const eventData = payload.data || {};
      const userData = eventData.user || {};

      // Extract User Information
      const userId = eventData.user_id || eventData.id || 'N/A';
      const userName = (userData.first_name || userData.last_name) 
        ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() 
        : 'N/A';
      const userEmail = userData.email_addresses?.[0]?.email_address || 'N/A';

      // Timestamps Extraction
      const clerkTopLevelTimestamp = formatMs(payload.timestamp);
      const clerkDataCreatedAt = formatMs(eventData.created_at);
      const svixHeaderTimestamp = formatMs(svixTimestamp);

      const capturedRecord = {
        id: svixId || `evt_${receivedAtMs}_${Math.random().toString(36).substr(2, 6)}`,
        appName,
        eventType,
        signatureVerified,
        userId,
        userName,
        userEmail,
        clerkTopLevelTimestamp,
        clerkDataCreatedAt,
        svixHeaderTimestamp,
        serverReceived,
        rawPayload: payload,
      };

      capturedEvents.unshift(capturedRecord); // Keep newest first

      console.log(`[Captured Webhook #${capturedEvents.length}] App: ${appName} | Type: ${eventType} | User: ${userName} (${userId}) | Clerk Event Time: ${clerkTopLevelTimestamp?.manila || clerkDataCreatedAt?.manila || 'N/A'}`);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Webhook captured in memory', capturedRecord }));
      return;
    } catch (err) {
      console.error('[Error capturing webhook]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
      return;
    }
  }

  // 2. GET /events - Return raw captured JSON
  if (method === 'GET' && pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalCount: capturedEvents.length,
      events: capturedEvents
    }));
    return;
  }

  // 3. POST /clear - Clear in-memory array
  if (method === 'POST' && pathname === '/clear') {
    const prevCount = capturedEvents.length;
    capturedEvents = [];
    console.log(`[Cleared Memory] Removed ${prevCount} captured events.`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: `Cleared ${prevCount} events from memory` }));
    return;
  }

  // 4. GET / - Live Dashboard HTML UI
  if (method === 'GET' && (pathname === '/' || pathname === '/dashboard')) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Clerk Webhook Memory Listener</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen p-6 font-sans">
  <div class="max-w-7xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-2xl font-bold text-indigo-400">⚡ Clerk Webhook Memory Capture Server</h1>
        <p class="text-sm text-slate-400">Listening live on port ${PORT} | In-Memory Temporary Storage</p>
      </div>
      <div class="flex gap-3">
        <button onclick="fetchEvents()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-semibold transition">🔄 Refresh</button>
        <button onclick="clearMemory()" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 rounded-lg text-sm font-semibold transition">🗑️ Clear Memory</button>
      </div>
    </div>

    <!-- Overview Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase">Total Captured Webhooks</div>
        <div id="statTotal" class="text-3xl font-extrabold text-white mt-1">0</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase">Distinct Event Types</div>
        <div id="statTypes" class="text-3xl font-extrabold text-indigo-400 mt-1">0</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase">Earliest Clerk Timestamp</div>
        <div id="statEarliest" class="text-xs font-mono text-emerald-400 mt-2 truncate">N/A</div>
      </div>
      <div class="bg-slate-800/80 border border-slate-700 p-4 rounded-xl">
        <div class="text-xs font-semibold text-slate-400 uppercase">Latest Clerk Timestamp</div>
        <div id="statLatest" class="text-xs font-mono text-cyan-400 mt-2 truncate">N/A</div>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-slate-800/80 border border-slate-700 rounded-xl overflow-hidden shadow-xl">
      <table class="w-full text-left text-sm border-collapse">
        <thead class="bg-slate-800 text-slate-300 border-b border-slate-700 text-xs font-semibold uppercase">
          <tr>
            <th class="p-3">#</th>
            <th class="p-3">App</th>
            <th class="p-3">Event Type</th>
            <th class="p-3">User</th>
            <th class="p-3">Clerk Event Timestamp (`payload.timestamp`)</th>
            <th class="p-3">Data `created_at`</th>
            <th class="p-3">Server Received (+08:00)</th>
          </tr>
        </thead>
        <tbody id="eventsTableBody" class="divide-y divide-slate-700/60 font-mono text-xs text-slate-200">
          <tr>
            <td colspan="7" class="p-6 text-center text-slate-500 italic">No webhooks captured yet. Trigger a Clerk replay to populate events live!</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    async function fetchEvents() {
      try {
        const res = await fetch('/events');
        const data = await res.json();
        renderEvents(data.events || []);
      } catch (err) {
        console.error(err);
      }
    }

    function renderEvents(events) {
      document.getElementById('statTotal').innerText = events.length;
      
      const eventTypes = new Set(events.map(e => e.eventType));
      document.getElementById('statTypes').innerText = eventTypes.size;

      if (events.length > 0) {
        const latestTime = events[0].clerkTopLevelTimestamp?.manila || events[0].serverReceived?.manila;
        const earliestTime = events[events.length - 1].clerkTopLevelTimestamp?.manila || events[events.length - 1].serverReceived?.manila;
        document.getElementById('statLatest').innerText = latestTime;
        document.getElementById('statEarliest').innerText = earliestTime;
      } else {
        document.getElementById('statLatest').innerText = 'N/A';
        document.getElementById('statEarliest').innerText = 'N/A';
      }

      const tbody = document.getElementById('eventsTableBody');
      if (events.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="p-6 text-center text-slate-500 italic">No webhooks captured yet. Trigger a Clerk replay to populate events live!</td></tr>';
        return;
      }

      tbody.innerHTML = events.map((e, idx) => \`
        <tr class="hover:bg-slate-700/40 transition">
          <td class="p-3 text-slate-400 font-semibold">\${events.length - idx}</td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 font-sans text-xs">\${e.appName}</span></td>
          <td class="p-3"><span class="px-2 py-0.5 rounded bg-slate-700 text-slate-200 font-semibold">\${e.eventType}</span></td>
          <td class="p-3 font-sans">
            <div class="font-semibold text-slate-200">\${e.userName}</div>
            <div class="text-[10px] text-slate-400 font-mono">\${e.userEmail !== 'N/A' ? e.userEmail : e.userId}</div>
          </td>
          <td class="p-3 text-cyan-300 font-semibold">\${e.clerkTopLevelTimestamp?.manila || 'N/A'}<br><span class="text-[10px] text-slate-400">\${e.clerkTopLevelTimestamp?.utc || ''}</span></td>
          <td class="p-3 text-indigo-300">\${e.clerkDataCreatedAt?.manila || 'N/A'}<br><span class="text-[10px] text-slate-400">\${e.clerkDataCreatedAt?.utc || ''}</span></td>
          <td class="p-3 text-emerald-400">\${e.serverReceived?.manila}<br><span class="text-[10px] text-slate-400">\${e.serverReceived?.utc}</span></td>
        </tr>
      \`).join('');
    }

    async function clearMemory() {
      if (confirm('Clear all captured events from memory?')) {
        await fetch('/clear', { method: 'POST' });
        fetchEvents();
      }
    }

    setInterval(fetchEvents, 2000);
    fetchEvents();
  </script>
</body>
</html>`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`⚡ Clerk Webhook Memory Listener Server Running`);
  console.log(`--------------------------------------------------`);
  console.log(`Dashboard UI:  http://localhost:${PORT}/`);
  console.log(`Webhook Route: POST http://localhost:${PORT}/webhook/:appName`);
  console.log(`JSON Endpoint: GET http://localhost:${PORT}/events`);
  console.log(`Clear Memory:  POST http://localhost:${PORT}/clear`);
  console.log(`==================================================\n`);
});
