const childProcess = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(candidate));
}

function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.on('error', reject);
    server.listen(0, () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = http.createServer((request, response) => {
      const url = new URL(request.url, 'http://localhost');
      const requested = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
      const filePath = path.normalize(path.join(root, requested));

      if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      fs.readFile(filePath, (error, data) => {
        if (error) {
          response.writeHead(404);
          response.end('Not found');
          return;
        }

        response.writeHead(200, {
          'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
        });
        response.end(data);
      });
    });

    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function getJson(port, pathname) {
  const response = await fetch(`http://127.0.0.1:${port}${pathname}`);
  return response.json();
}

function cdpSend(socket, id, method, params) {
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id !== id) return;
      socket.removeEventListener('message', onMessage);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    };
    socket.addEventListener('message', onMessage);
  });
}

async function waitForLoad(socket) {
  return new Promise((resolve) => {
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.method !== 'Page.loadEventFired') return;
      socket.removeEventListener('message', onMessage);
      resolve();
    };
    socket.addEventListener('message', onMessage);
  });
}

async function waitForDebugPort(port) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      await getJson(port, '/json/version');
      return;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
  throw new Error('Browser debug port did not open.');
}

async function checkViewport(browserPath, appUrl, viewport) {
  const debugPort = await freePort();
  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'v4-layout-check-'));
  const browser = childProcess.spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${debugPort}`,
    `--user-data-dir=${userDataDir}`,
    `--window-size=${viewport.width},${viewport.height}`,
    appUrl
  ], { stdio: 'ignore' });

  const issues = [];

  try {
    await waitForDebugPort(debugPort);
    const pages = await getJson(debugPort, '/json/list');
    const page = pages.find((item) => item.type === 'page') || pages[0];
    const socket = new WebSocket(page.webSocketDebuggerUrl);
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') {
        issues.push(message.params.exceptionDetails.text || 'Runtime exception');
      }
      if (message.method === 'Log.entryAdded' && ['error', 'warning'].includes(message.params.entry.level)) {
        issues.push(`${message.params.entry.level}: ${message.params.entry.text}`);
      }
    });

    await new Promise((resolve) => socket.addEventListener('open', resolve, { once: true }));
    await cdpSend(socket, 1, 'Runtime.enable');
    await cdpSend(socket, 2, 'Log.enable');
    await cdpSend(socket, 3, 'Page.enable');
    await cdpSend(socket, 4, 'Page.navigate', { url: appUrl });
    await waitForLoad(socket);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const expression = `(() => ({
      title: document.title,
      innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyScrollWidth: document.body.scrollWidth,
      clients: document.querySelectorAll('.client-btn:not(.admin-client-btn)').length,
      metricCards: document.querySelectorAll('.metric-card').length,
      hasSyncAll: Boolean(document.querySelector('[data-action="sync-all-clients"]'))
    }))()`;
    const result = await cdpSend(socket, 5, 'Runtime.evaluate', { expression, returnByValue: true });
    socket.close();

    const pageState = result.result.value;
    if (pageState.title !== 'V4 Command Center') throw new Error(`Unexpected title: ${pageState.title}`);
    if (pageState.clients !== 9) throw new Error(`Expected 9 official clients, found ${pageState.clients}.`);
    if (!pageState.hasSyncAll) throw new Error('Sync all button was not rendered.');
    if (pageState.metricCards < 5) throw new Error('Metric cards did not render.');
    if (pageState.scrollWidth > pageState.innerWidth + 2 || pageState.bodyScrollWidth > pageState.innerWidth + 2) {
      throw new Error(`Horizontal overflow at ${viewport.name}: ${pageState.scrollWidth}/${pageState.innerWidth}.`);
    }
    if (issues.length) throw new Error(`Browser issues at ${viewport.name}: ${issues.join(' | ')}`);

    return pageState;
  } finally {
    browser.kill();
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        fs.rmSync(userDataDir, { recursive: true, force: true });
        break;
      } catch (error) {
        await sleep(150);
      }
    }
  }
}

(async () => {
  const browserPath = findBrowser();
  if (!browserPath) throw new Error('Chrome or Edge was not found for layout checks.');

  const server = await startStaticServer();
  const { port } = server.address();
  const appUrl = `http://127.0.0.1:${port}`;

  try {
    const desktop = await checkViewport(browserPath, appUrl, { name: 'desktop', width: 1440, height: 1000 });
    const mobile = await checkViewport(browserPath, appUrl, { name: 'mobile', width: 390, height: 900 });
    console.log(JSON.stringify({ ok: true, desktop, mobile }, null, 2));
  } finally {
    server.close();
  }
})().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
