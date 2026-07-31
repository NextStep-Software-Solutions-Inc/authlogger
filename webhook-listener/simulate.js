const http = require('http');

const TARGET_URL = 'http://localhost:3005/webhook/ClinicEZ';

// Exact Clerk Webhook Event Structure Sample
const sampleClerkEvent = {
  data: {
    abandon_at: 1788065923864,
    actor: null,
    client_id: "client_3CCgWLnLC1sCeuFpMo7wNqZfQiU",
    created_at: 1785473923864,
    expire_at: 1786078723864,
    id: "sess_3HFpyDbXDd67Zbt0J8kq1z3JPWN",
    last_active_at: 1785473923864,
    object: "session",
    status: "active",
    updated_at: 1785473923929,
    user: {
      backup_code_enabled: false,
      banned: false,
      bypass_client_trust: false,
      create_organization_enabled: true,
      created_at: 1761068826906,
      delete_self_enabled: true,
      deprovisioned: false,
      email_addresses: [
        {
          created_at: 1761068826913,
          email_address: "avesmarriann@gmail.com",
          id: "idn_34NzTfEbg0sqwuUGwPSxZduaRW8",
          linked_to: [],
          matches_sso_connection: false,
          object: "email_address",
          reserved: false,
          updated_at: 1761068826913,
          verification: {
            attempts: null,
            expire_at: null,
            object: "verification_admin",
            status: "verified",
            strategy: "admin"
          }
        }
      ],
      first_name: "Marriann",
      last_name: "Aves",
      id: "user_34NzTg5A0pgMSNuCDoGYQ2WBjae",
      image_url: "https://img.clerk.com/preview.png",
      last_active_at: 1781513654396,
      last_sign_in_at: 1785473923864,
      object: "user",
      username: "avesmarriann"
    },
    user_id: "user_34NzTg5A0pgMSNuCDoGYQ2WBjae"
  },
  event_attributes: {
    http_request: {
      client_ip: "202.61.110.134",
      user_agent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"
    }
  },
  instance_id: "ins_32TBhffptqoermAgIPrDm5dKQTE",
  object: "event",
  timestamp: 1785473923937,
  type: "session.created"
};

function sendWebhook(event) {
  return new Promise((resolve, reject) => {
    const payloadString = JSON.stringify(event);
    const nowSec = Math.floor(Date.now() / 1000);
    const svixId = `msg_${event.data.id || Date.now()}`;
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
        console.log(`[Simulated Sample Payload] Type: ${event.type} | User: ${event.data.user.first_name} ${event.data.user.last_name} -> Response:`, data);
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
  console.log(`🚀 Sending Sample Clerk Webhook Payload to ${TARGET_URL}`);
  console.log(`==================================================\n`);

  await sendWebhook(sampleClerkEvent);

  console.log(`\n✅ Simulation Complete! Check your Dashboard at http://localhost:3005/\n`);
}

runSimulation();
