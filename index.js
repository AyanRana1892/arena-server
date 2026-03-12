const WebSocket = require('ws');

const PORT = process.env.PORT || 8765;
const wss  = new WebSocket.Server({ port: PORT });

const clients = {};

console.log('════════════════════════════════════');
console.log('  Arena WebSocket Server');
console.log(`  Running on port ${PORT}`);
console.log('  Waiting for cars to connect...');
console.log('════════════════════════════════════');

wss.on('connection', (ws) => {
  let role = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);

      // ── Register ──────────────────────────────────────────
      if (data.type === 'register') {
        role = data.role;
        clients[role] = ws;
        console.log(`${role} connected. Online: [${Object.keys(clients).join(', ')}]`);

        const peer = role === 'car1' ? 'car2' : 'car1';

        // Tell peer this car is now online
        if (clients[peer] && clients[peer].readyState === WebSocket.OPEN) {
          clients[peer].send(JSON.stringify({
            type:   'peer_status',
            role:   role,
            online: true
          }));
          // Tell this car that peer is already online
          ws.send(JSON.stringify({
            type:   'peer_status',
            role:   peer,
            online: true
          }));
        }

      // ── Forward everything else to peer ───────────────────
      } else {
        const peer = role === 'car1' ? 'car2' : 'car1';
        if (clients[peer] && clients[peer].readyState === WebSocket.OPEN) {
          clients[peer].send(JSON.stringify(data));
        }
      }

    } catch (e) {
      console.log('Message error:', e.message);
    }
  });

  ws.on('close', () => {
    if (role && clients[role]) {
      delete clients[role];
      console.log(`${role} disconnected. Online: [${Object.keys(clients).join(', ')}]`);

      const peer = role === 'car1' ? 'car2' : 'car1';
      if (clients[peer] && clients[peer].readyState === WebSocket.OPEN) {
        clients[peer].send(JSON.stringify({
          type:   'peer_status',
          role:   role,
          online: false
        }));
      }
    }
  });

  ws.on('error', (err) => {
    console.log('WebSocket error:', err.message);
  });
});
