const http = require('http');

// Configuration
const TARGET_URL = 'http://localhost:3005/webhook/ClinicEZ';

// Sample Clerk Webhook Events Simulation Data
const mockEvents = [
  {
    type: 'session.created',
    data: {
      id: 'sess_31A9x02BqK7L9vM12',
      user_id: 'usr_29J8kL1mN3pQ',
      object: 'session',
      status: 'active',
      last_active_at: 1784667251173,
      created_at: 1784667251173,
      updated_at: 1784667251173
    }
  },
  {
    type: 'user.created',
    data: {
      id: 'usr_29J8kL1mN3pQ',
      object: 'user',
      first_name: 'Antigravity',
      last_name: 'Tester',
      image_url: 'https://img.clerk.com/preview.png',
      primary_email_address_id: 'idn_28A9x',
      created_at: 1784667796493,
      updated_at: 1784667796493
    }
  },
  {
    type: 'session.ended',
    data: {
      id: 'sess_31A9x02BqK7L9vM12',
      user_id: 'usr_29J8kL1mN3pQ',
      object: 'session',
      status: 'ended',
      created_at: 1784668290798,
      updated_at: 1784668290798
    }
  },
  {
    type: 'user.updated',
    data: {
      id: 'usr_29J8kL1mN3pQ',
      object: 'user',
      first_name: 'Antigravity',
      last_name: 'Tester (Updated)',
      created_at: 1784675318572,
      updated_at: 1784675318572
    }
  }
];

function sendWebhook(event, index) {
  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(event);
    const nowSec = Math.floor(Date.now() / 1000);
    const svixId = `msg_simulated_${Date.now()}_${index}`;
    const svixTimestamp = `${nowSec}`;
    const svixSignature = `v1,mock_signature_${Math.random().toString(36).substr(2, 8)}`;

    const parsedUrl = new URL(TARGET_URL);

    const req = http.request({
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payloadString),
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature
      }
    }, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        console.log(`[Simulated Event #${index + 1}] Type: ${event.type} -> Response:`, data);
        resolve(data);
      });
    });

    req.on('error', err => {
      console.error(`[Simulation Failed]`, err.message);
      reject(err);
    });

    req.write(payloadString);
    req.end();
  });
}

async function runSimulation() {
  console.log(`\n==================================================`);
  console.log(`🚀 Simulating Incoming Clerk Webhooks to ${TARGET_URL}`);
  console.log(`==================================================\n`);

  for (let i = 0; i < mockEvents.length; i++) {
    await sendWebhook(mockEvents[i], i);
    // Wait 500ms between events
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Simulation Complete! Check your Dashboard at http://localhost:3005/\n`);
}

runSimulation();
